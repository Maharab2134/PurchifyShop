<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Setting;
use App\Models\Shipment;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PathaoService
{
    /** Get credentials from admin panel (Setting) first */
    public static function getApiKey(): ?string
    {
        $v = Setting::getValue('pathao_api_key');
        return ($v !== null && $v !== '') ? $v : null;
    }

    public static function getSecretKey(): ?string
    {
        $v = Setting::getValue('pathao_secret_key');
        return ($v !== null && $v !== '') ? $v : null;
    }

    public static function getUsername(): ?string
    {
        $v = Setting::getValue('pathao_username');
        return ($v !== null && $v !== '') ? $v : null;
    }

    public static function getPassword(): ?string
    {
        $v = Setting::getValue('pathao_password');
        return ($v !== null && $v !== '') ? $v : null;
    }

    public static function getBaseUrl(): string
    {
        $v = Setting::getValue('pathao_base_url');
        if ($v !== null && $v !== '') {
            return rtrim($v, '/');
        }
        return 'https://api-hermes.pathao.com';
    }

    public static function getStoreId(): ?string
    {
        $v = Setting::getValue('pathao_store_id');
        return ($v !== null && $v !== '') ? $v : null;
    }

    /** Check if Pathao API is configured (Client ID + Secret + Username + Password for parcel creation) */
    public static function isConfigured(): bool
    {
        return ! empty(self::getApiKey()) && ! empty(self::getSecretKey())
            && ! empty(self::getUsername()) && ! empty(self::getPassword());
    }

    /**
     * Get OAuth access token (Pathao uses password grant).
     */
    public function getAccessToken(): array
    {
        $baseUrl = self::getBaseUrl();
        $clientId = self::getApiKey();
        $clientSecret = self::getSecretKey();
        $username = self::getUsername();
        $password = self::getPassword();

        if (! $clientId || ! $clientSecret || ! $username || ! $password) {
            return [
                'success' => false,
                'message' => 'Pathao credentials incomplete. Set Client ID, Client Secret, Username and Password in Courier → Settings → Pathao Settings.',
            ];
        }

        $url = $baseUrl . '/alphabet/v1/auth/token';
        try {
            $response = Http::asForm()
                ->timeout(15)
                ->post($url, [
                    'grant_type' => 'password',
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                    'username' => $username,
                    'password' => $password,
                ]);

            $body = $response->json();
            if ($response->successful() && ! empty($body['access_token'])) {
                return [
                    'success' => true,
                    'access_token' => $body['access_token'],
                    'expires_in' => $body['expires_in'] ?? 3600,
                ];
            }
            $msg = $body['message'] ?? $body['error_description'] ?? $body['errors'] ?? $response->body();
            if (is_array($msg)) {
                $msg = json_encode($msg);
            }
            Log::warning('Pathao token failed', ['url' => $url, 'body' => $body]);
            return [
                'success' => false,
                'message' => $msg ?: 'Pathao authentication failed. Check credentials.',
            ];
        } catch (\Throwable $e) {
            Log::warning('Pathao token request error', ['url' => $url, 'error' => $e->getMessage()]);
            return [
                'success' => false,
                'message' => 'Could not reach Pathao API: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Authenticated request to Pathao API.
     */
    private function request(string $method, string $path, array $body = [], ?string $token = null): array
    {
        if ($token === null) {
            $auth = $this->getAccessToken();
            if (! ($auth['success'] ?? false)) {
                return ['status' => 401, 'message' => $auth['message'] ?? 'Unauthorized'];
            }
            $token = $auth['access_token'];
        }

        $baseUrl = self::getBaseUrl();
        $url = $baseUrl . $path;
        try {
            $req = Http::withToken($token)->timeout(20);
            if ($method === 'GET') {
                $response = $req->get($url, $body); // $body as query params
            } else {
                $response = $req->post($url, $body);
            }
            $data = $response->json();
            if (is_array($data)) {
                $data['_http_status'] = $response->status();
            } else {
                $data = ['_http_status' => $response->status(), 'body' => $response->body()];
            }
            return $data;
        } catch (\Throwable $e) {
            Log::warning('Pathao API request error', ['path' => $path, 'error' => $e->getMessage()]);
            return ['_http_status' => 0, 'message' => $e->getMessage()];
        }
    }

    /**
     * Get Pathao city list (for dropdown).
     */
    public function getCities(): array
    {
        $auth = $this->getAccessToken();
        if (! ($auth['success'] ?? false)) {
            return ['success' => false, 'message' => $auth['message'] ?? 'Unauthorized', 'data' => []];
        }
        // Pathao official: GET /aladdin/api/v1/countries/1/city-list (Bangladesh = 1)
        $res = $this->request('GET', '/aladdin/api/v1/countries/1/city-list', [], $auth['access_token']);
        $status = $res['_http_status'] ?? 0;
        $list = $res['data']['data'] ?? $res['data'] ?? $res['cities'] ?? [];
        if ($status >= 200 && $status < 300 && is_array($list)) {
            $list = array_values(array_map(function ($c) {
                return [
                    'city_id' => $c['city_id'] ?? $c['id'] ?? 0,
                    'city_name' => $c['city_name'] ?? $c['name'] ?? (string) $c,
                ];
            }, $list));
            return ['success' => true, 'data' => $list];
        }
        return [
            'success' => false,
            'message' => $res['message'] ?? $res['data']['message'] ?? 'Failed to load cities',
            'data' => [],
        ];
    }

    /**
     * Get Pathao zone list for a city.
     */
    public function getZones(int $cityId): array
    {
        $auth = $this->getAccessToken();
        if (! ($auth['success'] ?? false)) {
            return ['success' => false, 'message' => $auth['message'] ?? 'Unauthorized', 'data' => []];
        }
        $res = $this->request('GET', '/alphabet/v1/zone-list', ['city_id' => $cityId], $auth['access_token']);
        $status = $res['_http_status'] ?? 0;
        $list = $res['data'] ?? $res['zones'] ?? [];
        if ($status >= 200 && $status < 300 && is_array($list)) {
            $list = array_values(array_map(function ($z) {
                return [
                    'zone_id' => $z['zone_id'] ?? $z['id'] ?? 0,
                    'zone_name' => $z['zone_name'] ?? $z['name'] ?? (string) $z,
                ];
            }, $list));
            return ['success' => true, 'data' => $list];
        }
        return [
            'success' => false,
            'message' => $res['message'] ?? 'Failed to load zones',
            'data' => [],
        ];
    }

    /**
     * Get Pathao area list for a zone.
     */
    public function getAreas(int $zoneId): array
    {
        $auth = $this->getAccessToken();
        if (! ($auth['success'] ?? false)) {
            return ['success' => false, 'message' => $auth['message'] ?? 'Unauthorized', 'data' => []];
        }
        $res = $this->request('GET', '/alphabet/v1/area-list', ['zone_id' => $zoneId], $auth['access_token']);
        $status = $res['_http_status'] ?? 0;
        $list = $res['data'] ?? $res['areas'] ?? [];
        if ($status >= 200 && $status < 300 && is_array($list)) {
            $list = array_values(array_map(function ($a) {
                return [
                    'area_id' => $a['area_id'] ?? $a['id'] ?? 0,
                    'area_name' => $a['area_name'] ?? $a['name'] ?? (string) $a,
                ];
            }, $list));
            return ['success' => true, 'data' => $list];
        }
        return [
            'success' => false,
            'message' => $res['message'] ?? 'Failed to load areas',
            'data' => [],
        ];
    }

    /**
     * Create parcel via Pathao API.
     * Requires pathao_city_id, pathao_zone_id, pathao_area_id (from request or order/address).
     */
    public function createParcel(Order $order, ?int $cityId = null, ?int $zoneId = null, ?int $areaId = null): array
    {
        if (! self::isConfigured()) {
            return [
                'success' => false,
                'message' => 'Pathao API is not configured. Set Client ID, Client Secret, Username and Password in Courier → Settings → Pathao Settings.',
            ];
        }

        $storeId = self::getStoreId();
        if (! $storeId) {
            return [
                'success' => false,
                'message' => 'Pathao Store ID is not set. Set it in Courier → Settings → Pathao Settings.',
            ];
        }

        if ($cityId === null || $zoneId === null || $areaId === null) {
            return [
                'success' => false,
                'message' => 'Delivery location required. Please select City, Zone and Area for this order.',
            ];
        }

        $order->load(['address', 'user', 'orderItems']);
        $address = $order->address;
        $user = $order->user;

        $recipientName = trim($user->name ?? 'Customer');
        $recipientName = $recipientName !== '' ? mb_substr($recipientName, 0, 100) : 'Customer';
        $rawPhone = $order->contact_phone ?? $user->phone ?? '';
        $recipientPhone = preg_replace('/\D/', '', (string) $rawPhone);
        if ($recipientPhone === '') {
            $recipientPhone = '0000000000';
        }
        if (strlen($recipientPhone) > 11) {
            $recipientPhone = substr($recipientPhone, -11);
        }
        $recipientPhone = substr($recipientPhone, 0, 11);

        $parts = $address ? array_filter([$address->street, $address->city, $address->state, $address->country, $address->zip]) : [];
        $recipientAddress = $parts ? implode(', ', array_map('trim', $parts)) : 'N/A';
        $recipientAddress = mb_substr(trim($recipientAddress), 0, 250);

        $amountToCollect = (int) round((float) $order->amount);
        if ($amountToCollect < 0) {
            $amountToCollect = 0;
        }
        $merchantOrderId = (string) ($order->tracking_number ?? $order->id);
        $merchantOrderId = preg_replace('/\s+/', '', $merchantOrderId);
        $merchantOrderId = mb_substr($merchantOrderId, 0, 100) ?: 'ORD-' . substr($order->id, 0, 8);

        $weightKg = $order->parcel_weight !== null && (float) $order->parcel_weight > 0
            ? (float) $order->parcel_weight
            : 1;
        $itemDesc = 'Order #' . ($order->tracking_number ?? substr($order->id, 0, 8));

        $payload = [
            'store_id' => $storeId,
            'merchant_order_id' => $merchantOrderId,
            'recipient_name' => $recipientName,
            'recipient_phone' => $recipientPhone,
            'recipient_address' => $recipientAddress,
            'recipient_city' => (string) $cityId,
            'recipient_zone' => (string) $zoneId,
            'recipient_area' => (string) $areaId,
            'delivery_type' => '48',
            'item_type' => '2',
            'special_instruction' => '',
            'item_quantity' => '1',
            'item_weight' => (string) $weightKg,
            'amount_to_collect' => (string) $amountToCollect,
            'item_description' => $itemDesc,
        ];

        $auth = $this->getAccessToken();
        if (! ($auth['success'] ?? false)) {
            return [
                'success' => false,
                'message' => $auth['message'] ?? 'Pathao authentication failed.',
            ];
        }

        $res = $this->request('POST', '/aladdin/api/v1/orders', $payload, $auth['access_token']);
        $status = $res['_http_status'] ?? 0;
        unset($res['_http_status']);

        if ($status >= 200 && $status < 300) {
            $consignmentId = $res['consignment_id'] ?? $res['data']['consignment_id'] ?? null;
            $trackingCode = $consignmentId ?? $res['tracking_code'] ?? $res['data']['tracking_code'] ?? null;
            if (! $consignmentId && is_string($trackingCode)) {
                $consignmentId = $trackingCode;
            }

            if ($consignmentId || $trackingCode) {
                $shipment = $order->shipment;
                $weight = $order->parcel_weight !== null ? (float) $order->parcel_weight : null;
                if (! $shipment) {
                    Shipment::create([
                        'order_id' => $order->id,
                        'carrier' => 'Pathao',
                        'courier_company' => 'Pathao',
                        'courier_tracking_id' => $consignmentId ?? $trackingCode,
                        'tracking_number' => $trackingCode ?? $consignmentId,
                        'weight' => $weight,
                        'shipped_date' => now(),
                    ]);
                } else {
                    $shipment->update([
                        'carrier' => 'Pathao',
                        'courier_company' => 'Pathao',
                        'courier_tracking_id' => $consignmentId ?? $trackingCode,
                        'tracking_number' => $trackingCode ?? $consignmentId,
                        'weight' => $weight,
                    ]);
                }
                $order->update(['status' => 'IN_TRANSIT']);
                if ($order->transaction) {
                    $order->transaction->update(['status' => 'IN_TRANSIT']);
                }
                return [
                    'success' => true,
                    'message' => $res['message'] ?? 'Pathao parcel created successfully.',
                    'consignment_id' => $consignmentId,
                    'tracking_code' => $trackingCode,
                    'pathao' => $res,
                ];
            }
        }

        $message = $res['message'] ?? $res['errors'] ?? 'Pathao API error';
        if (is_array($message)) {
            $message = json_encode($message);
        }
        Log::warning('Pathao create order failed', ['order_id' => $order->id, 'response' => $res]);
        return [
            'success' => false,
            'message' => $message,
            'pathao' => $res,
        ];
    }

    /**
     * Check delivery status for an order with Pathao shipment.
     */
    public function checkStatus(Order $order): array
    {
        $shipment = $order->shipment;
        if (! $shipment || $shipment->courier_company !== 'Pathao' || ! $shipment->courier_tracking_id) {
            return [
                'success' => false,
                'message' => 'No Pathao consignment or tracking ID for this order.',
            ];
        }
        $auth = $this->getAccessToken();
        if (! ($auth['success'] ?? false)) {
            return [
                'success' => false,
                'message' => $auth['message'] ?? 'Pathao authentication failed.',
            ];
        }
        $consignmentId = $shipment->courier_tracking_id;
        $res = $this->request('GET', '/aladdin/api/v1/order-details', ['consignment_id' => $consignmentId], $auth['access_token']);
        $status = $res['_http_status'] ?? 0;
        if ($status >= 200 && $status < 300) {
            return [
                'success' => true,
                'pathao' => $res,
                'delivery_status' => $res['data']['order_status'] ?? $res['order_status'] ?? null,
            ];
        }
        return [
            'success' => false,
            'message' => $res['message'] ?? 'Failed to get status',
            'pathao' => $res,
        ];
    }

    /**
     * Cancel/remove order from Pathao: clear our shipment link so Create parcel can show again.
     */
    public function cancelConsignment(Order $order): array
    {
        $shipment = $order->shipment;
        if (! $shipment || $shipment->courier_company !== 'Pathao') {
            return [
                'success' => false,
                'message' => 'No Pathao consignment for this order.',
            ];
        }

        $shipment->update([
            'carrier' => '',
            'courier_company' => null,
            'courier_tracking_id' => null,
            'tracking_number' => '',
        ]);
        $order->update(['status' => 'PROCESSING']);
        if ($order->transaction) {
            $order->transaction->update(['status' => 'PROCESSING']);
        }

        return [
            'success' => true,
            'message' => 'Pathao link removed from this order. Cancel the consignment manually on Pathao portal if needed.',
        ];
    }
}
