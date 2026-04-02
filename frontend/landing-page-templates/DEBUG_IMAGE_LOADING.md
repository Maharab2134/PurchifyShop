# Image Not Loading - Debug Guide

## Current Issue
- ✅ Admin Panel sees product image
- ❌ Landing Page shows "No Image Available"

This means the product data is loaded correctly, but **image URL is wrong**.

## How to Debug

### Step 1: Open Browser Console
1. Go to your landing page
2. Press **F12** (Open Developer Tools)
3. Go to **Console** tab
4. Refresh the page

### Step 2: Look for Console Messages
You should see messages like:

```
getImageUrl input: "products/uuid/image.jpg"
getImageUrl: Using apiBase: {apiBase: "http://localhost:8000/api/v1", baseUrl: "http://localhost:8000"}
Image URL built: {imagePath: "products/uuid/image.jpg", cleanPath: "products/uuid/image.jpg", baseUrl: "http://localhost:8000", fullUrl: "http://localhost:8000/storage/products/uuid/image.jpg"}
Loading product image: {imagePath: "products/uuid/image.jpg", imageUrl: "http://localhost:8000/storage/products/uuid/image.jpg", product: {...}}
```

### Step 3: Check the Full Image URL
**IMPORTANT**: Share the `fullUrl` or `imageUrl` that appears in the console.

It should look something like:
- ✅ Good: `http://localhost:8000/storage/products/abc123/image.jpg`
- ✅ Good: `http://localhost:8000/storage/product_images/xyz789/photo.jpg`

### Step 4: Test the URL
**Copy the image URL** from console and:
1. Paste it in a new browser tab
2. If it works → Image loads ✅
3. If it fails → URL is wrong ❌

### Step 5: Check Network Tab
1. Go to **Network** tab in DevTools
2. Look for the image request
3. Check the **Status Code**:
   - ✅ **200** = Image loaded successfully
   - ❌ **404** = File not found (image doesn't exist)
   - ❌ **403** = Permission denied
   - ❌ Other errors = Server issue

## Common Issues & Solutions

### Issue 1: 404 Not Found
**Problem**: File doesn't exist at that location

**Solution**:
- Check if image exists: `backend/storage/products/uuid/image.jpg`
- Check storage symlink: Run `php artisan storage:link`

### Issue 2: Wrong Image Path Format
**Problem**: Backend sending wrong path format

**Solution**: Check what format the image path is in. The code now tries:
1. `{baseUrl}/storage/{path}` (primary method)
2. `{baseUrl}/{path}` (fallback)
3. `{baseUrl}/app/public/storage/{path}` (fallback)

### Issue 3: Wrong Base URL
**Problem**: Base URL is incorrect

**Solution**: Check console - what does it say for `baseUrl`?
- Should be: `http://localhost:8000` or your actual domain

## What to Share
Please share these console messages so I can help:

```
1. Full URL being attempted (from console):
   [paste here]

2. Network tab status for image request:
   [screenshot or status code]

3. Does the URL work when you paste it in a browser tab?
   [yes/no]

4. Image path format from console (getImageUrl input):
   [paste here]
```

## Quick Test
Run this in browser console to test the functions:

```javascript
// Test the image path
const testPath = window.LANDING_PAGE_DATA?.product?.images?.[0];
console.log("Image path:", testPath);
console.log("Full URL:", getImageUrl(testPath));

// Test if URL is accessible
fetch(getImageUrl(testPath))
  .then(r => console.log("Fetch status:", r.status))
  .catch(e => console.error("Fetch error:", e));
```

---

Share the console output and we'll fix this! 🔍
