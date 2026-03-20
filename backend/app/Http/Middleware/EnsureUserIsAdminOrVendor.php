<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdminOrVendor
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $role = strtoupper((string) $user->role);
        if (in_array($role, ['ADMIN', 'SUPERADMIN'], true)) {
            return $next($request);
        }

        if ($role !== 'VENDOR') {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $isVendorSystemActive = filter_var(Setting::getValue('vendor_system_active', '1'), FILTER_VALIDATE_BOOLEAN);
        if (! $isVendorSystemActive) {
            return response()->json(['message' => 'Vendor system is currently inactive.'], 403);
        }

        if ($user->is_active === false) {
            return response()->json(['message' => 'Your account has been deactivated. Contact support.'], 403);
        }

        $user->loadMissing('vendor');
        if (! $user->vendor_id || ! $user->vendor || $user->vendor->status !== 'approved') {
            return response()->json(['message' => 'Your vendor account is not approved yet.'], 403);
        }

        return $next($request);
    }
}
