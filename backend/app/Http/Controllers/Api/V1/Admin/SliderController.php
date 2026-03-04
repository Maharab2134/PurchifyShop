<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Slider;
use App\Services\ImageDeletionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SliderController extends Controller
{
    public function index(): JsonResponse
    {
        $sliders = Slider::orderBy('sort_order')->orderBy('id')->get()->map(fn ($s) => $this->resource($s));
        return response()->json(['data' => $sliders]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'image' => ['required', 'string', 'max:512'],
            'link' => ['nullable', 'string', 'max:512'],
            'description' => ['nullable', 'string', 'max:1000'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $maxSort = Slider::max('sort_order') ?? 0;
        $slider = Slider::create([
            'title' => $validated['title'] ?? null,
            'image' => $validated['image'],
            'link' => $validated['link'] ?? null,
            'description' => $validated['description'] ?? null,
            'sort_order' => $validated['sortOrder'] ?? ($maxSort + 1),
            'is_active' => $validated['isActive'] ?? true,
        ]);

        return response()->json(['message' => 'Slider created', 'data' => $this->resource($slider)], 201);
    }

    public function show(string $id): JsonResponse
    {
        $slider = Slider::findOrFail($id);
        return response()->json(['data' => $this->resource($slider)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $slider = Slider::findOrFail($id);
        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
            'image' => ['sometimes', 'string', 'max:512'],
            'link' => ['nullable', 'string', 'max:512'],
            'description' => ['nullable', 'string', 'max:1000'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $updates = [];
        if (array_key_exists('title', $validated)) {
            $updates['title'] = $validated['title'];
        }
        if (array_key_exists('image', $validated)) {
            $updates['image'] = $validated['image'];
        }
        if (array_key_exists('link', $validated)) {
            $updates['link'] = $validated['link'];
        }
        if (array_key_exists('description', $validated)) {
            $updates['description'] = $validated['description'];
        }
        if (array_key_exists('sortOrder', $validated)) {
            $updates['sort_order'] = (int) $validated['sortOrder'];
        }
        if (array_key_exists('isActive', $validated)) {
            $updates['is_active'] = (bool) $validated['isActive'];
        }

        $slider->update($updates);
        return response()->json(['message' => 'Slider updated', 'data' => $this->resource($slider->fresh())]);
    }

    public function destroy(string $id): JsonResponse
    {
        $slider = Slider::findOrFail($id);
        $image = $slider->image;
        $slider->delete();
        if ($image) {
            $cleanup = new ImageDeletionService();
            $clean = $cleanup->normalizePath((string) $image);
            if ($cleanup->isAllowedPath($clean)) {
                $cleanup->deleteFromStorageIfOrphan($clean);
            }
        }
        return response()->json(['message' => 'Slider deleted successfully']);
    }

    public function reorder(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:sliders,id'],
        ]);

        foreach ($validated['ids'] as $index => $id) {
            Slider::where('id', $id)->update(['sort_order' => $index]);
        }

        return response()->json(['message' => 'Sliders reordered successfully']);
    }

    private function resource(Slider $s): array
    {
        return [
            'id' => $s->id,
            'title' => $s->title,
            'image' => $s->image,
            'link' => $s->link,
            'buttonTitle' => $s->title,
            'buttonLink' => $s->link,
            'description' => $s->description,
            'sortOrder' => $s->sort_order,
            'isActive' => (bool) $s->is_active,
        ];
    }
}
