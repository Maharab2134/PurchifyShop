<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AddressController extends Controller
{
    public function index(): JsonResponse
    {
        $addresses = Address::where('user_id', Auth::id())
            ->whereNull('order_id')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($a) => $this->resource($a));
        return response()->json(['data' => $addresses]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'label' => ['nullable', 'string', 'max:50'],
            'street' => ['required', 'string'],
            'city' => ['required', 'string'],
            'state' => ['required', 'string'],
            'country' => ['required', 'string'],
            'zip' => ['required', 'string'],
        ]);
        $a = Address::create([
            'user_id' => Auth::id(),
            'label' => $validated['label'] ?? null,
            'street' => $validated['street'],
            'city' => $validated['city'],
            'state' => $validated['state'],
            'country' => $validated['country'],
            'zip' => $validated['zip'],
        ]);
        return response()->json([
            'message' => 'Address created',
            'data' => $this->resource($a),
        ], 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $a = Address::where('user_id', Auth::id())->whereNull('order_id')->findOrFail($id);
        $validated = $request->validate([
            'label' => ['nullable', 'string', 'max:50'],
            'street' => ['sometimes', 'required', 'string'],
            'city' => ['sometimes', 'required', 'string'],
            'state' => ['sometimes', 'required', 'string'],
            'country' => ['sometimes', 'required', 'string'],
            'zip' => ['sometimes', 'required', 'string'],
        ]);
        $a->update($validated);
        return response()->json([
            'message' => 'Address updated',
            'data' => $this->resource($a->fresh()),
        ]);
    }

    public function destroy(string $id): JsonResponse
    {
        $a = Address::where('user_id', Auth::id())->whereNull('order_id')->findOrFail($id);
        $a->delete();
        return response()->json(['message' => 'Address deleted']);
    }

    private function resource(Address $a): array
    {
        return [
            'id' => $a->id,
            'label' => $a->label,
            'street' => $a->street,
            'city' => $a->city,
            'state' => $a->state,
            'country' => $a->country,
            'zip' => $a->zip,
            'createdAt' => $a->created_at?->toIso8601String(),
            'updatedAt' => $a->updated_at?->toIso8601String(),
        ];
    }
}
