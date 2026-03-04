<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Footer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FooterController extends Controller
{
    public function index(): JsonResponse
    {
        $items = Footer::orderBy('column_name')
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Footer $f) => $this->footerResource($f));
        return response()->json(['data' => $items->values()->all()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'columnName' => ['required', 'string', 'in:column1,column2,column3,column4'],
            'title' => ['nullable', 'string', 'max:255'],
            'logoUrl' => ['nullable', 'string', 'max:500'],
            'links' => ['nullable', 'array'],
            'links.*.label' => ['required_with:links', 'string', 'max:255'],
            'links.*.url' => ['required_with:links', 'string', 'max:500'],
            'socialLinks' => ['nullable', 'array'],
            'socialLinks.*.platform' => ['required_with:socialLinks', 'string'],
            'socialLinks.*.url' => ['required_with:socialLinks', 'string', 'max:500'],
            'contactInfo' => ['nullable', 'array'],
            'contactInfo.*.type' => ['required_with:contactInfo', 'string', 'in:email,phone,address'],
            'contactInfo.*.value' => ['required_with:contactInfo', 'string', 'max:500'],
            'content' => ['nullable', 'string'],
            'copyrightText' => ['nullable', 'string', 'max:500'],
            'poweredByText' => ['nullable', 'string', 'max:500'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
            'isActive' => ['boolean'],
        ]);
        $f = Footer::create([
            'column_name' => $validated['columnName'],
            'title' => $validated['title'] ?? null,
            'logo_url' => $validated['logoUrl'] ?? null,
            'links' => $validated['links'] ?? [],
            'social_links' => $validated['socialLinks'] ?? [],
            'contact_info' => $validated['contactInfo'] ?? [],
            'content' => $validated['content'] ?? null,
            'copyright_text' => $validated['copyrightText'] ?? null,
            'powered_by_text' => $validated['poweredByText'] ?? null,
            'sort_order' => $validated['sortOrder'] ?? 0,
            'is_active' => $validated['isActive'] ?? true,
        ]);
        return response()->json(['message' => 'Footer item created', 'data' => $this->footerResource($f)], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $f = Footer::findOrFail($id);
        $validated = $request->validate([
            'columnName' => ['sometimes', 'string', 'in:column1,column2,column3,column4'],
            'title' => ['nullable', 'string', 'max:255'],
            'logoUrl' => ['nullable', 'string', 'max:500'],
            'links' => ['nullable', 'array'],
            'links.*.label' => ['required_with:links', 'string', 'max:255'],
            'links.*.url' => ['required_with:links', 'string', 'max:500'],
            'socialLinks' => ['nullable', 'array'],
            'socialLinks.*.platform' => ['required_with:socialLinks', 'string'],
            'socialLinks.*.url' => ['required_with:socialLinks', 'string', 'max:500'],
            'contactInfo' => ['nullable', 'array'],
            'contactInfo.*.type' => ['required_with:contactInfo', 'string', 'in:email,phone,address'],
            'contactInfo.*.value' => ['required_with:contactInfo', 'string', 'max:500'],
            'content' => ['nullable', 'string'],
            'copyrightText' => ['nullable', 'string', 'max:500'],
            'poweredByText' => ['nullable', 'string', 'max:500'],
            'sortOrder' => ['nullable', 'integer', 'min:0'],
            'isActive' => ['boolean'],
        ]);

        $up = [];
        if (array_key_exists('columnName', $validated)) $up['column_name'] = $validated['columnName'];
        if (array_key_exists('title', $validated)) $up['title'] = $validated['title'] ?? null;
        if (array_key_exists('logoUrl', $validated)) $up['logo_url'] = $validated['logoUrl'] ?? null;
        if (array_key_exists('links', $validated)) $up['links'] = $validated['links'] ?? [];
        if (array_key_exists('socialLinks', $validated)) $up['social_links'] = $validated['socialLinks'] ?? [];
        if (array_key_exists('contactInfo', $validated)) $up['contact_info'] = $validated['contactInfo'] ?? [];
        if (array_key_exists('content', $validated)) $up['content'] = $validated['content'] ?? null;
        if (array_key_exists('copyrightText', $validated)) $up['copyright_text'] = $validated['copyrightText'] ?? null;
        if (array_key_exists('poweredByText', $validated)) $up['powered_by_text'] = $validated['poweredByText'] ?? null;
        if (array_key_exists('sortOrder', $validated)) $up['sort_order'] = $validated['sortOrder'] ?? null;
        if (array_key_exists('isActive', $validated)) $up['is_active'] = (bool) $validated['isActive'];

        $f->update($up);
        return response()->json(['message' => 'Footer item updated', 'data' => $this->footerResource($f->fresh())]);
    }

    public function destroy(string $id): JsonResponse
    {
        $f = Footer::findOrFail($id);
        $f->delete();
        return response()->json(['message' => 'Footer item deleted']);
    }

    private function footerResource(Footer $f): array
    {
        return [
            'id' => $f->id,
            'columnName' => $f->column_name,
            'title' => $f->title,
            'logoUrl' => $f->logo_url,
            'links' => $f->links ?? [],
            'socialLinks' => $f->social_links ?? [],
            'contactInfo' => $f->contact_info ?? [],
            'content' => $f->content,
            'copyrightText' => $f->copyright_text,
            'poweredByText' => $f->powered_by_text,
            'sortOrder' => $f->sort_order,
            'isActive' => (bool) $f->is_active,
        ];
    }
}
