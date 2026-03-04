<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $roles = Role::orderBy('name')->get();
        $data = $roles->map(fn ($r) => [
            'id' => $r->id,
            'name' => $r->name,
            'description' => $r->description,
            'permissions' => $r->permissions ?? [],
            'isActive' => $r->is_active ?? true,
            'usersCount' => $r->users()->count(),
            'createdAt' => $r->created_at?->toIso8601String(),
        ]);
        return response()->json(['data' => ['roles' => $data]]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100', 'unique:roles,name'],
            'description' => ['nullable', 'string'],
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string', 'in:Overview,Products,Sales,Users & Support,Analytics,Content,Settings'],
        ]);
        $r = Role::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'permissions' => $validated['permissions'],
        ]);
        return response()->json(['message' => 'Role created', 'data' => ['id' => $r->id, 'name' => $r->name]], 201);
    }

    public function show(string $id): JsonResponse
    {
        $r = Role::findOrFail($id);
        return response()->json([
            'data' => [
                'id' => $r->id,
                'name' => $r->name,
                'description' => $r->description,
                'permissions' => $r->permissions ?? [],
                'isActive' => $r->is_active ?? true,
                'usersCount' => $r->users()->count(),
            ],
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $r = Role::findOrFail($id);
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100', 'unique:roles,name,' . $id],
            'description' => ['nullable', 'string'],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', 'in:Overview,Products,Sales,Users & Support,Analytics,Content,Settings'],
            'isActive' => ['sometimes', 'boolean'],
        ]);
        $up = array_filter([
            'name' => $validated['name'] ?? null,
            'description' => $validated['description'] ?? null,
            'permissions' => $validated['permissions'] ?? null,
        ], fn ($v) => $v !== null);
        // Only SUPERADMIN can set is_active
        if (array_key_exists('isActive', $validated) && Auth::check() && Auth::user()->role === 'SUPERADMIN') {
            $up['is_active'] = (bool) $validated['isActive'];
        }
        $r->update($up);
        return response()->json(['message' => 'Role updated', 'data' => ['id' => $r->id]]);
    }

    public function destroy(string $id): JsonResponse
    {
        $r = Role::findOrFail($id);
        if ($r->users()->count() > 0) {
            return response()->json(['message' => 'Cannot delete role with assigned users'], 422);
        }
        $r->delete();
        return response()->json(['message' => 'Role deleted']);
    }
}
