<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use App\Mail\PasswordResetMail;

class AuthController extends Controller
{
    /**
     * POST /api/v1/auth/sign-up
     * Body: { name, email, password }
     */
    public function signUp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', PasswordRule::defaults()],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => 'USER',
        ]);

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'data' => [
                'user' => $this->userResource($user),
                'accessToken' => $token,
            ],
        ], 201);
    }

    /**
     * POST /api/v1/auth/sign-in
     * Body: { email, password }
     */
    public function signIn(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email or password is incorrect.'],
            ]);
        }

        if ($user->is_active === false) {
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated. Contact support.'],
            ]);
        }

        $user->load(['roleModel', 'vendor']);
        if ($user->roleModel && $user->roleModel->is_active === false) {
            throw ValidationException::withMessages([
                'email' => ['Your role has been deactivated. Contact support.'],
            ]);
        }

        if (strtoupper((string) $user->role) === 'VENDOR') {
            $isVendorSystemActive = filter_var(Setting::getValue('vendor_system_active', '1'), FILTER_VALIDATE_BOOLEAN);
            if (! $isVendorSystemActive) {
                throw ValidationException::withMessages([
                    'email' => ['Vendor system is currently inactive. Please contact support.'],
                ]);
            }

            if (! $user->vendor_id || ! $user->vendor || $user->vendor->status !== 'approved') {
                throw ValidationException::withMessages([
                    'email' => ['Your vendor account is not approved yet.'],
                ]);
            }
        }

        // For SUPERADMIN: revoke all existing tokens to enforce single session
        if ($user->role === 'SUPERADMIN') {
            $user->tokens()->delete();
        }

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'message' => 'User logged in successfully',
            'data' => [
                'user' => $this->userResource($user),
                'accessToken' => $token,
            ],
        ]);
    }

    /**
     * POST /api/v1/auth/sign-out
     * Bearer token required.
     */
    public function signOut(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * POST /api/v1/auth/refresh-token
     * Bearer token required. Returns new token; revokes current.
     */
    public function refreshToken(Request $request): JsonResponse
    {
        $user = $request->user();
        
        // For SUPERADMIN: revoke all tokens to ensure single session
        if ($user->role === 'SUPERADMIN') {
            $user->tokens()->delete();
        } else {
            // For other users: only delete current token
            $request->user()->currentAccessToken()->delete();
        }
        
        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'message' => 'Token refreshed successfully',
            'data' => [
                'user' => $this->userResource($user),
                'accessToken' => $token,
            ],
        ]);
    }

    /**
     * GET /api/v1/auth/me
     * Bearer token required.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => ['user' => $this->userResource($request->user())],
        ]);
    }

    /**
     * PUT /api/v1/auth/profile
     * Bearer token required.
     * Body: { name?, email?, phone? }
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'unique:users,email,' . $user->id],
            'phone' => ['sometimes', 'string'],
        ]);

        // Normalize phone number if provided
        if (isset($validated['phone'])) {
            $phone = preg_replace('/\D/', '', $validated['phone']);
            if (!preg_match('/^01\d{9}$/', $phone)) {
                return response()->json(['message' => 'Phone number must be exactly 11 digits starting with 01.'], 422);
            }
            $validated['phone'] = $phone;
        }

        if (isset($validated['name'])) {
            $user->name = $validated['name'];
        }
        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }
        if (isset($validated['phone'])) {
            $user->phone = $validated['phone'];
        }
        $user->save();

        return response()->json([
            'message' => 'Profile updated successfully',
            'data' => ['user' => $this->userResource($user->fresh())],
        ]);
    }

    /**
     * PUT /api/v1/auth/change-password
     * Bearer token required.
     * Body: { currentPassword, newPassword }
     */
    public function changePassword(Request $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validate([
            'currentPassword' => ['required', 'string'],
            'newPassword' => ['required', 'string', PasswordRule::defaults()],
        ]);

        if (!Hash::check($validated['currentPassword'], $user->password)) {
            throw ValidationException::withMessages([
                'currentPassword' => ['Current password is incorrect.'],
            ]);
        }

        $user->forceFill([
            'password' => $validated['newPassword'],
        ])->save();

        return response()->json(['message' => 'Password changed successfully.']);
    }

    /**
     * POST /api/v1/auth/forgot-password
     * Body: { email }
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        $user = User::where('email', $request->input('email'))->first();
        if (! $user) {
            return response()->json(['message' => 'Password reset email sent.'], 200);
        }

        $token = Str::random(64);
        $user->forceFill([
            'reset_password_token' => Hash::make($token),
            'reset_password_token_expires_at' => now()->addMinutes(60),
        ])->save();

        $frontendUrl = config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173'));
        $url = rtrim($frontendUrl, '/') . '/password-reset/' . $token;
        
        // Send password reset email
        try {
            Mail::to($user->email, $user->name)->send(new PasswordResetMail($user, $url));
        } catch (\Exception $e) {
            // Log the error but don't expose it to the user
            \Log::error('Failed to send password reset email: ' . $e->getMessage());
            // Still return success to prevent email enumeration
        }

        return response()->json(['message' => 'Password reset email sent.']);
    }

    /**
     * POST /api/v1/auth/reset-password
     * Body: { token, newPassword }
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string'],
            'newPassword' => ['required', 'string', PasswordRule::defaults()],
        ]);

        $user = User::whereNotNull('reset_password_token')
            ->where('reset_password_token_expires_at', '>', now())
            ->get()
            ->first(fn (User $u) => Hash::check($validated['token'], $u->reset_password_token));

        if (! $user || ! $user->reset_password_token_expires_at || $user->reset_password_token_expires_at->isPast()) {
            throw ValidationException::withMessages(['token' => ['Invalid or expired reset token.']]);
        }

        $user->forceFill([
            'password' => $validated['newPassword'],
            'reset_password_token' => null,
            'reset_password_token_expires_at' => null,
        ])->save();

        return response()->json(['message' => 'Password reset successful. You can now log in.']);
    }

    private function userResource(User $user): array
    {
        $user->load('roleModel');
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'vendorId' => $user->vendor_id,
            'role' => $user->role,
            'roleId' => $user->role_id,
            'roleModel' => $user->roleModel ? [
                'id' => $user->roleModel->id,
                'name' => $user->roleModel->name,
                'permissions' => $user->roleModel->permissions ?? [],
            ] : null,
            'avatar' => $user->avatar,
        ];
    }
}
