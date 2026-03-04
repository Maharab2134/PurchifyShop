# Steadfast Courier (Bangladesh) Integration

This project integrates [Steadfast Courier](https://www.steadfast.com.bd/) via the official Laravel package for creating parcels and checking delivery status.

## Backend setup

### 1. Environment variables

Add to your `.env`:

```env
# Steadfast API (official doc: Base Url https://portal.packzy.com/api/v1)
STEADFAST_BASE_URL=https://portal.packzy.com/api/v1
STEADFAST_API_KEY=your-api-key
STEADFAST_SECRET_KEY=your-secret-key

# Optional: for webhook (status updates from Steadfast)
STEADFAST_WEBHOOK_BEARER_TOKEN=your-secure-token
```

### 2. Webhook (optional)

To receive delivery status updates from Steadfast:

1. In Steadfast merchant portal, set the callback URL to:  
   `https://your-domain.com/api/v1/webhooks/steadfast`
2. Set the Auth Token (Bearer) to the same value as `STEADFAST_WEBHOOK_BEARER_TOKEN`.

The webhook updates order status (e.g. to DELIVERED or CANCELED) and shipment delivery date when Steadfast notifies your app.

### 3. Admin usage

- **Create parcel**: In Admin → Orders → Order detail, use **Create Steadfast Parcel**. This sends the order’s recipient name, phone, address, and COD amount to Steadfast and saves the returned tracking code and consignment ID to the order’s shipment. Order status is set to IN_TRANSIT.
- **Check status**: When the order already has a Steadfast shipment, use **Check Steadfast Status** to fetch the current delivery status from the API.

## API summary

| Action              | Method | Endpoint                                   | Auth   |
|---------------------|--------|--------------------------------------------|--------|
| Create parcel       | POST   | `/api/v1/admin/orders/{id}/steadfast-create` | Admin  |
| Check status        | GET    | `/api/v1/admin/orders/{id}/steadfast-status` | Admin  |
| Webhook (callback)   | POST   | `/api/v1/webhooks/steadfast`               | Bearer |

## Package

- [steadfast-courier/steadfast-courier-laravel-package](https://github.com/steadfast-it/SteadFast-Courier-Laravel-Package)  
- Config: `config/steadfast-courier.php` (published from the package).
