<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use App\Models\Shipment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SteadfastService
{
    /** Get credentials: admin panel (Setting) first, then .env config */
    public static function getApiKey(): ?string
    {
        $v = Setting::getValue('steadfast_api_key');
        if ($v !== null && $v !== '') {
            return $v;
        }
        $c = config('steadfast-courier.api_key');
        return ($c !== null && $c !== '' && $c !== 'your-api-key') ? $c : null;
    }

    public static function getSecretKey(): ?string
    {
        $v = Setting::getValue('steadfast_secret_key');
        if ($v !== null && $v !== '') {
            return $v;
        }
        $c = config('steadfast-courier.secret_key');
        return ($c !== null && $c !== '') ? $c : null;
    }

    public static function getBaseUrl(): string
    {
        $v = Setting::getValue('steadfast_base_url');
        if ($v !== null && $v !== '') {
            return rtrim($v, '/');
        }
        $c = config('steadfast-courier.base_url');
        return $c ? rtrim($c, '/') : 'https://portal.packzy.com/api/v1';
    }

    public static function getWebhookBearerToken(): ?string
    {
        $v = Setting::getValue('steadfast_webhook_bearer_token');
        if ($v !== null && $v !== '') {
            return $v;
        }
        return config('steadfast-courier.webhook_bearer_token') ?: config('services.steadfast.webhook_bearer_token');
    }

    private function apiKey(): ?string
    {
        return self::getApiKey();
    }

    private function secretKey(): ?string
    {
        return self::getSecretKey();
    }

    private function baseUrl(): string
    {
        return self::getBaseUrl();
    }

    private function request(string $method, string $path, array $data = []): array
    {
        $key = $this->apiKey();
        $secret = $this->secretKey();
        if (! $key || ! $secret) {
            return ['status' => 0, 'message' => 'Steadfast API is not configured.'];
        }
        $url = $this->baseUrl() . $path;
        $headers = [
            'Api-Key' => $key,
            'Secret-Key' => $secret,
            'Content-Type' => 'application/json',
            'Accept' => 'application/json',
        ];
        if ($method === 'GET') {
            $response = Http::withHeaders($headers)->get($url);
        } else {
            $response = Http::withHeaders($headers)->post($url, $data);
        }

        $statusCode = $response->status();
        $bodyString = $response->body();
        $body = $response->json();

        if (is_array($body)) {
            // Even on 500, Steadfast may return JSON with a message
            if ($statusCode >= 400 && isset($body['message'])) {
                Log::warning('Steadfast API error response', [
                    'url' => $url,
                    'status' => $statusCode,
                    'message' => $body['message'],
                ]);
            }
            return $body;
        }

        $hint = $statusCode === 401 || $statusCode === 403
            ? 'Check API Key and Secret in Courier → Settings → Steadfast Settings.'
            : ($statusCode === 404
                ? 'Check Base URL in Courier → Settings (e.g. https://portal.packzy.com/api/v1).'
                : ($statusCode >= 500
                    ? 'Steadfast server returned 500. In Courier → Settings → Steadfast Settings set Base URL to exactly https://portal.packzy.com/api/v1 and Save. If it is already set, the error is on Steadfast\'s server — see storage/logs/laravel.log for the URL called.'
                    : 'Check Base URL and credentials in Courier → Settings → Steadfast Settings.'));
        Log::warning('Steadfast API non-JSON response', [
            'url' => $url,
            'status' => $statusCode,
            'body_preview' => strlen($bodyString) > 300 ? substr($bodyString, 0, 300) . '...' : $bodyString,
        ]);

        return [
            'status' => 0,
            'message' => "Steadfast API returned an unexpected response (HTTP {$statusCode}). {$hint}",
        ];
    }
    /**
     * Build Steadfast API payload from an order (invoice, recipient, COD, note).
     * Payload is sanitized to avoid 500s from invalid/empty values.
     */
    public function buildOrderPayload(Order $order): array
    {
        $order->loadMissing(['address', 'user']);
        $address = $order->address;
        $user = $order->user;

        $parts = array_filter([
            $address?->street,
            $address?->city,
            $address?->state,
            $address?->country,
            $address?->zip,
        ]);
        $recipientAddress = $parts ? implode(', ', array_map('trim', $parts)) : 'N/A';
        $recipientAddress = mb_substr(trim($recipientAddress), 0, 250); // API doc: within 250 characters

        $recipientName = trim($user?->name ?? 'Customer');
        $recipientName = $recipientName !== '' ? mb_substr($recipientName, 0, 100) : 'Customer'; // API doc: within 100 characters

        $rawPhone = $order->contact_phone ?? $user?->phone ?? '';
        $recipientPhone = preg_replace('/\D/', '', (string) $rawPhone);
        if ($recipientPhone === '') {
            $recipientPhone = '0000000000';
        }
        // API doc: Must be 11 digits (e.g. 01234567890). Take last 11 if longer (e.g. 880...)
        if (strlen($recipientPhone) > 11) {
            $recipientPhone = substr($recipientPhone, -11);
        }
        $recipientPhone = substr($recipientPhone, 0, 11);

        $codAmount = (int) round((float) $order->amount);
        if ($codAmount < 0) {
            $codAmount = 0;
        }

        $invoice = (string) ($order->tracking_number ?? $order->id);
        $invoice = preg_replace('/\s+/', '', $invoice);
        $invoice = mb_substr($invoice, 0, 100) ?: 'ORD-' . substr($order->id, 0, 8);

        $weightKg = $order->parcel_weight !== null && (float) $order->parcel_weight > 0
            ? (float) $order->parcel_weight
            : null;

        $note = 'Order #' . ($order->tracking_number ?? substr($order->id, 0, 8));
        if ($weightKg !== null) {
            $note .= '. Weight: ' . number_format($weightKg, 2) . ' kg';
        }
        $note = mb_substr(trim($note), 0, 255);

        $payload = [
            'invoice' => $invoice,
            'recipient_name' => $recipientName,
            'recipient_phone' => $recipientPhone,
            'recipient_address' => $recipientAddress,
            'cod_amount' => $codAmount,
            'note' => $note,
        ];
        if ($weightKg !== null) {
            $payload['weight'] = $weightKg;
            $payload['product_weight'] = $weightKg; // some APIs use this key
        }
        return $payload;
    }

    /**
     * Create a Steadfast parcel for the order and save consignment + tracking to shipment.
     */
    public function createParcel(Order $order): array
    {
        if (! $this->apiKey() || ! $this->secretKey()) {
            return [
                'success' => false,
                'message' => 'Steadfast API is not configured. Set credentials in Courier → Steadfast Settings.',
            ];
        }

        $order->refresh(); // ensure latest parcel_weight from DB (admin may have just saved it)
        $payload = $this->buildOrderPayload($order);
        $response = $this->request('POST', '/create_order', $payload);

        $status = $response['status'] ?? null;
        $consignment = $response['consignment'] ?? null;

        if ($status === 200 && $consignment) {
            $consignmentId = $consignment['consignment_id'] ?? null;
            $trackingCode = $consignment['tracking_code'] ?? null;

            $weight = $order->parcel_weight !== null ? (float) $order->parcel_weight : null;
            $shipment = $order->shipment;
            if (! $shipment) {
                $shipment = Shipment::create([
                    'order_id' => $order->id,
                    'carrier' => 'Steadfast',
                    'courier_company' => 'Steadfast',
                    'courier_tracking_id' => $trackingCode,
                    'steadfast_consignment_id' => $consignmentId,
                    'tracking_number' => $trackingCode,
                    'weight' => $weight,
                    'shipped_date' => now(),
                ]);
            } else {
                $shipment->update([
                    'carrier' => 'Steadfast',
                    'courier_company' => 'Steadfast',
                    'courier_tracking_id' => $trackingCode,
                    'steadfast_consignment_id' => $consignmentId,
                    'tracking_number' => $trackingCode,
                    'weight' => $weight,
                ]);
            }

            $order->update(['status' => 'IN_TRANSIT']);
            if ($order->transaction) {
                $order->transaction->update(['status' => 'IN_TRANSIT']);
            }

            return [
                'success' => true,
                'message' => $response['message'] ?? 'Consignment created successfully.',
                'consignment_id' => $consignmentId,
                'tracking_code' => $trackingCode,
                'consignment' => $consignment,
            ];
        }

        $message = $response['message'] ?? $response['errors'] ?? 'Steadfast API error';
        if (is_array($message)) {
            $message = json_encode($message);
        }
        if (stripos((string) $message, 'invalid') !== false || stripos((string) $message, 'unauthorized') !== false) {
            $message = rtrim($message, '.') . '. Check API Key and Secret in Courier → Settings → Steadfast Settings.';
        }
        Log::warning('Steadfast create_order failed', ['order_id' => $order->id, 'response' => $response]);

        return [
            'success' => false,
            'message' => $message,
            'response' => $response,
        ];
    }

    /**
     * Check delivery status by consignment ID or tracking code.
     */
    public function checkStatus(Order $order): array
    {
        if (! $this->apiKey() || ! $this->secretKey()) {
            return [
                'success' => false,
                'message' => 'Steadfast API is not configured.',
            ];
        }

        $shipment = $order->shipment;
        if (! $shipment || ($shipment->steadfast_consignment_id === null && ! $shipment->courier_tracking_id)) {
            return [
                'success' => false,
                'message' => 'No Steadfast consignment or tracking ID for this order.',
            ];
        }

        if ($shipment->steadfast_consignment_id) {
            $response = $this->request('GET', '/status_by_cid/' . $shipment->steadfast_consignment_id);
        } else {
            $response = $this->request('GET', '/status_by_trackingcode/' . $shipment->courier_tracking_id);
        }

        $status = $response['status'] ?? null;
        $deliveryStatus = $response['delivery_status'] ?? null;

        if ($status === 200) {
            return [
                'success' => true,
                'delivery_status' => $deliveryStatus,
                'response' => $response,
            ];
        }

        return [
            'success' => false,
            'message' => $response['message'] ?? 'Failed to get status',
            'response' => $response,
        ];
    }

    /** Get current balance from Steadfast API */
    public function getCurrentBalance(): array
    {
        if (! $this->apiKey() || ! $this->secretKey()) {
            return ['status' => 0, 'message' => 'Steadfast API is not configured.', 'current_balance' => null];
        }
        return $this->request('GET', '/get_balance');
    }

    /**
     * Cancel/remove order from Steadfast: optionally call Steadfast cancel API, then clear our shipment link.
     * After this, the order is no longer linked to Steadfast; cancel on Steadfast portal manually if needed.
     */
    public function cancelConsignment(Order $order): array
    {
        $shipment = $order->shipment;
        if (! $shipment || ($shipment->steadfast_consignment_id === null && ! $shipment->courier_tracking_id)) {
            return [
                'success' => false,
                'message' => 'No Steadfast consignment or tracking ID for this order.',
            ];
        }

        $consignmentId = $shipment->steadfast_consignment_id;
        $apiCancelled = false;
        if ($consignmentId && $this->apiKey() && $this->secretKey()) {
            $response = $this->request('POST', '/cancel_order', ['consignment_id' => $consignmentId]);
            if (($response['status'] ?? null) === 200) {
                $apiCancelled = true;
            } else {
                Log::info('Steadfast cancel_order not supported or failed; clearing local link only.', [
                    'order_id' => $order->id,
                    'consignment_id' => $consignmentId,
                    'response' => $response,
                ]);
            }
        }

        $shipment->update([
            'carrier' => '', // NOT NULL; clear so order is no longer "Steadfast" and Create parcel can show again
            'courier_company' => null,
            'steadfast_consignment_id' => null,
            'courier_tracking_id' => null,
            'tracking_number' => '', // NOT NULL; empty string when Steadfast link is cleared
        ]);
        $order->update(['status' => 'PROCESSING']);
        if ($order->transaction) {
            $order->transaction->update(['status' => 'PROCESSING']);
        }

        return [
            'success' => true,
            'message' => $apiCancelled
                ? 'Consignment cancelled in Steadfast and removed from this order.'
                : 'Steadfast link removed from this order. If the parcel was already created, cancel it manually at Steadfast portal (portal.packzy.com or steadfast.com.bd).',
        ];
    }
}
