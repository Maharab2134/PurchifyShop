<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class LogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if (! Schema::hasTable('logs')) {
            return response()->json(['data' => ['logs' => [], 'totalResults' => 0]]);
        }
        $q = DB::table('logs')->orderByDesc('created_at');
        $total = $q->count();
        $logs = $q->limit($request->input('limit', 50))->offset($request->input('offset', 0))->get();
        $data = $logs->map(fn ($l) => [
            'id' => $l->id,
            'level' => $l->level,
            'message' => $l->message,
            'context' => $l->context ? json_decode($l->context, true) : null,
            'createdAt' => $l->created_at,
        ]);
        return response()->json(['data' => ['logs' => $data, 'totalResults' => $total]]);
    }
}
