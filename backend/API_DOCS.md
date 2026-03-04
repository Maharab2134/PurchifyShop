# Ecommerce REST API (v1)

Base URL: `/api/v1`

All responses are JSON. Protected routes require `Authorization: Bearer <token>`.

---

## Health

- **GET** `/health` — Returns `{ status, timestamp }`.

---

## Auth (public)

- **POST** `/auth/sign-up`  
  Body: `{ name, email, password }`  
  Returns: `{ message, data: { user, accessToken } }`.

- **POST** `/auth/sign-in`  
  Body: `{ email, password }`  
  Returns: `{ message, data: { user, accessToken } }`.

- **POST** `/auth/forgot-password`  
  Body: `{ email }`  
  Returns: `{ message }`.

- **POST** `/auth/reset-password`  
  Body: `{ token, newPassword }`  
  Returns: `{ message }`.

---

## Auth (protected)

- **POST** `/auth/sign-out` — Revoke current token. Returns `{ message }`.
- **POST** `/auth/refresh-token` — New token; revokes current. Returns `{ message, data: { user, accessToken } }`.
- **GET** `/auth/me` — Current user. Returns `{ data: { user } }`.

---

## Products (public)

- **GET** `/products` — List. Query: `page`, `limit`, `category`, `search`, `sort`, `dir`, `is_featured`, `is_new`.  
  Returns: `{ data: { products, totalResults, totalPages, currentPage, resultsPerPage } }`.

- **GET** `/products/slug/{slug}` — By slug. Returns `{ data: product }` (includes variants).
- **GET** `/products/{id}` — By ID. Returns `{ data: product }` (includes variants).

---

## Categories (public)

- **GET** `/categories` — List. Returns `{ data: [...] }`.
- **GET** `/categories/{id}` — By ID. Returns `{ data: category }`.

---

## Sections (public)

- **GET** `/sections` — Visible sections. Returns `{ data: [...] }`.

---

## Cart (public; session or `X-Cart-Session-ID` for guests)

- **GET** `/cart` — Current cart. Returns `{ data: { id, items, total, itemCount } }`.
- **POST** `/cart/items` — Add. Body: `{ variantId, quantity }`.
- **PATCH** `/cart/items/{id}` — Update. Body: `{ quantity }`.
- **DELETE** `/cart/items/{id}` — Remove.

---

## Orders, Checkout, Addresses, Reviews, Chat (protected)

- **GET** `/orders` — User orders. Query: `limit`. Returns `{ data: { orders, totalResults, ... } }`.
- **GET** `/orders/{id}` — Order detail. Returns `{ data: order }`.
- **POST** `/checkout` — Create order from cart. Body: `{ addressId }` or full address fields.
- **GET** `/addresses` — User saved addresses. Returns `{ data: [...] }`.
- **POST** `/addresses` — Create. Body: `{ street, city, state, country, zip }`.
- **POST** `/reviews` — Create. Body: `{ productId, rating, comment? }`.
- **GET** `/chat` — User chats. Returns `{ data: [...] }`.
- **POST** `/chat` — Create chat. Returns `{ data: { id, ... } }`.
- **GET** `/chat/{id}/messages` — Messages. Returns `{ data: [...] }`.
- **POST** `/chat/{id}/messages` — Send. Body: `{ content?, type?, url? }`.

---

## Admin (protected; `admin` middleware — ADMIN or SUPERADMIN)

- **POST** `/admin/products` — Create product (with variants). Body: `{ name, description?, categoryId?, isNew?, isFeatured?, variants: [{ sku, price, stock, images? }] }`.
- **PUT** `/admin/products/{id}` — Update product.
- **DELETE** `/admin/products/{id}` — Delete product.
- **POST** `/admin/products/bulk` — Bulk upload (stub).
- **POST** `/admin/categories` — Create. Body: `{ name, description?, images? }`.
- **PUT** `/admin/categories/{id}` — Update.
- **DELETE** `/admin/categories/{id}` — Delete.
- **GET** `/admin/users` — List users.
- **POST** `/admin/users` — Create. Body: `{ name, email, password, role }`.
- **GET** `/admin/users/{id}` — User detail.
- **PUT** `/admin/users/{id}` — Update.
- **DELETE** `/admin/users/{id}` — Delete.
- **GET** `/admin/attributes` — List attributes.
- **POST** `/admin/attributes` — Create. Body: `{ name, values? }`.
- **GET** `/admin/variants` — List variants. Query: `productId`, `limit`.
- **POST** `/admin/variants` — Create. Body: `{ productId, sku, price, stock, images? }`.
- **GET** `/admin/sections` — List sections.
- **PUT** `/admin/sections/{id}` — Update section.
- **GET** `/admin/logs` — List logs. Query: `limit`, `offset`.
- **GET** `/admin/analytics` — Analytics summary.
- **GET** `/admin/transactions` — List transactions. Query: `status`, `limit`.
- **GET** `/admin/steadfast/status` — Check if Steadfast API is configured (admin panel or .env) and connection (e.g. balance). Returns `{ data: { configured, balance?, message? } }`.
- **GET** `/admin/courier/steadfast/settings` — Get Steadfast API credentials (admin panel). Returns `{ data: { apiKey, secretKey, baseUrl, webhookBearerToken } }`.
- **PUT** `/admin/courier/steadfast/settings` — Save Steadfast API credentials from admin panel. Body: `{ apiKey?, secretKey?, baseUrl?, webhookBearerToken? }`. Returns `{ message, data }`.
- **GET** `/admin/courier/pathao/settings` — Get Pathao API credentials. Returns `{ data: { apiKey, secretKey, baseUrl, storeId } }`.
- **PUT** `/admin/courier/pathao/settings` — Save Pathao API credentials. Body: `{ apiKey?, secretKey?, baseUrl?, storeId? }`. Returns `{ message, data }`.
- **POST** `/admin/orders/{id}/steadfast-create` — Create a Steadfast parcel for the order (Bangladesh courier). Manual only. Sends order address/phone/COD to Steadfast API and saves tracking to shipment. Returns `{ message, data: { order, steadfast: { consignment_id, tracking_code } } }`.
- **GET** `/admin/orders/{id}/steadfast-status` — Check Steadfast delivery status. Returns `{ data: { delivery_status, response? } }`.

---

## Steadfast webhook (public, Bearer token)

- **POST** `/api/v1/webhooks/steadfast` — Steadfast Courier delivery status callbacks. Set `Authorization: Bearer <STEADFAST_WEBHOOK_BEARER_TOKEN>`. Configure this URL and token in Steadfast merchant portal.

---

## Images

Product/variant images are stored under `storage/app/public` and served at `/storage/...`.

- **POST** `/admin/uploads` (admin, multipart) — Body: `images[]` (files). Saves to `storage/app/public/products/YYYY/MM/DD`, returns `{ data: [{ path, url }] }`. Use `path` or `url` in product/variant `images` when creating/updating.

---

## cPanel deployment

1. Set `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` and `FRONTEND_URL`.
2. Configure MySQL: `DB_*` from cPanel MySQL Databases.
3. Use `SESSION_DRIVER=file`, `CACHE_STORE=file`, `QUEUE_CONNECTION=sync` (no Redis).
4. Run `php artisan migrate --force`, `php artisan db:seed --force`, `php artisan storage:link`.
5. Point document root to `public/` or configure subdomain to `public/`.
