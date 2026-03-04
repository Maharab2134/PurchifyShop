<?php

namespace App\Observers;

use App\Models\Order;
use App\Models\EmailTemplate;
use App\Services\EmailService;

class OrderObserver
{
    protected EmailService $emailService;

    public function __construct(EmailService $emailService)
    {
        $this->emailService = $emailService;
    }

    /**
     * Handle the Order "created" event.
     * Note: order_created email is sent from CheckoutController after address is linked,
     * so Items and Shipping address are available in the email.
     */
    public function created(Order $order): void
    {
    }

    /**
     * Handle the Order "updated" event.
     */
    public function updated(Order $order): void
    {
        // Check if status changed
        if ($order->wasChanged('status')) {
            $status = strtolower($order->status);
            // No email for pending or generic status updates
            $eventType = match($status) {
                'processing' => 'order_processing',
                'shipped' => 'order_shipped',
                'in_transit' => 'order_in_transit',
                'delivered' => 'order_delivered',
                'canceled', 'cancelled' => 'order_cancelled',
                'returned' => 'order_returned',
                'refunded' => 'order_refunded',
                default => null,
            };
            if ($eventType !== null) {
                $this->sendOrderEmail($order, $eventType);
            }
        }
    }

    /**
     * Send email for order event
     */
    protected function sendOrderEmail(Order $order, string $eventType): void
    {
        try {
            $template = EmailTemplate::where('event_type', $eventType)
                ->where('is_enabled', true)
                ->first();

            if (!$template) {
                \Log::info('No email template found or template disabled', [
                    'order_id' => $order->id,
                    'event_type' => $eventType,
                ]);
                return; // No template configured or disabled
            }

            // Load order relationships if not already loaded
            if (!$order->relationLoaded('user')) {
                $order->load('user');
            }
            if (!$order->relationLoaded('orderItems')) {
                $order->load(['orderItems.variant.product', 'orderItems.size']);
            }
            if (!$order->relationLoaded('address')) {
                $order->load('address');
            }
            if (!$order->relationLoaded('shippingOption')) {
                $order->load('shippingOption');
            }

            if (!$order->user || !$order->user->email) {
                \Log::warning('Cannot send order email: No user or email found', [
                    'order_id' => $order->id,
                    'event_type' => $eventType,
                ]);
                return; // No user or email
            }

            // Get variables
            $variables = EmailService::getOrderVariables($order, $order->user);

            if (in_array($eventType, ['order_shipped', 'order_in_transit'], true) && $order->tracking_number) {
                $variables['tracking_number'] = $order->tracking_number;
                $variables['carrier'] = $order->shippingOption?->name ?? 'Standard Shipping';
            }

            if ($eventType === 'order_delivered') {
                $variables['delivery_date'] = now()->format('F d, Y');
            }

            // Send email to the user who placed the order
            $this->emailService->sendTemplateEmail(
                $template,
                $order->user->email,
                $order->user->name,
                $variables,
                'Order',
                $order->id
            );
            
            \Log::info('Order status update email sent successfully', [
                'order_id' => $order->id,
                'user_email' => $order->user->email,
                'event_type' => $eventType,
                'status' => $order->status,
            ]);
        } catch (\Exception $e) {
            // Log error but don't break the order process
            \Log::error('Failed to send order email: ' . $e->getMessage(), [
                'order_id' => $order->id,
                'event_type' => $eventType,
            ]);
        }
    }

    /**
     * Handle the Order "deleted" event.
     */
    public function deleted(Order $order): void
    {
        //
    }

    /**
     * Handle the Order "restored" event.
     */
    public function restored(Order $order): void
    {
        //
    }

    /**
     * Handle the Order "force deleted" event.
     */
    public function forceDeleted(Order $order): void
    {
        //
    }
}
