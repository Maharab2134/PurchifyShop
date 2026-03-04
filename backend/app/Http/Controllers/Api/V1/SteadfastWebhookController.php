<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Shipment;
use App\Services\SteadfastService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SteadfastWebhookController extends Controller
{
    /**
     * Handle Steadfast Courier webhook (delivery status updates).
     * Configure callback URL in Steadfast merchant portal to: {your-domain}/api/v1/webhooks/steadfast
     * Set STEADFAST_WEBHOOK_BEARER_TOKEN in .env and use the same token in Steadfast portal.
     */
    public function handle(Request $request): JsonResponse
    {
        $token = $request->header('Authorization');
        $webhookToken = SteadfastService::getWebhookBearerToken();
        $expected = $webhookToken ? 'Bearer ' . $webhookToken : null;

        if (! $expected) {
            Log::warning('Steadfast webhook: no bearer token configured');
            return response()->json(['error' => 'Webhook not configured'], 501);
        }

        if ($token !== $expected) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $payload = $request->all();
        $required = ['consignment_id', 'invoice', 'status', 'cod_amount', 'updated_at'];
        $missing = array_diff($required, array_keys($payload));
        if (! empty($missing)) {
            return response()->json(['error' => 'Missing required properties: ' . implode(', ', $missing)], 400);
        }

        try {
            $this->processPayload($payload);
            return response()->json(['status' => 'success'], 200);
        } catch (\Throwable $e) {
            Log::error('Steadfast webhook processing failed', [
                'payload' => $payload,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }

    private function processPayload(array $payload): void
    {
        $consignmentId = $payload['consignment_id'];
        $invoice = $payload['invoice'] ?? null;
        $status = (string) ($payload['status'] ?? '');

        // Find order by steadfast_consignment_id or by tracking_number (invoice)
        $shipment = Shipment::where('steadfast_consignment_id', $consignmentId)->first();
        if (! $shipment && $invoice) {
            $shipment = Shipment::where('courier_tracking_id', $invoice)
                ->orWhereHas('order', fn ($q) => $q->where('tracking_number', $invoice))
                ->first();
        }

        if (! $shipment) {
            Log::info('Steadfast webhook: no shipment found', ['consignment_id' => $consignmentId, 'invoice' => $invoice]);
            return;
        }

        $order = $shipment->order;
        $newOrderStatus = $this->mapSteadfastStatusToOrder($status);

        if ($newOrderStatus) {
            $order->update(['status' => $newOrderStatus]);
            if ($order->transaction) {
                $order->transaction->update(['status' => $newOrderStatus]);
            }
        }

        if (in_array($status, ['delivered', 'partial_delivered'], true)) {
            $shipment->update(['delivery_date' => now()]);
        }
    }

    private function mapSteadfastStatusToOrder(string $steadfastStatus): ?string
    {
        return match ($steadfastStatus) {
            'delivered' => 'DELIVERED',
            'partial_delivered' => 'DELIVERED',
            'cancelled', 'cancelled_approval_pending' => 'CANCELED',
            'hold', 'in_review', 'pending' => null,
            default => null,
        };
    }
}
