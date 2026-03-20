# PurchifyShop

Full-stack ecommerce platform with a React storefront/admin SPA and a Laravel REST API.

## Overview

- Customer storefront with product discovery, cart, checkout, account, order lifecycle, and support chat
- Admin panel for catalog, inventory, operations, settings, content, courier, email, and analytics
- Vendor-ready architecture with vendor applications, vendor management, and vendor-scoped order workflows
- Dynamic homepage system (sections, sliders, notices, page content blocks)
- Multi-language foundation (BN/EN), configurable from backend settings
- Courier integrations (Steadfast + Pathao), parcel creation/status/cancel, and webhook processing
- SEO-ready deployment with sitemap generation, dynamic sitemap endpoint, canonical controls, and prerender support

## Tech Stack

### Frontend (`frontend/`)
- React 19 + TypeScript
- Vite 7
- Tailwind CSS 4
- React Router
- Redux Toolkit
- i18nex

### Backend (`backend/`)
- PHP 8.2+
- Laravel 12
- Laravel Sanctum (token auth)
- Eloquent ORM + MySQL (recommended)

## Architecture

- Frontend runs as a SPA (default dev port: `5173`)
- Backend API base path: `/api/v1`
- In development, Vite proxies `/api` to Laravel (`http://localhost:8000`)
- In production, frontend build can be:
  1. served by Laravel `public/` (single domain), or
  2. deployed separately (Netlify/Vercel/Nginx/Apache)

## Functional Scope (Full Project)

### Customer-Facing (Storefront)
- Authentication: sign-up, sign-in, sign-out, token refresh, forgot/reset password, profile update, password change
- Product discovery: shop listing, search, sorting, featured/new flags, category/subcategory/brand filtering
- Product detail: variant-level pricing/stock, image gallery, related products, public reviews
- Cart: guest session cart and authenticated cart, quantity updates, item removal
- Checkout: address-based order placement, shipping option and payment method support
- Orders: order list/details, customer cancellation flow, invoice view, public tracking page
- Wishlist: add/remove/list saved products
- Coupons: customer coupon visibility and validation endpoint support
- Customer account: profile, addresses CRUD, order history, wishlist management
- Support and engagement: customer chat threads with message exchange, contact/support page, FAQ page
- CMS pages: dynamic custom page rendering by slug (terms, policy, custom content)
- Vendor onboarding: public vendor application submission

### Admin / Operations
- Dashboard and analytics overview
- Catalog management:
  - Products CRUD, bulk import endpoint, variant CRUD, stock adjustment
  - Categories/subcategories CRUD + reorder
  - Attributes and values, sizes, brands
- Order operations:
  - Order listing, detail, update, delete, notifications, notification mark-read
  - Parcel weight update, vendor WhatsApp helper, refunded-order views
  - Payment update and transaction management
- Shipping and logistics:
  - Shipping options CRUD and shipping settings
  - Steadfast parcel create/status/cancel + status checker
  - Pathao parcel create/status/cancel + cities/zones/areas lookup
  - Courier credentials/settings management in admin panel
- Marketing and retention:
  - Coupons CRUD and user assignment
  - Incomplete order tracking and targeted marketing trigger
  - Notices, sliders, home sections with reorder and product assignment
- Content management:
  - Static/dynamic pages CRUD
  - Footer management
  - Store settings, SEO/config, animation and presentation settings
- User and access control:
  - Roles CRUD
  - Users CRUD
  - Vendors CRUD, vendor approval, vendor system status controls
- Communication:
  - Admin chat inbox, per-chat messaging, chat status updates
- Email system:
  - SMTP/email settings and send-test endpoint
  - Email templates CRUD + event types + test send
  - Email logs listing/detail/delete/clear
- Asset and media:
  - Image upload API, media manager listing, image delete operations
- Auditing and observability:
  - Logs, recent activities, recent visitors, top-page analytics clearing, operational reports pages

### Integrations
- Steadfast Courier integration:
  - Credential management (admin + env fallback)
  - API connectivity/status check
  - Parcel create/status/cancel from order operations
  - Webhook endpoint with bearer-token validation
- Pathao Courier integration:
  - Credential management
  - API connectivity/status check
  - Parcel create/status/cancel from order operations
  - Location helper endpoints (cities/zones/areas)

### SEO and Indexing
- Dynamic sitemap endpoint from Laravel (`/sitemap.xml`)
- Static sitemap generation in frontend build pipeline
- Route prerendering for key pages during frontend build
- Robots and canonical-domain guidance docs included

## User Roles

- Customer: storefront purchase flow, account/order/review/wishlist/chat
- Admin: full operational and configuration access
- Super Admin: extended oversight workflows (analytics/logs/system-level controls)
- Vendor: vendor-scoped visibility in selected admin endpoints via `admin_or_vendor` middleware

## Repository Structure

```text
.
├─ backend/                # Laravel API + admin/business logic
│  ├─ app/
│  ├─ config/
│  ├─ database/
│  ├─ routes/
│  ├─ tests/
│  └─ API_DOCS.md
├─ frontend/               # React + Vite SPA (storefront + admin UI)
│  ├─ src/
│  ├─ public/
│  └─ scripts/             # sitemap + prerender scripts
├─ schema.sql
├─ DEPLOYMENT.md
├─ SEO_DEPLOYMENT_GUIDE.md
└─ GOOGLE_INDEXING_FIX.md
```

## Core Features

### Storefront
- Home, shop, category, brand, section, and CMS page routes
- Product details with related items, variant options, and customer reviews
- Guest/auth cart + checkout + shipping/payment method integration
- Order history, order details, invoice, and public track-order page
- Auth/account management and address book
- Wishlist and coupon validation
- Contact support, FAQ, and customer chat
- Vendor apply page

