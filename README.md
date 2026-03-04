# PurchifyShop

Full-stack ecommerce platform with a React storefront/admin SPA and a Laravel REST API.

## Overview

- Customer storefront: products, categories, filters, cart, checkout, order tracking, wishlist, reviews
- Admin dashboard: catalog/inventory, orders, users/roles, coupons, sliders/sections, pages, SEO, analytics, logs, chat
- Dynamic content blocks on home page (multiple section themes)
- Multi-language foundation (BN/EN)
- Courier integrations (Steadfast, Pathao) + webhook support
- SEO support: sitemap generation, canonical routing, prerendered static routes (frontend build)

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
- Product listing/details with variants, pricing, stock
- Category/subcategory/brand browsing
- Cart and checkout flow
- User auth, profile, addresses, wishlist
- Coupon validation, order history and tracking

### Admin
- Product, variant, category, subcategory, attribute, size, brand management
- Home sections, sliders, notices, pages, footer, SEO/settings
- Order lifecycle, payment updates, transactions, shipping/courier actions
- User, role, vendor management
- Chat support, logs, analytics, recent activities/visitors

### Integrations
- Steadfast courier (settings, create parcel, status, cancel, webhook)
- Pathao courier (settings, create parcel, status, cancel)

## API Reference

- Primary docs: `backend/API_DOCS.md`
- Base URL: `/api/v1`
- Health check: `GET /api/v1/health`
- Auth: sign-up/sign-in/refresh/me with Sanctum bearer token
- Admin routes: `/api/v1/admin/*` protected by auth + admin middleware

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
- Webhooks should use bearer-token validation (`STEADFAST_WEBHOOK_BEARER_TOKEN`)

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
