# Fixed: Product Image & Price Loading Issues

## Problems Fixed ✅

### Issue 1: Image URL was `null/storage/...`
**Root Cause**: `window.location.origin` was null in iframe context

**Solution**:
- Added proper try-catch for iframe location access  
- Falls back to parent window location
- Falls back to apiBase from LANDING_PAGE_DATA
- Final fallback to localhost:8000

### Issue 2: Prices showing 0
**Root Cause**: Backend only checking `base_price`, but products use variants pricing

**Solution**:
- Backend now gets price from first variant if base_price is 0
- Properly calculates discounted and original prices

### Issue 3: Base URL not available in template
**Root Cause**: apiBase not passed to landing page template

**Solution**:
- Frontend now includes `apiBase: "/api/v1"` in landing page data
- Template JS can use this for fallback

## Files Updated

### Backend:
- ✅ `backend/app/Http/Controllers/Api/V1/LandingPageController.php`
  - Added variant pricing fallback
  - Better price calculation logic

### Frontend:
- ✅ `frontend/src/pages/LandingPagePublic.tsx`
  - Added `apiBase` to landing page data

- ✅ `frontend/landing-page-templates/template-01-product.js`
  - Improved baseUrl detection
  - Better error handling for iframe context
  - Multiple fallback sources for baseUrl

## How It Works Now

```javascript
// URL Building Priority (in getImageUrl):
1. Try window.location.origin
2. Try parent window.location.origin (for iframe)
3. Try LANDING_PAGE_DATA.apiBase
4. Fallback to http://localhost:8000
```

## Testing

1. Refresh your landing page
2. Check browser console (F12)
3. Look for `Image URL built:` message
4. Should see proper URL like: `http://yourdomain.com/storage/products/...jpg`
5. Product price should now display correctly

## What's Different

**Before**:
```
Failed to load image from: null/storage/products/...
Price: 0
```

**After**:
```
Image URL built: {fullUrl: "http://localhost:8000/storage/products/...jpg"}
Price: $99.99 (from variants)
```

---

**Try refreshing your landing page now!** The image should load and price should show correctly. 🎉
