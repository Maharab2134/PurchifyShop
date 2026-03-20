<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Throwable;

class MediaController extends Controller
{
    private const ALLOWED_FOLDERS = ['logo', 'categories', 'products', 'brands', 'utility'];

    public function index(Request $request): JsonResponse
    {
        $requestedFolder = (string) $request->input('folder', 'all');
        $search = trim((string) $request->input('search', ''));
        $limit = (int) $request->input('limit', 60);
        $limit = max(1, min($limit, 200));
        $page = max((int) $request->input('page', 1), 1);

        $folders = $this->resolveFolders($requestedFolder);

        $media = [];
        foreach ($folders as $folder) {
            $files = Storage::disk('public')->allFiles($folder);
            foreach ($files as $path) {
                if (!$this->isImageFile($path)) {
                    continue;
                }

                if ($search !== '' && stripos($path, $search) === false) {
                    continue;
                }

                try {
                    $size = (int) (Storage::disk('public')->size($path) ?? 0);
                    $timestamp = Storage::disk('public')->lastModified($path);
                    $lastModified = $timestamp ? date(DATE_ATOM, $timestamp) : null;
                } catch (Throwable) {
                    // File may disappear while scanning; skip metadata and continue.
                    $size = 0;
                    $lastModified = null;
                }

                $media[] = [
                    'path' => $path,
                    'url' => $this->absoluteUrl(Storage::disk('public')->url($path)),
                    'folder' => explode('/', $path)[0] ?? $folder,
                    'name' => basename($path),
                    'sizeBytes' => $size,
                    'lastModified' => $lastModified,
                ];
            }
        }

        usort($media, function (array $a, array $b): int {
            return strcmp((string) ($b['lastModified'] ?? ''), (string) ($a['lastModified'] ?? ''));
        });

        $totalResults = count($media);
        $totalPages = max(1, (int) ceil($totalResults / $limit));
        $offset = ($page - 1) * $limit;
        $items = array_slice($media, $offset, $limit);

        return response()->json([
            'data' => [
                'media' => array_values($items),
                'totalResults' => $totalResults,
                'totalPages' => $totalPages,
                'currentPage' => $page,
                'resultsPerPage' => $limit,
                'folders' => array_merge(['all'], self::ALLOWED_FOLDERS),
            ],
        ]);
    }

    private function resolveFolders(string $requestedFolder): array
    {
        if ($requestedFolder === 'all') {
            return self::ALLOWED_FOLDERS;
        }

        if (in_array($requestedFolder, self::ALLOWED_FOLDERS, true)) {
            return [$requestedFolder];
        }

        return self::ALLOWED_FOLDERS;
    }

    private function isImageFile(string $path): bool
    {
        return (bool) preg_match('/\.(jpg|jpeg|png|gif|webp|svg|bmp|avif)$/i', $path);
    }

    private function absoluteUrl(string $url): string
    {
        if (str_starts_with($url, 'http')) {
            return $url;
        }

        return rtrim(config('app.url'), '/') . $url;
    }
}
