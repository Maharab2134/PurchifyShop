<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Services\ImageDeletionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SectionController extends Controller
{
    public function index(): JsonResponse
    {
        $sections = Section::orderBy('id')->get()->map(fn ($s) => $this->sectionResource($s));
        return response()->json(['data' => $sections]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:HERO,PROMOTIONAL,BENEFITS,NEW_ARRIVALS,CUSTOM'],
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'images' => ['nullable', 'array'],
            'images.*' => ['string'],
            'icons' => ['nullable', 'string'],
            'link' => ['nullable', 'string', 'max:500'],
            'ctaText' => ['nullable', 'string', 'max:100'],
            'isVisible' => ['boolean'],
            'primaryColor' => ['nullable', 'string'],
            'secondaryColor' => ['nullable', 'string'],
        ]);
        $s = Section::create([
            'type' => $validated['type'],
            'title' => $validated['title'] ?? null,
            'description' => $validated['description'] ?? null,
            'images' => $validated['images'] ?? [],
            'icons' => $validated['icons'] ?? null,
            'link' => $validated['link'] ?? null,
            'cta_text' => $validated['ctaText'] ?? null,
            'is_visible' => $validated['isVisible'] ?? true,
            'primary_color' => $validated['primaryColor'] ?? null,
            'secondary_color' => $validated['secondaryColor'] ?? null,
        ]);
        return response()->json(['message' => 'Section created', 'data' => $this->sectionResource($s)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $s = Section::findOrFail($id);
        $validated = $request->validate([
            'type' => ['sometimes', 'string', 'in:HERO,PROMOTIONAL,BENEFITS,NEW_ARRIVALS,CUSTOM'],
            'title' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'images' => ['nullable', 'array'],
            'images.*' => ['string'],
            'icons' => ['nullable', 'string'],
            'link' => ['nullable', 'string', 'max:500'],
            'ctaText' => ['nullable', 'string', 'max:100'],
            'isVisible' => ['boolean'],
            'primaryColor' => ['nullable', 'string'],
            'secondaryColor' => ['nullable', 'string'],
        ]);
        $up = array_filter([
            'type' => $validated['type'] ?? null,
            'title' => $validated['title'] ?? null,
            'description' => $validated['description'] ?? null,
            'images' => $validated['images'] ?? null,
            'icons' => $validated['icons'] ?? null,
            'link' => $validated['link'] ?? null,
            'cta_text' => $validated['ctaText'] ?? null,
            'is_visible' => array_key_exists('isVisible', $validated) ? (bool) $validated['isVisible'] : null,
            'primary_color' => $validated['primaryColor'] ?? null,
            'secondary_color' => $validated['secondaryColor'] ?? null,
        ], fn ($v) => $v !== null);
        $s->update($up);
        return response()->json(['message' => 'Section updated', 'data' => $this->sectionResource($s)]);
    }

    public function destroy(string $id): JsonResponse
    {
        $s = Section::findOrFail($id);
        $images = is_array($s->images) ? $s->images : [];
        $s->delete();
        $cleanup = new ImageDeletionService();
        foreach ($images as $path) {
            $clean = $cleanup->normalizePath((string) $path);
            if ($cleanup->isAllowedPath($clean)) {
                $cleanup->deleteFromStorageIfOrphan($clean);
            }
        }
        return response()->json(['message' => 'Section deleted']);
    }

    private function sectionResource(Section $s): array
    {
        return [
            'id' => $s->id,
            'type' => $s->type,
            'title' => $s->title,
            'description' => $s->description,
            'images' => $s->images ?? [],
            'icons' => $s->icons,
            'link' => $s->link,
            'ctaText' => $s->cta_text,
            'isVisible' => (bool) $s->is_visible,
            'primaryColor' => $s->primary_color,
            'secondaryColor' => $s->secondary_color,
        ];
    }
}
