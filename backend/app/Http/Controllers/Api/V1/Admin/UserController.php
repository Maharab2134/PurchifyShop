<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::with('roleModel')->orderBy('name')->paginate($request->input('limit', 20));
        $data = $users->getCollection()->map(fn ($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'email' => $u->email,
            'role' => $u->role,
            'roleId' => $u->role_id,
            'roleModel' => $u->roleModel ? [
                'id' => $u->roleModel->id,
                'name' => $u->roleModel->name,
                'permissions' => $u->roleModel->permissions ?? [],
            ] : null,
            'isActive' => $u->is_active ?? true,
            'avatar' => $u->avatar,
            'createdAt' => $u->created_at?->toIso8601String(),
        ]);
        return response()->json([
            'data' => ['users' => $data, 'totalResults' => $users->total(), 'totalPages' => $users->lastPage(), 'currentPage' => $users->currentPage()],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', 'in:USER,ADMIN,SUPERADMIN'],
            'roleId' => ['nullable', 'string', 'exists:roles,id'],
        ]);
        $u = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => $validated['role'],
            'role_id' => $validated['roleId'] ?? null,
        ]);
        return response()->json(['message' => 'User created', 'data' => ['id' => $u->id, 'name' => $u->name, 'email' => $u->email, 'role' => $u->role]], 201);
    }

    public function show(string $id): JsonResponse
    {
        $u = User::findOrFail($id);
        return response()->json(['data' => ['id' => $u->id, 'name' => $u->name, 'email' => $u->email, 'role' => $u->role, 'avatar' => $u->avatar]]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $u = User::findOrFail($id);
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($u->id)],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['sometimes', 'string', 'in:USER,ADMIN,SUPERADMIN'],
            'roleId' => ['nullable', 'string', 'exists:roles,id'],
            'isActive' => ['sometimes', 'boolean'],
        ]);
        $up = array_filter([
            'name' => $validated['name'] ?? null,
            'email' => $validated['email'] ?? null,
            'role' => $validated['role'] ?? null,
            'role_id' => $validated['roleId'] ?? null,
        ], fn ($v) => $v !== null);
        // SUPERADMIN's role cannot be changed
        if ($u->role === 'SUPERADMIN') {
            unset($up['role'], $up['role_id']);
        }
        if (! empty($validated['password'])) {
            $up['password'] = $validated['password'];
        }
        // Only SUPERADMIN can set is_active
        if (array_key_exists('isActive', $validated) && Auth::check() && Auth::user()->role === 'SUPERADMIN') {
            if (Auth::id() === $u->id && $validated['isActive'] === false) {
                return response()->json(['message' => 'You cannot deactivate your own account'], 422);
            }
            $up['is_active'] = (bool) $validated['isActive'];
        }
        $u->update($up);
        return response()->json(['message' => 'User updated', 'data' => ['id' => $u->id]]);
    }

    public function destroy(string $id): JsonResponse
    {
        $u = User::findOrFail($id);

        if (Auth::check() && Auth::id() === $u->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        try {
            DB::transaction(function () use ($u) {
                $u->tokens()->delete();
                $u->delete();
            });
        } catch (\Illuminate\Database\QueryException $e) {
            $msg = $e->getMessage();
            if (str_contains($msg, 'foreign key') || str_contains($msg, 'Integrity constraint')) {
                return response()->json([
                    'message' => 'Cannot delete user because they have related data (orders, reviews, etc.). Deactivate the user instead.',
                ], 422);
            }
            throw $e;
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Could not delete user. Please try deactivating the user instead.',
            ], 422);
        }

        return response()->json(['message' => 'User deleted']);
    }
}
