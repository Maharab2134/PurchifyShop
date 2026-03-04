<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorApplicationController extends Controller
{
    /**
     * POST /api/v1/vendor-applications
     * Public: submit vendor application (creates vendor with status pending).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'whatsapp_number' => ['nullable', 'string', 'max:32'],
            'contact_name' => ['nullable', 'string', 'max:255'],
        ]);
        $v = Vendor::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'address' => $validated['address'] ?? null,
            'whatsapp_number' => $validated['whatsapp_number'] ?? null,
            'contact_name' => $validated['contact_name'] ?? null,
            'status' => 'pending',
        ]);
        return response()->json([
            'message' => 'Application submitted. We will review and contact you soon.',
            'data' => [
                'id' => $v->id,
                'name' => $v->name,
                'email' => $v->email,
            ],
        ], 201);
    }
}
