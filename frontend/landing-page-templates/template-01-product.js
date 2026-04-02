/**
 * Landing Page Template JavaScript
 * Dynamically populates product information from window.LANDING_PAGE_DATA
 */

document.addEventListener("DOMContentLoaded", function () {
  const data = window.LANDING_PAGE_DATA;

  if (!data) {
    console.error("LANDING_PAGE_DATA not found");
    return;
  }

  // ============================================
  // 1. HERO SECTION
  // ============================================
  const heroHeadline = document.getElementById("heroHeadline");
  if (heroHeadline) {
    heroHeadline.textContent =
      data.heroHeadline || data.title || "Special Offer";
  }

  const heroDescription = document.getElementById("heroDescription");
  if (heroDescription) {
    heroDescription.textContent =
      data.heroText ||
      "Discover our exclusive product offer available for a limited time.";
  }

  // ============================================
  // 2. PRODUCT INFORMATION
  // ============================================
  const product = data.product;

  if (!product) {
    return;
  }

  // Product Image
  const productImage = document.getElementById("productImage");
  if (productImage) {
    if (product.images && product.images.length > 0) {
      const imagePath = product.images[0];
      const imageUrl = getImageUrl(imagePath);

      productImage.src = imageUrl;
      productImage.alt = product.name || "Product Image";

      // Simple error handler - just show placeholder
      productImage.onerror = function () {
        // Show placeholder on error
        this.src =
          'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="18"%3ENo Image Available%3C/text%3E%3C/svg%3E';
      };
    } else {
      // Show placeholder if no images
      productImage.src =
        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999" font-family="sans-serif" font-size="18"%3ENo Image Available%3C/text%3E%3C/svg%3E';
    }
  }

  // Product Title
  const productTitle = document.getElementById("productTitle");
  if (productTitle) {
    productTitle.textContent = product.name || "Product Name";
  }

  // Product Price
  const currentPrice = document.getElementById("currentPrice");
  const originalPrice = document.getElementById("originalPrice");

  const price = product.price || product.discountedPrice || 0;
  const origPrice = product.originalPrice || 0;

  if (price) {
    if (currentPrice) {
      currentPrice.textContent = formatPrice(price);
    }
  }

  // Show original price if discount exists
  if (origPrice && origPrice > price) {
    if (originalPrice) {
      originalPrice.textContent = formatPrice(origPrice);
      originalPrice.style.display = "inline";
    }

    // Show discount badge
    const discountBadge = document.getElementById("discountBadge");
    if (discountBadge) {
      if (product.discountBadge) {
        discountBadge.textContent = product.discountBadge;
      } else {
        const discountPercent = Math.round(
          ((origPrice - price) / origPrice) * 100,
        );
        discountBadge.textContent = `-${discountPercent}%`;
      }
      discountBadge.style.display = "block";
    }
  }

  // Product Description
  const productDescription = document.getElementById("productDescription");
  if (productDescription) {
    productDescription.textContent =
      product.description ||
      product.shortDescription ||
      "High-quality product with excellent features and durability.";
  }

  // Product Rating
  const rating = product.rating || 0;
  const reviewCount = product.reviewCount || 0;

  const ratingStars = document.getElementById("ratingStars");
  const ratingCount = document.getElementById("ratingCount");

  if (ratingStars) {
    ratingStars.innerHTML = generateStars(rating);
  }

  if (ratingCount && reviewCount > 0) {
    ratingCount.textContent = `(${reviewCount} reviews)`;
  }

  // ============================================
  // 3. BUTTONS
  // ============================================
  const buyNowBtn = document.getElementById("buyNowBtn");
  if (buyNowBtn) {
    buyNowBtn.addEventListener("click", function () {
      window.location.href = `/product/${product.slug}`;
    });
  }

  const addToCartBtn = document.getElementById("addToCartBtn");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", function () {
      if (product.slug) {
        window.location.href = `/product/${product.slug}?action=add-to-cart`;
      }
    });
  }

  const addToWishlistBtn = document.getElementById("addToWishlistBtn");
  if (addToWishlistBtn) {
    addToWishlistBtn.addEventListener("click", function () {
      if (product.slug) {
        window.location.href = `/product/${product.slug}?action=wishlist`;
      }
    });
  }

  // ============================================
  // 4. COUNTDOWN TIMER
  // ============================================
  if (data.countdownEnd) {
    initializeCountdownTimer(data.countdownEnd);
  }

  // ============================================
  // 5. BRAND COLOR
  // ============================================
  if (data.primaryColor) {
    applyBrandColor(data.primaryColor);
  }
});

/**
 * Helper Functions
 */

/**
 * Build image URL from storage path
 * Handles multiple path formats and storage locations
 */
