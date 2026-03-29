<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\LandingPageTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LandingPageTemplateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = LandingPageTemplate::query()->orderByDesc('updated_at');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $q->where(function ($query) use ($search) {
                $query->where('name', 'like', '%' . $search . '%')
                    ->orWhere('slug', 'like', '%' . $search . '%');
            });
        }

        $templates = $q->paginate((int) $request->input('limit', 50));

        return response()->json([
            'data' => [
                'templates' => $templates->getCollection()->map(fn (LandingPageTemplate $template) => $this->resource($template)),
                'totalResults' => $templates->total(),
                'totalPages' => $templates->lastPage(),
                'currentPage' => $templates->currentPage(),
                'resultsPerPage' => $templates->perPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:landing_page_templates,name'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:landing_page_templates,slug'],
            'htmlStructure' => ['nullable', 'string'],
            'customCss' => ['nullable', 'string'],
            'customJavascript' => ['nullable', 'string'],
            'previewImage' => ['nullable', 'string', 'max:2048'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['name']);
        if (LandingPageTemplate::where('slug', $slug)->exists()) {
            $slug = $slug . '-' . time();
        }

        $template = LandingPageTemplate::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'html_structure' => $validated['htmlStructure'] ?? null,
            'custom_css' => $validated['customCss'] ?? null,
            'custom_javascript' => $validated['customJavascript'] ?? null,
            'preview_image' => $validated['previewImage'] ?? null,
            'is_active' => $validated['isActive'] ?? true,
        ]);

        return response()->json([
            'message' => 'Template created',
            'data' => $this->resource($template),
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $template = LandingPageTemplate::findOrFail($id);

        return response()->json([
            'data' => $this->resource($template),
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $template = LandingPageTemplate::findOrFail($id);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255', 'unique:landing_page_templates,name,' . $id],
            'slug' => ['sometimes', 'string', 'max:255', 'unique:landing_page_templates,slug,' . $id],
            'htmlStructure' => ['nullable', 'string'],
            'customCss' => ['nullable', 'string'],
            'customJavascript' => ['nullable', 'string'],
            'previewImage' => ['nullable', 'string', 'max:2048'],
            'isActive' => ['nullable', 'boolean'],
        ]);

        $updates = [];
        if (array_key_exists('name', $validated)) {
            $updates['name'] = $validated['name'];
        }
        if (array_key_exists('slug', $validated)) {
            $updates['slug'] = $validated['slug'];
        }
        if (array_key_exists('htmlStructure', $validated)) {
            $updates['html_structure'] = $validated['htmlStructure'];
        }
        if (array_key_exists('customCss', $validated)) {
            $updates['custom_css'] = $validated['customCss'];
        }
        if (array_key_exists('customJavascript', $validated)) {
            $updates['custom_javascript'] = $validated['customJavascript'];
        }
        if (array_key_exists('previewImage', $validated)) {
            $updates['preview_image'] = $validated['previewImage'];
        }
        if (array_key_exists('isActive', $validated)) {
            $updates['is_active'] = $validated['isActive'];
        }

        $template->update($updates);

        return response()->json([
            'message' => 'Template updated',
            'data' => $this->resource($template->fresh()),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $template = LandingPageTemplate::findOrFail($id);
        $template->delete();

        return response()->json([
            'message' => 'Template deleted',
        ]);
    }

    private function resource(LandingPageTemplate $template): array
    {
        return [
            'id' => $template->id,
            'name' => $template->name,
            'slug' => $template->slug,
            'htmlStructure' => $template->html_structure,
            'customCss' => $template->custom_css,
            'customJavascript' => $template->custom_javascript,
            'previewImage' => $template->preview_image,
            'isActive' => $template->is_active,
            'createdAt' => $template->created_at?->toIso8601String(),
            'updatedAt' => $template->updated_at?->toIso8601String(),
        ];
    }
}
