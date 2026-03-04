<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = EmailLog::with('template')->orderBy('created_at', 'desc');

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('event_type')) {
            $query->where('event_type', $request->input('event_type'));
        }

        if ($request->filled('recipient_email')) {
            $query->where('recipient_email', 'like', '%' . $request->input('recipient_email') . '%');
        }

        $perPage = min((int) $request->input('limit', 50), 100);
        $logs = $query->paginate($perPage);

        return response()->json([
            'data' => [
                'logs' => $logs->getCollection()->map(fn ($log) => [
                    'id' => $log->id,
                    'templateId' => $log->template_id,
                    'templateName' => $log->template?->name,
                    'eventType' => $log->event_type,
                    'recipientEmail' => $log->recipient_email,
                    'recipientName' => $log->recipient_name,
                    'subject' => $log->subject,
                    'status' => $log->status,
                    'errorMessage' => $log->error_message,
                    'variablesUsed' => $log->variables_used,
                    'relatedModelType' => $log->related_model_type,
                    'relatedModelId' => $log->related_model_id,
                    'sentAt' => $log->sent_at?->toIso8601String(),
                    'createdAt' => $log->created_at?->toIso8601String(),
                ]),
                'totalResults' => $logs->total(),
                'totalPages' => $logs->lastPage(),
                'currentPage' => $logs->currentPage(),
                'resultsPerPage' => $logs->perPage(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $log = EmailLog::with('template')->findOrFail($id);
        return response()->json([
            'data' => [
                'id' => $log->id,
                'templateId' => $log->template_id,
                'templateName' => $log->template?->name,
                'eventType' => $log->event_type,
                'recipientEmail' => $log->recipient_email,
                'recipientName' => $log->recipient_name,
                'subject' => $log->subject,
                'bodyHtml' => $log->body_html,
                'status' => $log->status,
                'errorMessage' => $log->error_message,
                'variablesUsed' => $log->variables_used,
                'relatedModelType' => $log->related_model_type,
                'relatedModelId' => $log->related_model_id,
                'sentAt' => $log->sent_at?->toIso8601String(),
                'createdAt' => $log->created_at?->toIso8601String(),
            ],
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $log = EmailLog::findOrFail($id);
        $log->delete();
        return response()->json(['message' => 'Email log deleted successfully']);
    }

    /**
     * Clear all email logs from the database.
     */
    public function clearAll(): JsonResponse
    {
        EmailLog::query()->delete();
        return response()->json(['message' => 'All email logs have been cleared']);
    }
}
