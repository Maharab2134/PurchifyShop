<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use App\Models\IncompleteOrder;
use App\Services\EmailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IncompleteOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = IncompleteOrder::with('user')->orderByDesc('visited_at');
        
        if ($request->filled('userId')) {
            $q->where('user_id', $request->input('userId'));
        }
        if ($request->filled('dateFrom')) {
            $q->where('visited_at', '>=', $request->input('dateFrom'));
        }
        if ($request->filled('dateTo')) {
            $q->where('visited_at', '<=', $request->input('dateTo'));
        }
        if ($request->filled('search')) {
            $term = '%' . trim($request->input('search')) . '%';
            $q->where(function ($query) use ($term) {
                $query->where('id', 'like', $term)
                    ->orWhereHas('user', function ($u) use ($term) {
                        $u->where('name', 'like', $term)->orWhere('email', 'like', $term);
                    });
            });
        }

        $perPage = $request->input('limit', 50);
        $incomplete = $q->paginate($perPage);
        
        $data = $incomplete->getCollection()->map(fn ($io) => $this->resource($io));
        
        return response()->json([
            'data' => [
                'incompleteOrders' => $data,
                'totalResults' => $incomplete->total(),
                'totalPages' => $incomplete->lastPage(),
                'currentPage' => $incomplete->currentPage(),
                'resultsPerPage' => $incomplete->perPage(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $io = IncompleteOrder::with('user', 'cart')->findOrFail($id);
        return response()->json(['data' => $this->resource($io, true)]);
    }

    public function destroy(string $id): JsonResponse
    {
        try {
            $incompleteOrder = IncompleteOrder::findOrFail($id);
            $incompleteOrder->delete();
            
            return response()->json([
                'message' => 'Incomplete order deleted successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Incomplete order not found',
            ], 404);
        }
    }

    /**
     * POST /api/v1/admin/incomplete-orders/{id}/send-marketing
     * Sends a marketing message email using the "Incomplete Order Marketing" email template.
     */
    public function sendMarketing(Request $request, string $id): JsonResponse
    {
        $io = IncompleteOrder::with('user')->findOrFail($id);
        $user = $io->user;
        if (!$user || !$user->email) {
            return response()->json([
                'message' => 'No email address for this user. Cannot send marketing message.',
            ], 400);
        }

        $template = EmailTemplate::where('event_type', 'incomplete_order_marketing')->first();
        if (!$template || !$template->is_enabled) {
            return response()->json([
                'message' => 'Email template "Incomplete Order Marketing" not found or disabled. Create/enable it in Admin → Email Templates.',
            ], 400);
        }

        $name = $user->name ?: 'Customer';
        $storeUrl = rtrim(config('app.frontend_url', config('app.url', '')), '/');
        $variables = [
            'user_name' => $name,
            'user_email' => $user->email,
            'store_url' => $storeUrl,
        ];

        try {
            (new EmailService())->sendTemplateEmail(
                $template,
                $user->email,
                $name,
                $variables,
                'IncompleteOrder',
                $io->id
            );
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Failed to send email: ' . $e->getMessage(),
            ], 500);
        }

        return response()->json(['message' => 'Marketing message sent successfully']);
    }

    private function resource(IncompleteOrder $io, bool $includeDetails = false): array
    {
        $out = [
            'id' => $io->id,
            'userId' => $io->user_id,
            'user' => $io->relationLoaded('user') && $io->user ? [
                'id' => $io->user->id,
                'name' => $io->user->name,
                'email' => $io->user->email,
            ] : null,
            'sessionId' => $io->session_id,
            'subtotal' => (float) $io->subtotal,
            'visitedAt' => $io->visited_at?->toIso8601String(),
            'createdAt' => $io->created_at?->toIso8601String(),
        ];

        if ($includeDetails && $io->items) {
            $out['items'] = $io->items;
        }

        return $out;
    }
}
