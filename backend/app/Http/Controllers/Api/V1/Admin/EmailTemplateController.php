<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use App\Services\EmailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EmailTemplateController extends Controller
{
    public function index(): JsonResponse
    {
        $templates = EmailTemplate::orderBy('name')->get();
        return response()->json([
            'data' => $templates->map(fn ($t) => [
                'id' => $t->id,
                'eventType' => $t->event_type,
                'name' => $t->name,
                'subject' => $t->subject,
                'bodyHtml' => $t->body_html,
                'bodyText' => $t->body_text,
                'availableVariables' => $t->available_variables ?? EmailTemplate::getAvailableVariables($t->event_type),
                'isEnabled' => $t->is_enabled,
                'createdAt' => $t->created_at?->toIso8601String(),
                'updatedAt' => $t->updated_at?->toIso8601String(),
            ]),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $template = EmailTemplate::findOrFail($id);
        return response()->json([
            'data' => [
                'id' => $template->id,
                'eventType' => $template->event_type,
                'name' => $template->name,
                'subject' => $template->subject,
                'bodyHtml' => $template->body_html,
                'bodyText' => $template->body_text,
                'availableVariables' => $template->available_variables ?? EmailTemplate::getAvailableVariables($template->event_type),
                'isEnabled' => $template->is_enabled,
                'createdAt' => $template->created_at?->toIso8601String(),
                'updatedAt' => $template->updated_at?->toIso8601String(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'eventType' => ['required', 'string', 'unique:email_templates,event_type'],
            'name' => ['required', 'string', 'max:255'],
            'subject' => ['nullable', 'string', 'max:500'], // Optional - will be auto-generated if empty
            'bodyHtml' => ['required', 'string'],
            'bodyText' => ['nullable', 'string'],
            'isEnabled' => ['boolean'],
        ]);

        $template = EmailTemplate::create([
            'event_type' => $validated['eventType'],
            'name' => $validated['name'],
            'subject' => $validated['subject'] ?? '', // Empty subject will be auto-generated
            'body_html' => $validated['bodyHtml'],
            'body_text' => $validated['bodyText'] ?? null,
            'available_variables' => EmailTemplate::getAvailableVariables($validated['eventType']),
            'is_enabled' => $validated['isEnabled'] ?? true,
        ]);

        return response()->json([
            'message' => 'Email template created successfully',
            'data' => [
                'id' => $template->id,
                'eventType' => $template->event_type,
                'name' => $template->name,
                'subject' => $template->subject,
                'bodyHtml' => $template->body_html,
                'bodyText' => $template->body_text,
                'availableVariables' => $template->available_variables,
                'isEnabled' => $template->is_enabled,
            ],
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $template = EmailTemplate::findOrFail($id);
        
        $validated = $request->validate([
            'eventType' => ['sometimes', 'string', 'unique:email_templates,event_type,' . $id],
            'name' => ['sometimes', 'string', 'max:255'],
            'subject' => ['nullable', 'string', 'max:500'], // Optional - will be auto-generated if empty
            'bodyHtml' => ['sometimes', 'string'],
            'bodyText' => ['nullable', 'string'],
            'isEnabled' => ['boolean'],
        ]);

        $updates = array_filter([
            'event_type' => $validated['eventType'] ?? null,
            'name' => $validated['name'] ?? null,
            'subject' => $validated['subject'] ?? null,
            'body_html' => $validated['bodyHtml'] ?? null,
            'body_text' => $validated['bodyText'] ?? null,
            'is_enabled' => $validated['isEnabled'] ?? null,
        ], fn ($v) => $v !== null);

        if (isset($updates['event_type'])) {
            $updates['available_variables'] = EmailTemplate::getAvailableVariables($updates['event_type']);
        }

        $template->update($updates);

        return response()->json([
            'message' => 'Email template updated successfully',
            'data' => [
                'id' => $template->id,
                'eventType' => $template->event_type,
                'name' => $template->name,
                'subject' => $template->subject,
                'bodyHtml' => $template->body_html,
                'bodyText' => $template->body_text,
                'availableVariables' => $template->available_variables,
                'isEnabled' => $template->is_enabled,
            ],
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $template = EmailTemplate::findOrFail($id);
        $template->delete();
        return response()->json(['message' => 'Email template deleted successfully']);
    }

    public function getEventTypes(): JsonResponse
    {
        return response()->json([
            'data' => [
                'eventTypes' => EmailTemplate::getEventTypes(),
                'variables' => array_map(fn ($type) => EmailTemplate::getAvailableVariables($type), array_keys(EmailTemplate::getEventTypes())),
            ],
        ]);
    }

    public function testEmail(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'variables' => ['nullable', 'array'],
        ]);

        $template = EmailTemplate::findOrFail($id);
        
        if (!$template->is_enabled) {
            return response()->json(['message' => 'Template is disabled'], 400);
        }

        try {
            $emailService = new EmailService();
            $emailService->sendTemplateEmail(
                $template,
                $validated['email'],
                'Test User',
                $validated['variables'] ?? []
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
