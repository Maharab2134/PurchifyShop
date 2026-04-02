# Product Image Not Loading - Troubleshooting Guide

## Solution Applied ✅
I've updated the template JavaScript with better image URL handling and detailed logging to help debug the issue.

## How to Debug

### Step 1: Open Browser Console
1. Open the landing page in your browser
2. Press **F12** to open Developer Tools
3. Go to the **Console** tab

### Step 2: Look for Debug Information
You should see messages like:
```
Landing Page Data: {id: "...", title: "...", product: {...}}
Product Data: {id: "...", name: "Product Name", images: [...]}
Loading product image: {imagePath: "products/123.jpg", imageUrl: "http://localhost:8000/storage/products/123.jpg"}
```

### Step 3: Check Common Issues

#### ❌ Issue: "Product images not found"
**Fix**: 
- Go to Admin Panel → Products
- Edit the product
- Make sure you've uploaded an image
- Save the product

#### ❌ Issue: "Failed to load image from: ..."
Check if the URL shown is correct. Examples:
- ✅ Good: `http://localhost:8000/storage/products/image.jpg`
- ❌ Bad: `http://localhost:8000/storage//products/image.jpg` (double slash)
- ❌ Bad: `http://localhost:8000/storage/null` (no image path)

#### ❌ Issue: Images array is empty
**Fix**:
- Backend needs to send product images in this format:
```javascript
product: {
  id: "123",
  name: "Product Name",
  images: [
    "products/123/image1.jpg",
    "products/123/image2.jpg"
  ]
}
```

### Step 4: Verify Backend Response

Check that the landing page API is returning product data correctly:

1. Open DevTools Network tab (F12 → Network)
2. Refresh the landing page
3. Look for request: `GET /api/v1/landing-pages/slug/YOUR-SLUG`
4. Click on it and check the Response
5. The response should include:
```json
{
  "data": {
    "landingPage": {
      "product": {
        "id": "...",
        "name": "...",
        "images": ["path/to/image.jpg"]
      }
    }
  }
}
```

If `images` is missing or empty, the backend needs to be updated.

## Backend Fix (if needed)

If the backend isn't sending image data, check your API response in:
`backend/app/Http/Controllers/LandingPageController.php`

The response should include:
```php
'product' => [
    'id' => $product->id,
    'name' => $product->name,
    'slug' => $product->slug,
    'images' => $product->images ?? [],  // ← Must include images
    'price' => $product->price,
    'originalPrice' => $product->original_price,
]
```

## Quick Checklist

- [ ] Product has an uploaded image in Admin Panel
- [ ] Landing page is linked to a product
- [ ] Browser console shows product data with images array
- [ ] Image URL in console looks correct
- [ ] API response includes product images

## Still Not Working?

1. Share the **console output** from browser DevTools
2. Share the **API response** from Network tab
3. Check if the image file exists at: `backend/storage/products/YOUR_IMAGE.jpg`

---

The updated JavaScript now includes:
- ✅ Better URL building for different base paths
- ✅ Fallback image URL attempts
- ✅ Detailed console logging for debugging
- ✅ Better error messages
