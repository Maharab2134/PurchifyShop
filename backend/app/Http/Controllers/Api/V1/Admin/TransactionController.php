<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TransactionController extends Controller
{
    /**
     * List transactions (payment-centric). Each transaction has order + payment.
     * Filter by payment status. Payment status is updated from Transactions page.
     */
    public function index(Request $request): JsonResponse
    {
        $q = Transaction::with(['order.user', 'order.payment'])->orderByDesc('transaction_date');

        $vendorId = $this->resolveVendorId();
        if ($vendorId !== null) {
            $q->whereHas('order.orderItems.variant.product', function ($p) use ($vendorId) {
                $p->where('vendor_id', $vendorId);
            });
        }

        if ($request->filled('status')) {
            $q->whereHas('order.payment', fn ($p) => $p->where('status', $request->input('status')));
        }
        if ($request->filled('search')) {
            $term = '%' . trim($request->input('search')) . '%';
            $q->where(function ($query) use ($term) {
                $query->where('id', 'like', $term)
                    ->orWhere('order_id', 'like', $term)
                    ->orWhereHas('order', function ($o) use ($term) {
                        $o->where('id', 'like', $term)
                            ->orWhere('tracking_number', 'like', $term)
                            ->orWhere('contact_phone', 'like', $term)
                            ->orWhereHas('user', function ($u) use ($term) {
                                $u->where('name', 'like', $term)->orWhere('email', 'like', $term);
                            });
                    })
                    ->orWhereHas('order.payment', function ($p) use ($term) {
                        $p->where('transaction_id', 'like', $term)
                            ->orWhere('sender_number', 'like', $term);
                    });
            });
        }

        $tx = $q->paginate((int) $request->input('limit', 20));
        $data = $tx->getCollection()->map(function ($t) {
            $order = $t->relationLoaded('order') && $t->order ? $t->order : null;
            $payment = $order && $order->relationLoaded('payment') && $order->payment ? $order->payment : null;
            return [
                'id' => $t->id,
                'orderId' => $t->order_id,
                'status' => $t->status,
                'transactionDate' => $t->transaction_date?->toIso8601String(),
                'order' => $order ? [
                    'id' => $order->id,
                    'amount' => (float) $order->amount,
                    'user' => $order->relationLoaded('user') && $order->user
                        ? ['id' => $order->user->id, 'name' => $order->user->name, 'email' => $order->user->email]
                        : null,
                ] : null,
                'payment' => $payment ? [
                    'id' => $payment->id,
                    'method' => $payment->method,
                    'amount' => (float) $payment->amount,
                    'status' => $payment->status,
                    'senderNumber' => $payment->sender_number,
                    'transactionId' => $payment->transaction_id,
                ] : null,
            ];
        });

        return response()->json([
            'data' => [
                'transactions' => $data,
                'totalResults' => $tx->total(),
                'totalPages' => $tx->lastPage(),
                'currentPage' => $tx->currentPage(),
            ],
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        try {
            $transaction = Transaction::findOrFail($id);
            
            // Delete related payment if exists
            if ($transaction->order && $transaction->order->payment) {
                $transaction->order->payment->delete();
            }
            
            // Delete the transaction
            $transaction->delete();
            
            return response()->json([
                'message' => 'Transaction deleted successfully',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Transaction not found',
            ], 404);
        }
    }

    private function resolveVendorId(): ?string
    {
        $user = Auth::user();
        if (! $user) {
            return null;
        }

        return strtoupper((string) $user->role) === 'VENDOR' ? ($user->vendor_id ?: null) : null;
    }
}
