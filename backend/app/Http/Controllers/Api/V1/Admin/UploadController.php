<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

/**
 * POST /api/v1/admin/uploads
 * multipart/form-data: images[] (files), folder (optional)
 * folder: logo | categories | products | brands | utility — saves to storage/app/public/{folder}/...
 * Default: products (backward compatible).
 */
class UploadController extends Controller
{
    private const ALLOWED_FOLDERS = ['logo', 'categories', 'products', 'brands', 'utility'];

    public function store(Request $request): JsonResponse
    {
        $folder = $request->input('folder', 'products');
        if (!in_array($folder, self::ALLOWED_FOLDERS, true)) {
            $folder = 'products';
        }

        Log::info('Upload request received', [
            'method' => $request->method(),
            'folder' => $folder,
            'request_has_images' => $request->has('images'),
            'request_has_images_array' => $request->has('images[]'),
        ]);

        $files = $request->file('images') ?? $request->file('images[]') ?? [];
        if (!is_array($files)) {
            $files = [$files];
        }
        $files = array_filter($files);

        if (empty($files)) {
            Log::warning('No images provided', ['all_files' => $request->allFiles()]);
            return response()->json(['message' => 'No images provided'], 422);
        }

        foreach ($files as $file) {
            if (!$file->isValid()) {
                return response()->json(['message' => 'Invalid file: ' . $file->getClientOriginalName()], 422);
            }
            if (!$file->isFile()) {
                return response()->json(['message' => 'Not a valid file: ' . $file->getClientOriginalName()], 422);
            }
            if ($file->getSize() > 5120 * 1024) { // 5MB
                return response()->json(['message' => 'File too large: ' . $file->getClientOriginalName()], 422);
            }
        }

        $uploaded = [];
        $disk = 'public';
        $dir = $folder . '/' . now()->format('Y/m/d');

        foreach ($files as $file) {
            $name = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs($dir, $name, $disk);
            $url = Storage::disk($disk)->url($path);
            // Ensure absolute URL for production
            if (!str_starts_with($url, 'http')) {
                $url = rtrim(config('app.url'), '/') . $url;
            }
            $uploaded[] = ['path' => $path, 'url' => $url];
        }

        return response()->json([
            'message' => 'Images uploaded',
            'data' => $uploaded,
        ], 201);
    }
}
