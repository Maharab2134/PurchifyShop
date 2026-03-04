<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Section;
use Illuminate\Http\JsonResponse;

class SectionController extends Controller
{
    /**
     * GET /api/v1/sections
     */
    public function index(): JsonResponse
    {
        $sections = Section::where('is_visible', true)->orderBy('id')->get()->map(fn ($s) => [
            'id' => $s->id,
            'type' => $s->type,
            'title' => $s->title,
            'description' => $s->description,
            'images' => $this->mapImages($s->images ?? []),
            'icons' => $s->icons,
            'link' => $s->link,
            'ctaText' => $s->cta_text,
            'isVisible' => (bool) $s->is_visible,
            'primaryColor' => $s->primary_color,
            'secondaryColor' => $s->secondary_color,
        ]);
        return response()->json([
            'message' => 'Sections fetched successfully',
            'data' => $sections,
        ]);
    }

    private function mapImages(array $arr): array
    {
        $base = rtrim(config('app.url'), '/') . '/storage/';
        return array_map(fn ($p) => str_starts_with($p, 'http') ? $p : $base . ltrim($p, '/'), $arr);
    }
}
