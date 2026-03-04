<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\ImageDeletionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ImageController extends Controller
{
    public function destroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'path' => ['required', 'string', 'max:512'],
            'ownerType' => ['required', 'string', 'in:product,category,subcategory,brand,homeSection,slider,section,settings,variant'],
            'ownerId' => ['nullable', 'string'],
            'field' => ['nullable', 'string', 'max:64'],
        ]);

        $service = new ImageDeletionService();
        $path = $service->normalizePath($validated['path']);
        if (!$service->isAllowedPath($path)) {
            return response()->json(['message' => 'Invalid image path'], 422);
        }

        $ownerType = $validated['ownerType'];
        $ownerId = $validated['ownerId'] ?? null;
        $field = $validated['field'] ?? null;

        if (!in_array($ownerType, ['settings'], true) && !$ownerId) {
            return response()->json(['message' => 'ownerId is required'], 422);
        }

        $service->removeFromOwner($ownerType, $ownerId, $field, $path);
        $deletedFromStorage = $service->deleteFromStorageIfOrphan($path);

        Log::info('admin.image_deleted', [
            'userId' => $request->user()?->id,
            'ownerType' => $ownerType,
            'ownerId' => $ownerId,
            'field' => $field,
            'path' => $path,
            'deletedFromStorage' => $deletedFromStorage,
        ]);

        return response()->json([
            'message' => 'Image deleted',
            'data' => [
                'path' => $path,
                'deletedFromStorage' => $deletedFromStorage,
            ],
        ]);
    }
}
