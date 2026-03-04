<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function update(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:PENDING,PAID,REFUNDED,FAILED'],
        ]);

        $payment = Payment::findOrFail($id);
        $payment->update(['status' => $validated['status']]);

        $payment->load(['order', 'user']);

        return response()->json([
            'message' => 'Payment status updated',
            'data' => [
                'id' => $payment->id,
                'orderId' => $payment->order_id,
                'method' => $payment->method,
                'amount' => (float) $payment->amount,
                'status' => $payment->status,
                'senderNumber' => $payment->sender_number,
                'transactionId' => $payment->transaction_id,
            ],
        ]);
    }
}
