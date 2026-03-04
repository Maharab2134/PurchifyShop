<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoticeController extends Controller
{
    public function index(): JsonResponse
    {
        $notices = Notice::orderBy('sort_order')->orderBy('id')->get()->map(fn ($n) => $this->resource($n));
        return response()->json(['data' => $notices]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'text' => ['required', 'string', 'max:1000'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
            'isActive' => ['nullable', 'boolean'],
            'scrollSpeed' => ['nullable', 'integer', 'min:10', 'max:200'],
        ]);

        $maxSort = Notice::max('sort_order') ?? 0;
        $notice = Notice::create([
            'text' => $validated['text'],
            'sort_order' => $validated['sortOrder'] ?? ($maxSort + 1),
            'is_active' => $validated['isActive'] ?? true,
            'scroll_speed' => $validated['scrollSpeed'] ?? 50,
        ]);

        return response()->json(['message' => 'Notice created', 'data' => $this->resource($notice)], 201);
    }

    public function show(string $id): JsonResponse
    {
        $notice = Notice::findOrFail($id);
        return response()->json(['data' => $this->resource($notice)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $notice = Notice::findOrFail($id);
        $validated = $request->validate([
            'text' => ['sometimes', 'string', 'max:1000'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
            'isActive' => ['nullable', 'boolean'],
            'scrollSpeed' => ['nullable', 'integer', 'min:10', 'max:200'],
        ]);

        $updates = [];
        if (array_key_exists('text', $validated)) {
            $updates['text'] = $validated['text'];
        }
        if (array_key_exists('sortOrder', $validated)) {
            $updates['sort_order'] = (int) $validated['sortOrder'];
        }
        if (array_key_exists('isActive', $validated)) {
            $updates['is_active'] = (bool) $validated['isActive'];
        }
        if (array_key_exists('scrollSpeed', $validated)) {
            $updates['scroll_speed'] = (int) $validated['scrollSpeed'];
        }

        $notice->update($updates);
        return response()->json(['message' => 'Notice updated', 'data' => $this->resource($notice->fresh())]);
    }

    public function destroy(string $id): JsonResponse
    {
        $notice = Notice::findOrFail($id);
        $notice->delete();
        return response()->json(['message' => 'Notice deleted successfully']);
    }

    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:notices,id'],
        ]);

        foreach ($validated['ids'] as $index => $id) {
            Notice::where('id', $id)->update(['sort_order' => $index]);
        }

        return response()->json(['message' => 'Notices reordered successfully']);
    }

    private function resource(Notice $n): array
    {
        return [
            'id' => $n->id,
            'text' => $n->text,
            'sortOrder' => $n->sort_order,
            'isActive' => (bool) $n->is_active,
            'scrollSpeed' => (int) $n->scroll_speed,
        ];
    }
}
