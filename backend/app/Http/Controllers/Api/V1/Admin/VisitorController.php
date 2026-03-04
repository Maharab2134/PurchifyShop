<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;

class VisitorController extends Controller
{
    /**
     * GET /api/v1/admin/recent-visitors
     * Returns recent visitor sessions from `page_views` (SUPERADMIN UI can show it).
     */
    public function index(Request $request): JsonResponse
    {
        $limit = min((int) $request->input('limit', 20), 100);

        if (!Schema::hasTable('page_views')) {
            return response()->json(['data' => ['visitors' => []]]);
        }

        // Last viewed row per session_id
        $latest = DB::table('page_views as pv')
            ->select('pv.session_id', DB::raw('MAX(pv.viewed_at) as last_viewed_at'))
            ->groupBy('pv.session_id');

        $rows = DB::table('page_views as pv')
            ->joinSub($latest, 't', function ($join) {
                $join->on('pv.session_id', '=', 't.session_id')
                    ->on('pv.viewed_at', '=', 't.last_viewed_at');
            })
            ->select(
                'pv.session_id',
                'pv.ip_address',
                'pv.user_agent',
                'pv.path as last_path',
                't.last_viewed_at'
            )
            ->orderByDesc('t.last_viewed_at')
            ->limit($limit)
            ->get();

        // Counts per session
        $counts = DB::table('page_views')
            ->select(
                'session_id',
                DB::raw('COUNT(*) as actions'),
                DB::raw('COUNT(DISTINCT path) as pages')
            )
            ->whereIn('session_id', $rows->pluck('session_id')->all())
            ->groupBy('session_id')
            ->get()
            ->keyBy('session_id');

        $data = $rows->map(function ($r) use ($counts) {
            $ua = is_string($r->user_agent) ? $r->user_agent : '';
            $parsed = $this->parseUserAgent($ua);
            $c = $counts->get($r->session_id);
            $ip = $r->ip_address;

            return [
                'sessionId' => $r->session_id,
                'ipAddress' => $r->ip_address,
                'location' => $this->resolveLocation($ip),
                'device' => $parsed['device'],
                'browser' => $parsed['browser'],
                'time' => $r->last_viewed_at,
                'pages' => (int) ($c?->pages ?? 0),
                'actions' => (int) ($c?->actions ?? 0),
                'lastPath' => $r->last_path,
            ];
        })->values()->all();

        return response()->json(['data' => ['visitors' => $data]]);
    }

    /**
     * POST /api/v1/admin/recent-visitors/clear
     * Clears visitor browsing data (page_views) and cached IP locations.
     */
    public function clear(): JsonResponse
    {
        if (Schema::hasTable('page_views')) {
            DB::table('page_views')->truncate();
        }
        if (Schema::hasTable('ip_locations')) {
            DB::table('ip_locations')->truncate();
        }

        return response()->json(['message' => 'Recent visitors cleared']);
    }

    private function parseUserAgent(string $ua): array
    {
        $u = strtolower($ua);

        $device = 'Desktop';
        if (str_contains($u, 'mobile') || str_contains($u, 'android') || str_contains($u, 'iphone') || str_contains($u, 'ipad')) {
            $device = 'Mobile';
        }

        $browser = 'Unknown';
        if (str_contains($u, 'edg/')) {
            $browser = 'Edge';
        } elseif (str_contains($u, 'opr/') || str_contains($u, 'opera')) {
            $browser = 'Opera';
        } elseif (str_contains($u, 'chrome/')) {
            $browser = 'Chrome';
        } elseif (str_contains($u, 'firefox/')) {
            $browser = 'Firefox';
        } elseif (str_contains($u, 'safari/') && !str_contains($u, 'chrome/')) {
            $browser = 'Safari';
        }

        return ['device' => $device, 'browser' => $browser];
    }

    /**
     * Resolve IP -> Location (cached in DB).
     * Uses ip-api.com (no key) as a lightweight default.
     */
    private function resolveLocation(?string $ip): ?string
    {
        if (!$ip || trim($ip) === '') return null;
        $ip = trim($ip);

        // Skip local/private IPs
        if (in_array($ip, ['127.0.0.1', '::1'], true)) return null;
        if (preg_match('/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/', $ip)) return null;

        if (!Schema::hasTable('ip_locations')) return null;

        $cached = DB::table('ip_locations')->where('ip', $ip)->first();
        if ($cached) {
            return $cached->location ?: null;
        }

        try {
            $res = Http::timeout(2)->get("http://ip-api.com/json/{$ip}", [
                'fields' => 'status,country,regionName,city,query,message',
            ]);
            $json = $res->json();
            if (!is_array($json) || ($json['status'] ?? null) !== 'success') {
                DB::table('ip_locations')->insert([
                    'ip' => $ip,
                    'location' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                return null;
            }

            $parts = array_filter([
                $json['city'] ?? null,
                $json['regionName'] ?? null,
                $json['country'] ?? null,
            ], fn ($v) => is_string($v) && trim($v) !== '');
            $location = !empty($parts) ? implode(', ', $parts) : null;

            DB::table('ip_locations')->insert([
                'ip' => $ip,
                'location' => $location,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return $location;
        } catch (\Throwable $e) {
            // Fail silently; no location is better than breaking the page.
            return null;
        }
    }
}