function getImageUrl(imagePath) {
  if (!imagePath) {
    return "";
  }

  // If already a full URL, return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // Get base URL from different sources
  let baseUrl = null;

  // Priority 1: Try to get from API config or LANDING_PAGE_DATA first (most reliable)
  if (window.LANDING_PAGE_DATA) {
    // Check for explicit baseUrl first (best option)
    if (window.LANDING_PAGE_DATA.baseUrl) {
      baseUrl = window.LANDING_PAGE_DATA.baseUrl;
    }
    // If apiBase is a full URL, extract base from it
    else if (
      window.LANDING_PAGE_DATA.apiBase &&
      window.LANDING_PAGE_DATA.apiBase.startsWith("http")
    ) {
      const apiBase = window.LANDING_PAGE_DATA.apiBase;
      baseUrl = apiBase.replace(/\/api\/v1\/?$/, "").replace(/\/api\/?$/, "");
    }
  }

  // Priority 2: Try to get current location origin
  if (!baseUrl) {
    try {
      if (
        window.location &&
        window.location.origin &&
        window.location.origin !== "null" &&
        window.location.origin !== ""
      ) {
        baseUrl = window.location.origin;
      }
    } catch (e) {
      // Silently skip if not accessible
    }
  }

  // Priority 3: If in iframe context, try parent
  if (!baseUrl) {
    try {
      if (
        window.parent &&
        window.parent !== window &&
        window.parent.location &&
        window.parent.location.origin &&
        window.parent.location.origin !== "null" &&
        window.parent.location.origin !== ""
      ) {
        baseUrl = window.parent.location.origin;
      }
    } catch (e) {
      // Silently skip if not accessible
    }
  }

  // Priority 4: Fallback to localhost (for local development)
  if (!baseUrl || baseUrl === "null" || baseUrl === "") {
    baseUrl = "http://localhost:8000";
  }

  // Remove leading slashes from path
  let cleanPath = imagePath.replace(/^\/+/, "");

  // Handle different path formats that might come from backend
  // If path already contains 'storage/', don't add it again
  if (cleanPath.startsWith("storage/")) {
    return `${baseUrl}/${cleanPath}`;
  }

  // Otherwise prepend /storage/
  return `${baseUrl}/storage/${cleanPath}`;
}

/**
 * Format price with currency symbol
 */
function formatPrice(price) {
  const currencySymbol = "$";
  return `${currencySymbol}${parseFloat(price).toFixed(2)}`;
}

/**
 * Generate star rating HTML
 */
function generateStars(rating) {
  const maxStars = 5;
  let starsHTML = "";

  for (let i = 1; i <= maxStars; i++) {
    if (i <= Math.floor(rating)) {
      starsHTML += '<span class="star">★</span>';
    } else if (i - rating < 1 && i - rating > 0) {
      starsHTML +=
        '<span class="star" style="display: inline-block; position: relative;">★<span style="position: absolute; overflow: hidden; width: ' +
        (1 - (i - rating)) * 100 +
        '%; color: #d1d5db;">★</span></span>';
    } else {
      starsHTML += '<span class="star" style="color: #d1d5db;">★</span>';
    }
  }

  return starsHTML;
}

/**
 * Initialize countdown timer
 */
function initializeCountdownTimer(countdownEnd) {
  const timerContainer = document.getElementById("countdownTimer");
  if (!timerContainer) return;

  function updateTimer() {
    const now = Date.now();
    const endTime = new Date(countdownEnd).getTime();
    const difference = endTime - now;

    if (difference <= 0) {
      timerContainer.innerHTML =
        '<p style="color: white; font-size: 18px;">Offer Ended</p>';
      return;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    timerContainer.innerHTML = `
      <div class="countdown-item">
        <span class="countdown-value">${String(days).padStart(2, "0")}</span>
        <span class="countdown-label">Days</span>
      </div>
      <div class="countdown-item">
        <span class="countdown-value">${String(hours).padStart(2, "0")}</span>
        <span class="countdown-label">Hours</span>
      </div>
      <div class="countdown-item">
        <span class="countdown-value">${String(minutes).padStart(2, "0")}</span>
        <span class="countdown-label">Minutes</span>
      </div>
      <div class="countdown-item">
        <span class="countdown-value">${String(seconds).padStart(2, "0")}</span>
        <span class="countdown-label">Seconds</span>
      </div>
    `;
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

/**
 * Apply brand color to buttons and accents
 */
function applyBrandColor(brandColor) {
  const style = document.createElement("style");
  style.textContent = `
    .btn-primary {
      background: linear-gradient(135deg, ${brandColor}, ${lightenColor(brandColor, 20)}) !important;
      box-shadow: 0 10px 30px ${brandColor}40 !important;
    }
    
    .btn-primary:hover {
      box-shadow: 0 15px 40px ${brandColor}60 !important;
    }

    .btn-secondary {
      color: ${brandColor} !important;
      border-color: ${brandColor} !important;
    }

    .btn-outline:hover {
      border-color: ${brandColor} !important;
      color: ${brandColor} !important;
    }

    .hero-text {
      border-color: ${brandColor} !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Lighten a hex color by a percentage
 */
function lightenColor(hex, percent) {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return "#" + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * Track analytics events
 */
function trackEvent(eventName, data) {
  if (window.gtag) {
    gtag("event", eventName, data);
  }
  // Add other analytics tracking here
}

// Track page view
trackEvent("page_view", {
  page_title: document.title,
  page_location: window.location.href,
});
