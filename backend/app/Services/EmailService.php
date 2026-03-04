<?php

namespace App\Services;

use App\Models\EmailSetting;
use App\Models\EmailTemplate;
use App\Models\EmailLog;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Config;

class EmailService
{
    /**
     * Send email using a template with dynamic variables
     */
    public function sendTemplateEmail(
        EmailTemplate $template,
        string $recipientEmail,
        string $recipientName,
        array $variables = [],
        ?string $relatedModelType = null,
        ?string $relatedModelId = null
    ): bool {
        if (!$template->is_enabled) {
            return false;
        }

        $settings = EmailSetting::getSettings();
        if (!$settings->is_active) {
            return false;
        }

        // Configure mail settings
        $this->configureMailSettings($settings);

        // Auto-generate subject if empty
        $subjectTemplate = $template->subject;
        if (empty(trim($subjectTemplate))) {
            $subjectTemplate = $this->generateDefaultSubject($template->event_type, $variables);
        }
        
        // Replace variables in subject and body
        $subject = $this->replaceVariables($subjectTemplate, $variables);
        $bodyHtml = $this->replaceVariables($template->body_html, $variables);
        $bodyText = $template->body_text ? $this->replaceVariables($template->body_text, $variables) : strip_tags($bodyHtml);

        // Create email log
        $log = EmailLog::create([
            'template_id' => $template->id,
            'event_type' => $template->event_type,
            'recipient_email' => $recipientEmail,
            'recipient_name' => $recipientName,
            'subject' => $subject,
            'body_html' => $bodyHtml,
            'status' => 'pending',
            'variables_used' => $variables,
            'related_model_type' => $relatedModelType,
            'related_model_id' => $relatedModelId,
        ]);

        try {
            Mail::send([], [], function ($message) use ($recipientEmail, $recipientName, $subject, $bodyHtml, $bodyText, $settings) {
                $message->to($recipientEmail, $recipientName)
                        ->subject($subject)
                        ->from($settings->from_address, $settings->from_name)
                        ->html($bodyHtml);
                if ($bodyText) {
                    $message->text($bodyText);
                }
            });

            $log->update([
                'status' => 'sent',
                'sent_at' => now(),
            ]);

            return true;
        } catch (\Exception $e) {
            $log->update([
                'status' => 'failed',
                'error_message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Generate default subject based on event type and variables
     */
    private function generateDefaultSubject(string $eventType, array $variables): string
    {
        $orderId = $variables['order_id'] ?? '';
        $orderStatus = $variables['order_status'] ?? '';
        $userName = $variables['user_name'] ?? 'Customer';
        
        $vendorName = $variables['vendor_name'] ?? 'Vendor';
        return match($eventType) {
            'order_created' => "Order #{$orderId} Confirmed - Thank You {$userName}!",
            'order_processing' => "Order #{$orderId} Is Processing",
            'order_shipped' => "Order #{$orderId} Has Been Shipped!",
            'order_in_transit' => "Order #{$orderId} Is In Transit",
            'order_delivered' => "Order #{$orderId} Has Been Delivered!",
            'order_cancelled', 'order_canceled' => "Order #{$orderId} Has Been Cancelled",
            'order_returned' => "Order #{$orderId} Has Been Returned",
            'order_refunded' => "Order #{$orderId} Has Been Refunded",
            'vendor_approved' => "Your Vendor Application ({$vendorName}) Has Been Approved",
            default => "Order #{$orderId} - {$orderStatus}",
        };
    }

    /**
     * Replace variables in template string
     */
    private function replaceVariables(string $template, array $variables): string
    {
        $result = $template;
        foreach ($variables as $key => $value) {
            $result = str_replace('{{' . $key . '}}', $value ?? '', $result);
            $result = str_replace('{{ ' . $key . ' }}', $value ?? '', $result);
        }
        return $result;
    }

    /**
     * Send a simple HTML email using Admin Email Settings (same SMTP/from as templates).
     * Use this when no template is needed (e.g. vendor approval).
     */
    public function sendSimpleEmail(string $toEmail, string $toName, string $subject, string $bodyHtml): bool
    {
        $settings = EmailSetting::getSettings();
        if (!$settings->is_active) {
            return false;
        }
        $this->configureMailSettings($settings);
        try {
            Mail::send([], [], function ($message) use ($toEmail, $toName, $subject, $bodyHtml, $settings) {
                $message->to($toEmail, $toName)
                    ->subject($subject)
                    ->from($settings->from_address, $settings->from_name)
                    ->html($bodyHtml);
            });
            return true;
        } catch (\Throwable $e) {
            report($e);
            return false;
        }
    }

    /**
     * Configure mail settings dynamically
     */
    private function configureMailSettings(EmailSetting $settings): void
    {
        Config::set('mail.default', $settings->mailer);
        
        if ($settings->mailer === 'smtp') {
            Config::set('mail.mailers.smtp.host', $settings->host);
            Config::set('mail.mailers.smtp.port', $settings->port);
            Config::set('mail.mailers.smtp.username', $settings->username);
            Config::set('mail.mailers.smtp.password', $settings->password);
            Config::set('mail.mailers.smtp.encryption', $settings->encryption);
        }
        
        Config::set('mail.from.address', $settings->from_address);
        Config::set('mail.from.name', $settings->from_name);
    }

    /**
     * Get variables for order events
     */
    public static function getOrderVariables($order, $user = null): array
    {
        $user = $user ?? $order->user;
        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));
        
        // Calculate total (amount includes shipping)
        $total = $order->amount ?? 0;
        
        // Get order items list
        $orderItems = $order->orderItems ?? collect();
        $itemsList = $orderItems->map(function ($item) {
            $productName = $item->variant?->product?->name ?? 'Product';
            $quantity = $item->quantity ?? 1;
            return "{$productName} x{$quantity}";
        })->join(', ');
        
        // Get shipping address
        $shippingAddress = '';
        if ($order->address) {
            $addr = $order->address;
            $parts = array_filter([
                $addr->street ?? '',
                $addr->city ?? '',
                $addr->state ?? '',
                $addr->zip ?? '',
                $addr->country ?? '',
            ]);
            $shippingAddress = implode(', ', $parts);
        }
        
        $statusRaw = $order->status ?? 'pending';
        $statusLabel = ucwords(strtolower(str_replace('_', ' ', $statusRaw)));

        return [
            'user_name' => $user->name ?? 'Customer',
            'user_email' => $user->email ?? '',
            'order_id' => $order->id,
            'order_date' => $order->created_at?->format('F d, Y') ?? now()->format('F d, Y'),
            'order_status' => $statusLabel,
            'total_amount' => '৳' . number_format($total, 2),
            'tracking_link' => $frontendUrl . '/track-order' . (($order->tracking_number ?? '') !== '' ? '?tracking=' . urlencode($order->tracking_number) : ''),
            'order_items' => $itemsList ?: 'No items',
            'shipping_address' => $shippingAddress ?: 'Not provided',
        ];
    }
}
