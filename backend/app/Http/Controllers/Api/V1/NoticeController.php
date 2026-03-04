<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Notice;
use Illuminate\Http\JsonResponse;

class NoticeController extends Controller
{
    public function index(): JsonResponse
    {
        $notices = Notice::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->map(fn ($n) => [
                'id' => $n->id,
                'text' => $n->text,
                'scrollSpeed' => (int) $n->scroll_speed,
            ]);

        return response()->json(['data' => $notices]);
    }
}
