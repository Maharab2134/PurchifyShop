<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Seeder;

class EmailTemplateSeeder extends Seeder
{
    public function run(): void
    {
        // Remove deprecated templates (no longer used)
        EmailTemplate::whereIn('event_type', ['order_pending', 'order_status_updated'])->delete();

        $templates = [
            'order_created' => [
                'name' => 'Order Created',
                'subject' => 'Order #{{order_id}} confirmed',
                'body_html' => $this->wrapHtml(
                    'Thank you for your order!',
                    [
                        'Hi {{user_name}},',
                        'Your order <strong>#{{order_id}}</strong> has been received and is now <strong>{{order_status}}</strong>.',
                        'Order date: {{order_date}}<br/>Total: {{total_amount}}',
                        '<strong>Items:</strong><br/>{{order_items}}',
                        '<strong>Shipping address:</strong><br/>{{shipping_address}}',
                        '<a href="{{tracking_link}}">View your order</a>',
                    ]
                ),
            ],
            'order_processing' => [
                'name' => 'Order Processing',
                'subject' => 'Order #{{order_id}} is processing',
                'body_html' => $this->wrapHtml(
                    'We are working on your order',
                    [
                        'Hi {{user_name}},',
                        'Your order <strong>#{{order_id}}</strong> is now <strong>{{order_status}}</strong>.',
                        'Order date: {{order_date}}<br/>Total: {{total_amount}}',
                        '<a href="{{tracking_link}}">View your order</a>',
                    ]
                ),
            ],
            'order_shipped' => [
                'name' => 'Order Shipped',
                'subject' => 'Order #{{order_id}} has been shipped',
                'body_html' => $this->wrapHtml(
                    'Your order is on the way',
                    [
                        'Hi {{user_name}},',
                        'Good news! Your order <strong>#{{order_id}}</strong> is now <strong>{{order_status}}</strong>.',
                        'Tracking number: {{tracking_number}}<br/>Carrier: {{carrier}}',
                        'Order date: {{order_date}}<br/>Total: {{total_amount}}',
                        '<a href="{{tracking_link}}">Track your order</a>',
                    ]
                ),
            ],
            'order_in_transit' => [
                'name' => 'Order In Transit',
                'subject' => 'Order #{{order_id}} is in transit',
                'body_html' => $this->wrapHtml(
                    'Your order is in transit',
                    [
                        'Hi {{user_name}},',
                        'Your order <strong>#{{order_id}}</strong> is now <strong>{{order_status}}</strong>.',
                        'Tracking number: {{tracking_number}}<br/>Carrier: {{carrier}}',
                        'Order date: {{order_date}}<br/>Total: {{total_amount}}',
                        '<a href="{{tracking_link}}">Track your order</a>',
                    ]
                ),
            ],
            'order_delivered' => [
                'name' => 'Order Delivered',
                'subject' => 'Order #{{order_id}} delivered',
                'body_html' => $this->wrapHtml(
                    'Your order has been delivered',
                    [
                        'Hi {{user_name}},',
                        'Your order <strong>#{{order_id}}</strong> has been <strong>{{order_status}}</strong>.',
                        'Delivery date: {{delivery_date}}',
                        '<a href="{{tracking_link}}">View your order</a>',
                    ]
                ),
            ],
            'order_cancelled' => [
                'name' => 'Order Cancelled',
                'subject' => 'Order #{{order_id}} cancelled',
                'body_html' => $this->wrapHtml(
                    'Order cancelled',
                    [
                        'Hi {{user_name}},',
                        'Your order <strong>#{{order_id}}</strong> has been <strong>{{order_status}}</strong>.',
                        'If you have questions, please contact support.',
                        '<a href="{{tracking_link}}">View your order</a>',
                    ]
                ),
            ],
            'order_returned' => [
                'name' => 'Order Returned',
                'subject' => 'Order #{{order_id}} returned',
                'body_html' => $this->wrapHtml(
                    'Order returned',
                    [
                        'Hi {{user_name}},',
                        'Your order <strong>#{{order_id}}</strong> has been <strong>{{order_status}}</strong>.',
                        'If you have questions, please contact support.',
                        '<a href="{{tracking_link}}">View your order</a>',
                    ]
                ),
            ],
            'order_refunded' => [
                'name' => 'Order Refunded',
                'subject' => 'Order #{{order_id}} refunded',
                'body_html' => $this->wrapHtml(
                    'Order refunded',
                    [
                        'Hi {{user_name}},',
                        'Your order <strong>#{{order_id}}</strong> has been <strong>{{order_status}}</strong>.',
                        'If you have questions, please contact support.',
                        '<a href="{{tracking_link}}">View your order</a>',
                    ]
                ),
            ],
            'vendor_approved' => [
                'name' => 'Vendor Approved',
                'subject' => 'Your Vendor Application ({{vendor_name}}) Has Been Approved',
                'body_html' => $this->wrapHtml(
                    'Vendor application approved',
                    [
                        'Hello {{vendor_contact_name}},',
                        'Your vendor application for <strong>{{vendor_name}}</strong> has been approved.',
                        'You can now work with us as a vendor. We will contact you at {{vendor_email}} if needed.',
                        'Thank you for joining us.',
                    ]
                ),
            ],
            'incomplete_order_marketing' => [
                'name' => 'Incomplete Order Marketing',
                'subject' => 'Complete your order – don\'t miss out!',
                'body_html' => $this->wrapHtml(
                    'Complete your order',
                    [
                        'Hi {{user_name}},',
                        'Product দেখলেন কিনলেন না। দেরি না করে কিনে ফেলুন, কীসের অপেক্ষায় আছেন?',
                        'You viewed products but didn\'t buy. Don\'t delay – buy now! What are you waiting for?',
                        '<a href="{{store_url}}">Visit our store and complete your order today</a>.',
                        'Thank you,<br/>Store Team',
                    ]
                ),
            ],
        ];

        foreach ($templates as $eventType => $data) {
            EmailTemplate::updateOrCreate(
                ['event_type' => $eventType],
                [
                    'name' => $data['name'],
                    'subject' => $data['subject'],
                    'body_html' => $data['body_html'],
                    'body_text' => $data['body_text'] ?? null,
                    'available_variables' => EmailTemplate::getAvailableVariables($eventType),
                    'is_enabled' => true,
                ]
            );
        }
    }

    private function wrapHtml(string $title, array $lines): string
    {
        $body = implode('</p><p>', array_map('trim', $lines));
        return <<<HTML
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
  <h2 style="color: #4f46e5; margin: 0 0 12px;">{$title}</h2>
  <p>{$body}</p>
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
  <p style="font-size: 12px; color: #6b7280; margin: 0;">This is an automated message. Please do not reply.</p>
</div>
HTML;
    }
}
