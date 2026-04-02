# Landing Page Template Setup Guide

## Overview
This template creates a professional, responsive landing page that automatically displays product information (image, title, price, description, rating, etc.) from your admin panel.

## Files Created
1. **template-01-product.html** - The main HTML structure
2. **template-01-product.css** - All styling and responsive design
3. **template-01-product.js** - Dynamic product data population and interactions

## Features Included
✅ Product Image Display  
✅ Product Title  
✅ Pricing (with discount badge)  
✅ 5-Star Rating System  
✅ Product Description  
✅ Call-to-Action Buttons (Buy Now, Add to Cart, Wishlist)  
✅ Trust Badges  
✅ Countdown Timer  
✅ FAQ Section  
✅ Responsive Design (Mobile, Tablet, Desktop)  
✅ Dark Mode Support  
✅ Smooth Animations  

## How to Use in Admin Panel

### Step 1: Copy Template HTML
- Open `template-01-product.html`
- Copy **ALL** the content
- Go to **Admin Panel → Landing Pages**
- Create or Edit a Landing Page
- Paste the code into **Template HTML** field

### Step 2: Copy Template CSS
- Open `template-01-product.css`
- Copy **ALL** the content
- In the same Landing Page form
- Paste the code into **Template CSS** field

### Step 3: Copy Template JavaScript
- Open `template-01-product.js`
- Copy **ALL** the content
- In the same Landing Page form
- Paste the code into **Template JavaScript** field

### Step 4: Select Product & Save
- Select a **Product** for this landing page
- Enter **Hero Headline** (optional)
- Enter **Hero Description** (optional)
- Set **Primary Color** (optional - applies to buttons)
- Click **Save**

### Step 5: View Live Page
- Click **View** or share the landing page link
- The template will automatically display:
  - Product image from your selected product
  - Product name as title
  - Product price
  - Product description
  - All product details

## Available Data Fields

The template automatically pulls from these sources:

```javascript
{
  id: "landing-page-id",
  title: "Page Title",
  slug: "page-slug",
  heroHeadline: "Your custom headline",      // ← You enter this
  heroText: "Your custom description",       // ← You enter this
  primaryColor: "#color-code",               // ← You can customize
  product: {
    id: "prod-id",
    name: "Product Name",                    // ← Displayed as title
    slug: "product-slug",
    images: ["path/to/image.jpg"],           // ← Displayed as hero image
    price: 99.99,                            // ← Displayed as current price
    originalPrice: 149.99,                   // ← Shows discount % if different
    description: "Product description",      // ← Displayed below title
    rating: 4.5,                             // ← Shows as 5-star rating
    reviewCount: 125                         // ← Shows review count
  }
}
```

## Customization Options

### Change Button Colors
Edit the CSS `--primary-color` or `primaryColor` in HTML to match your brand.

### Modify FAQ Section
Edit the `<details>` sections in the HTML to add your own FAQ items.

### Add More Sections
The template includes:
- Hero headline section
- Product showcase (image + details)
- CTA section with countdown
- FAQ section

You can duplicate any section and edit as needed.

### Remove Sections
If you don't need the FAQ or countdown, simply remove those HTML sections:
```html
<!-- Remove this entire div if not needed -->
<div class="faq-section">...</div>
```

## Tips & Best Practices

1. **Product Image**: Ensure your product has a high-quality featured image
2. **Product Price**: Make sure pricing is set correctly in your product
3. **Headline**: Keep it short and compelling (under 60 characters)
4. **Description**: Use clear, benefit-focused language
5. **Mobile Testing**: Test on mobile, tablet, and desktop
6. **Loading**: The page shows "Loading..." while fetching data

## Troubleshooting

### Product image not showing?
- Check: Is the product image uploaded?
- Check: Is the image path correct in the backend?
- The template has fallback behavior - it will show a placeholder

### Price not showing?
- Check: Is the product price set in admin?
### Buttons not working?
- Check: Is the product slug correct?
- Check: Are your routes configured correctly?

### Styling looks broken?
- Try: Clear browser cache (Ctrl+Shift+Delete)
- Try: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## Mobile Responsive Breakpoints
- **Large Desktop**: 1200px+
- **Tablet**: 768px - 1200px  
- **Mobile**: Below 768px
- **Very Small Mobile**: Below 480px

## Browser Support
✅ Chrome & Edge (Latest)  
✅ Firefox (Latest)  
✅ Safari (Latest)  
✅ Mobile Browsers  

## Need Help?
If the template isn't displaying correctly:
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Verify `window.LANDING_PAGE_DATA` has product object
4. Verify product images exist and are accessible

## File Locations
- HTML Template: `/frontend/landing-page-templates/template-01-product.html`
- CSS Styles: `/frontend/landing-page-templates/template-01-product.css`
- JavaScript: `/frontend/landing-page-templates/template-01-product.js`

---

**Ready to use! Copy each file's content into your Admin Panel Landing Page and watch it populate your product data automatically.** 🚀
