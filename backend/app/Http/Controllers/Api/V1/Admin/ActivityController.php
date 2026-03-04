<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ActivityController extends Controller
{
    /**
     * GET /api/v1/admin/recent-activities
     * Uses the `logs` table if present.
     */
    public function index(Request $request): JsonResponse
    {
        $limit = min((int) $request->input('limit', 20), 100);

        if (!Schema::hasTable('logs')) {
            return response()->json(['data' => ['activities' => []]]);
        }

        $rows = DB::table('logs')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();

        $data = $rows->map(fn ($l) => [
            'id' => $l->id,
            'level' => $l->level,
            'message' => $l->message,
            'context' => $l->context ? json_decode($l->context, true) : null,
            'createdAt' => $l->created_at,
        ])->values()->all();

        return response()->json(['data' => ['activities' => $data]]);
    }

    /**
     * POST /api/v1/admin/recent-activities/clear
     * Truncates the logs table (clears all recent activities).
     */
    public function clear(): JsonResponse
    {
        if (Schema::hasTable('logs')) {
            DB::table('logs')->truncate();
        }

        return response()->json(['message' => 'Recent activities cleared']);
    }
}

