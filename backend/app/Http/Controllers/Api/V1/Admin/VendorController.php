<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use App\Models\Setting;
use App\Models\User;
use App\Models\Vendor;
use App\Services\EmailService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VendorController extends Controller
{
    public function __construct(
        protected EmailService $emailService
    ) {}
    public function index(Request $request): JsonResponse
    {
        $q = Vendor::query()->orderBy('created_at', 'desc');
        if ($request->filled('search')) {
            $s = '%' . $request->input('search') . '%';
            $q->where(function ($q) use ($s) {
                $q->where('name', 'like', $s)
                    ->orWhere('email', 'like', $s)
                    ->orWhere('contact_name', 'like', $s)
                    ->orWhere('whatsapp_number', 'like', $s);
            });
        }
        if ($request->filled('status') && in_array($request->input('status'), ['pending', 'approved'], true)) {
            $q->where('status', $request->input('status'));
        }
        $perPage = min((int) $request->input('limit', 50), 100);
        $paginated = $q->paginate($perPage);
        $items = $paginated->getCollection()->map(fn ($v) => $this->resource($v));
        return response()->json([
            'data' => [
                'vendors' => $items,
                'totalResults' => $paginated->total(),
                'totalPages' => $paginated->lastPage(),
                'currentPage' => $paginated->currentPage(),
                'resultsPerPage' => $paginated->perPage(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'whatsapp_number' => ['nullable', 'string', 'max:32'],
            'contact_name' => ['nullable', 'string', 'max:255'],
        ]);
        $v = Vendor::create(array_merge($validated, ['status' => 'approved']));
        return response()->json(['message' => 'Vendor created', 'data' => $this->resource($v)], 201);
    }

    public function approve(string $id): JsonResponse
    {
        $v = Vendor::findOrFail($id);

        if (! $v->email || trim((string) $v->email) === '') {
            return response()->json(['message' => 'Vendor email is required before approval.'], 422);
        }
        if (! $v->whatsapp_number || trim((string) $v->whatsapp_number) === '') {
            return response()->json(['message' => 'Vendor phone/WhatsApp number is required before approval.'], 422);
        }

        $wasAlreadyApproved = $v->status === 'approved';

        DB::transaction(function () use ($v, $wasAlreadyApproved): void {
            if (! $wasAlreadyApproved) {
                $v->update(['status' => 'approved']);
            }
            $this->provisionVendorUser($v->fresh());
        });

        $v = $v->fresh();
        $plainPassword = trim((string) $v->whatsapp_number);
        $email = $v->email;
        $sent = false;
        if ($email) {
            $template = EmailTemplate::where('event_type', 'vendor_approved')->first();
            $variables = [
                'vendor_name' => $v->name,
                'vendor_contact_name' => $v->contact_name ?: $v->name,
                'vendor_email' => $v->email,
            ];
            try {
                if ($template && $template->is_enabled) {
                    $sent = $this->emailService->sendTemplateEmail(
                        $template,
                        $email,
                        $v->contact_name ?: $v->name,
                        $variables,
                        'Vendor',
                        $v->id
                    );
                } else {
                    $bodyHtml = '<p>Hello ' . e($v->contact_name ?: $v->name) . ',</p>'
                        . '<p>Your vendor application for <strong>' . e($v->name) . '</strong> has been approved. You can now work with us as a vendor.</p>'
                        . '<p><strong>Login:</strong> ' . e($v->email) . '<br/><strong>Password:</strong> ' . e($plainPassword) . '</p>'
                        . '<p>Use the admin login panel to sign in.</p>'
                        . '<p>Thank you.</p>';
                    $sent = $this->emailService->sendSimpleEmail(
                        $email,
                        $v->contact_name ?: $v->name,
                        'Your Vendor Application Has Been Approved',
                        $bodyHtml
                    );
                }
            } catch (\Throwable $e) {
                report($e);
            }
        }
        $message = $sent
            ? ($wasAlreadyApproved
                ? 'Vendor already approved. Account synced and notification sent'
                : 'Vendor approved, account created, and notification sent')
            : ($wasAlreadyApproved
                ? 'Vendor already approved. Account synced. Email not sent (check Admin → Email Settings).'
                : 'Vendor approved and account created. Email not sent (check Admin → Email Settings).');
        return response()->json(['message' => $message, 'data' => $this->resource($v->fresh())]);
    }

    public function systemStatus(): JsonResponse
    {
        $this->authorizeSystemStatusChange();

        return response()->json([
            'data' => [
                'isActive' => filter_var(Setting::getValue('vendor_system_active', '1'), FILTER_VALIDATE_BOOLEAN),
            ],
        ]);
    }

    public function updateSystemStatus(Request $request): JsonResponse
    {
        $this->authorizeSystemStatusChange();

        $validated = $request->validate([
            'isActive' => ['required', 'boolean'],
        ]);

        Setting::setValue('vendor_system_active', $validated['isActive'] ? '1' : '0');

        return response()->json([
            'message' => $validated['isActive'] ? 'Vendor system activated' : 'Vendor system deactivated',
            'data' => ['isActive' => (bool) $validated['isActive']],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $v = Vendor::findOrFail($id);
        return response()->json(['data' => $this->resource($v)]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $v = Vendor::findOrFail($id);
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string'],
            'whatsapp_number' => ['nullable', 'string', 'max:32'],
            'contact_name' => ['nullable', 'string', 'max:255'],
        ]);
        $v->update([
            'name' => $validated['name'] ?? $v->name,
            'email' => array_key_exists('email', $validated) ? $validated['email'] : $v->email,
            'address' => array_key_exists('address', $validated) ? $validated['address'] : $v->address,
            'whatsapp_number' => array_key_exists('whatsapp_number', $validated) ? $validated['whatsapp_number'] : $v->whatsapp_number,
            'contact_name' => array_key_exists('contact_name', $validated) ? $validated['contact_name'] : $v->contact_name,
        ]);
        return response()->json(['message' => 'Vendor updated', 'data' => $this->resource($v->fresh())]);
    }

    public function destroy(string $id): JsonResponse
    {
        $v = Vendor::findOrFail($id);
        $v->delete();
        return response()->json(['message' => 'Vendor deleted']);
    }

    private function resource(Vendor $v): array
    {
        return [
            'id' => $v->id,
            'name' => $v->name,
            'email' => $v->email,
            'address' => $v->address,
            'whatsappNumber' => $v->whatsapp_number,
            'contactName' => $v->contact_name,
            'status' => $v->status ?? 'pending',
            'createdAt' => $v->created_at?->toIso8601String(),
            'updatedAt' => $v->updated_at?->toIso8601String(),
        ];
    }

    private function provisionVendorUser(Vendor $vendor): User
    {
        $email = trim((string) $vendor->email);
        $password = trim((string) $vendor->whatsapp_number);

        $existingByVendor = User::where('vendor_id', $vendor->id)->first();
        $existingByEmail = User::where('email', $email)->first();

        if ($existingByEmail && in_array(strtoupper((string) $existingByEmail->role), ['ADMIN', 'SUPERADMIN'], true)) {
            throw ValidationException::withMessages([
                'email' => ['This email is already used by an admin account. Use another vendor email.'],
            ]);
        }

        $user = $existingByVendor ?? $existingByEmail ?? new User();

        $user->name = $vendor->contact_name ?: $vendor->name;
        $user->email = $email;
        $user->phone = $password;
        $user->password = $password;
        $user->role = 'VENDOR';
        $user->vendor_id = $vendor->id;
        if ($user->is_active === null) {
            $user->is_active = true;
        }
        $user->save();

        return $user;
    }

    private function authorizeSystemStatusChange(): void
    {
        $role = strtoupper((string) request()->user()?->role);
        if (! in_array($role, ['ADMIN', 'SUPERADMIN'], true)) {
            abort(response()->json(['message' => 'Only admin/superadmin can manage vendor system status.'], 403));
        }
    }
}
