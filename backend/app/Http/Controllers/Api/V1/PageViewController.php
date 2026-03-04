<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PageView;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PageViewController extends Controller
{
    /**
     * Track a page view (public, no auth). Storefront only; skip /dashboard, /sign-in, etc.
     */
    public function track(Request $request): JsonResponse
    {
        $valid = $request->validate([
            'path' => 'required|string|max:512',
            'referrer' => 'nullable|string|max:512',
            'sessionId' => 'nullable|string|max:64',
        ]);

        $path = $valid['path'];
        if (Str::startsWith($path, ['/dashboard', '/sign-in', '/sign-up', '/password-reset'])) {
            return response()->json(['message' => 'Skipped'], 200);
        }

        $sessionId = $valid['sessionId'] ?? Str::uuid()->toString();

        $ip = $request->ip();
        $ua = $request->userAgent();
        if (is_string($ua) && strlen($ua) > 512) {
            $ua = substr($ua, 0, 512);
        }

        PageView::create([
            'session_id' => $sessionId,
            'path' => $path,
            'referrer' => $valid['referrer'] ?? null,
            'ip_address' => $ip,
            'user_agent' => $ua,
            'viewed_at' => now(),
        ]);

        return response()->json(['sessionId' => $sessionId], 201);
    }
}
