<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Config;

class EmailSettingController extends Controller
{
    public function show(): JsonResponse
    {
        $settings = EmailSetting::getSettings();
        return response()->json([
            'data' => [
                'id' => $settings->id,
                'mailer' => $settings->mailer,
                'host' => $settings->host,
                'port' => $settings->port,
                'username' => $settings->username,
                'password' => $settings->password ? '***' : null, // Don't expose actual password
                'encryption' => $settings->encryption,
                'fromAddress' => $settings->from_address,
                'fromName' => $settings->from_name,
                'isActive' => $settings->is_active,
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'mailer' => ['required', 'string', 'in:smtp,sendmail'],
            'host' => ['required_if:mailer,smtp', 'nullable', 'string'],
            'port' => ['required_if:mailer,smtp', 'nullable', 'integer', 'min:1', 'max:65535'],
            'username' => ['nullable', 'string'],
            'password' => ['nullable', 'string'],
            'encryption' => ['nullable', 'string', 'in:tls,ssl'],
            'fromAddress' => ['required', 'email'],
            'fromName' => ['required', 'string', 'max:255'],
            'isActive' => ['boolean'],
        ]);

        $settings = EmailSetting::getSettings();
        
        // Only update password if provided
        if (!isset($validated['password']) || $validated['password'] === '***' || empty($validated['password'])) {
            unset($validated['password']);
        }

        $settings->update([
            'mailer' => $validated['mailer'],
            'host' => $validated['host'] ?? null,
            'port' => $validated['port'] ?? null,
            'username' => $validated['username'] ?? null,
            'password' => $validated['password'] ?? $settings->password,
            'encryption' => $validated['encryption'] ?? null,
            'from_address' => $validated['fromAddress'],
            'from_name' => $validated['fromName'],
            'is_active' => $validated['isActive'] ?? false,
        ]);

        return response()->json([
            'message' => 'Email settings updated successfully',
            'data' => [
                'id' => $settings->id,
                'mailer' => $settings->mailer,
                'host' => $settings->host,
                'port' => $settings->port,
                'username' => $settings->username,
                'password' => $settings->password ? '***' : null,
                'encryption' => $settings->encryption,
                'fromAddress' => $settings->from_address,
                'fromName' => $settings->from_name,
                'isActive' => $settings->is_active,
            ],
        ]);
    }

    public function testEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $settings = EmailSetting::getSettings();
        
        if (!$settings->is_active) {
            return response()->json(['message' => 'Email settings are not active'], 400);
        }

        try {
            // Temporarily configure mail settings
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

            Mail::raw(
                "This is a test email from {$settings->from_name}.\n\n" .
                "If you received this email, your SMTP configuration is working correctly!",
                function ($message) use ($validated, $settings) {
                    $message->to($validated['email'])
                            ->subject("Test Email from {$settings->from_name}");
                }
            );

            return response()->json(['message' => 'Test email sent successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to send test email',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