### Admin
- Dashboard, analytics, reports, logs, recent activities/visitors
- Products, variants, categories, subcategories, attributes, sizes, brands
- Orders, refunds, transactions, payment updates, notifications
- Shipping settings/options + courier management (Steadfast/Pathao)
- Home sections, notices, pages, footer, media manager, app settings
- Coupons, reviews, chat inbox
- Roles, users, vendors, vendor approval/system-status
- Email settings/templates/logs

### Integrations
- Steadfast courier (settings, create parcel, status, cancel, webhook)
- Pathao courier (settings, create parcel, status, cancel)

## API Reference

- Primary docs: `backend/API_DOCS.md`
- Base URL: `/api/v1`
- Health check: `GET /api/v1/health`
- Auth: sign-up/sign-in/refresh/me with Sanctum bearer token
- Public routes include products, categories, sections, pages, cart, track-order, vendor application
- User protected routes include orders, checkout, wishlist, addresses, reviews, coupons, chat
- Shared admin/vendor routes use `auth:sanctum` + `admin_or_vendor`
- Admin-only routes use `auth:sanctum` + `admin`

### Key API Groups
- Auth: `/auth/*`
- Catalog: `/products`, `/categories`, `/subcategories`, `/brands`
- Storefront config/content: `/sections`, `/home-sections`, `/sliders`, `/notices`, `/pages`, `/footer`, `/seo`, `/config`
- Commerce: `/cart`, `/checkout`, `/orders`, `/wishlist`, `/coupons`, `/payment-methods`, `/shipping-options`
- Customer engagement: `/chat`, `/reviews`, `/track-order`, `/incomplete-orders/track`
- Admin domain: `/admin/*`
- Webhook: `/webhooks/steadfast`

## Local Development Setup

## Prerequisites

- PHP `>= 8.2`
- Composer
- Node.js `>= 20` and npm
- MySQL/MariaDB

## 1) Backend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Create/update `backend/.env`, set database credentials, then run:

```bash
php artisan migrate
php artisan db:seed
php artisan storage:link
php artisan serve
```

Backend will be available at `http://localhost:8000`.

## 2) Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env   # if the file exists in your local clone
```

Create/update `frontend/.env` (example):

```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_IMAGE_BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
VITE_APP_URL=http://localhost:5173
```

Run frontend:

```bash
npm run dev
```

Frontend will be available at `http://localhost:5173`.

## Useful Commands

### Backend

```bash
cd backend
composer run dev      # runs Laravel server + queue listener + logs + Vite
composer run test     # runs test suite
php artisan test      # alternative direct test command
```

### Frontend

```bash
cd frontend
npm run dev
npm run build
npm run build:no-prerender
npm run preview
npm run lint
```

## Frontend Route Map (High Level)

- Public: `/`, `/shop`, `/categories`, `/brands`, `/section/:slug`, `/product/:slug`, `/page/:slug`, `/faq`, `/track-order`, `/apply-vendor`
- Auth and account: `/sign-in`, `/sign-up`, `/password-reset`, `/password-reset/:token`, `/profile`
- Purchase flow: `/cart`, `/checkout`, `/orders`, `/orders/:orderId`, `/orders/:orderId/invoice`, `/invoice-verify/:trackingNumber`, `/wishlist`
- Admin auth: `/purchify/login`
- Admin panel: `/dashboard/*` (products, categories, orders, transactions, shipping, courier, vendors, pages, settings, email, analytics, logs, chats, reports, roles, etc.)

## Production Notes

- Set `APP_ENV=production` and `APP_DEBUG=false` in backend env
- Set correct `APP_URL` (used by dynamic sitemap in Laravel)
- Set correct `FRONTEND_URL` for password-reset and cross-app links
- Ensure SPA fallback is enabled for direct URL refresh support

For detailed instructions, use:
- `DEPLOYMENT.md`
- `SEO_DEPLOYMENT_GUIDE.md`
- `GOOGLE_INDEXING_FIX.md`

## SEO & Sitemap

- Frontend build runs sitemap generation (`frontend/scripts/generate-sitemap.js`)
- Frontend build also prerenders key routes (`frontend/scripts/prerender.js`)
- Laravel serves dynamic sitemap on `/sitemap.xml`
- Keep canonical domain and robots/sitemap settings consistent after deploy

## Security & Auth

- API authentication uses Sanctum bearer tokens
- Admin endpoints require `auth:sanctum` + `admin` middleware
- Some admin read endpoints are accessible to vendor role via `admin_or_vendor`
- Webhooks should use bearer-token validation (`STEADFAST_WEBHOOK_BEARER_TOKEN`)
- Never expose courier API keys in client-side environment variables

## Troubleshooting

- 404 on page refresh: configure SPA fallback (`index.html`) on your web server
- Images not loading: verify `storage:link` and `APP_URL`
- CORS/auth issues: verify frontend origin and Sanctum/session settings
- Wrong sitemap domain: check `APP_URL` (Laravel) or `VITE_APP_URL`/`FRONTEND_URL` (frontend static build)

## Additional Docs

- Backend API: `backend/API_DOCS.md`
- Courier integration notes: `backend/STEADFAST_INTEGRATION.md`
- Deployment guide: `DEPLOYMENT.md`
- SEO deployment: `SEO_DEPLOYMENT_GUIDE.md`
- Search indexing notes: `GOOGLE_INDEXING_FIX.md`
- Change log summary: `CHANGES_SUMMARY.md`
- Scroll behavior fixes: `SCROLL_BEHAVIOR_FIX.md`, `SCROLL_BEHAVIOR_GUIDE.md`, `SCROLL_FIX_SUMMARY.md`
