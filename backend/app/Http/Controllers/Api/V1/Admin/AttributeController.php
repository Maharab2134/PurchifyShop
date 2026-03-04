<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Attribute;
use App\Models\AttributeValue;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AttributeController extends Controller
{
    public function index(): JsonResponse
    {
        $attrs = Attribute::with('values')->orderBy('name')->get()->map(fn ($a) => [
            'id' => $a->id,
            'name' => $a->name,
            'slug' => $a->slug,
            'values' => $a->values->map(fn ($v) => ['id' => $v->id, 'value' => $v->value, 'slug' => $v->slug]),
        ]);
        return response()->json(['data' => $attrs]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:attributes,name'],
            'values' => ['nullable', 'array'],
            'values.*' => ['string'],
        ]);
        $slug = Str::slug($validated['name']);
        $a = Attribute::create(['name' => $validated['name'], 'slug' => $slug]);
        foreach ($validated['values'] ?? [] as $v) {
            AttributeValue::create([
                'attribute_id' => $a->id,
                'value' => $v,
                'slug' => Str::slug($v) . '-' . Str::random(4),
            ]);
        }
        $a->load('values');
        return response()->json(['message' => 'Attribute created', 'data' => ['id' => $a->id, 'name' => $a->name]], 201);
    }

    /**
     * PUT /api/v1/admin/attributes/{id}
     * Update attribute name and/or values.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $attr = Attribute::with('values')->findOrFail($id);
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255', \Illuminate\Validation\Rule::unique('attributes', 'name')->ignore($attr->id)],
            'values' => ['nullable', 'array'],
            'values.*' => ['string'],
        ]);
        if (! empty($validated['name'])) {
            $attr->update([
                'name' => $validated['name'],
                'slug' => Str::slug($validated['name']),
            ]);
        }
        if (array_key_exists('values', $validated)) {
            $attr->values()->delete();
            foreach ($validated['values'] ?? [] as $v) {
                AttributeValue::create([
                    'attribute_id' => $attr->id,
                    'value' => $v,
                    'slug' => Str::slug($v) . '-' . Str::random(4),
                ]);
            }
        }
        $attr->load('values');
        return response()->json([
            'message' => 'Attribute updated',
            'data' => [
                'id' => $attr->id,
                'name' => $attr->name,
                'slug' => $attr->slug,
                'values' => $attr->values->map(fn ($v) => ['id' => $v->id, 'value' => $v->value, 'slug' => $v->slug]),
            ],
        ]);
    }
}
