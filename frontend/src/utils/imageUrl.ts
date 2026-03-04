import { API_BASE_URL } from "@/lib/config";
import { generateProductPlaceholder } from "./placeholderImage";

// Cache the base URL to avoid recalculating
let cachedBaseUrl: string | null = null;

function getBaseUrl(): string {
  if (cachedBaseUrl) return cachedBaseUrl;

  // First priority: Use VITE_IMAGE_BASE_URL if explicitly set
  let base = import.meta.env.VITE_IMAGE_BASE_URL || "";

  // Second priority: Derive from API_BASE_URL (remove /api/v1)
  if (!base) {
    base = API_BASE_URL || "";
    // Remove /api/v1 suffix if present
    base = base.replace(/\/api\/v1\/?$/, "");
  }

  // Remove trailing slash
  base = base.replace(/\/$/, "");

  // Fallback to default if base is empty or doesn't start with http
  if (!base || !base.match(/^https?:\/\//)) {
    base = "http://localhost:8000";
  }

  // Debug in development - log once
  if (import.meta.env.DEV && !cachedBaseUrl) {
    console.log(
      `[imageUrl] VITE_IMAGE_BASE_URL:`,
      import.meta.env.VITE_IMAGE_BASE_URL,
    );
    console.log(`[imageUrl] API_BASE_URL:`, API_BASE_URL);
    console.log(`[imageUrl] Calculated base URL:`, base);
  }

  cachedBaseUrl = base;
  return base;
}

export function toImageUrl(path?: string | null): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;

  const base = getBaseUrl();
  const cleanPath = path.replace(/^\//, "");
  return `${base}/storage/${cleanPath}`;
}

export function mapImageUrls(
  paths?: Array<string | null | undefined>,
): string[] {
  return (paths ?? []).map((p) => toImageUrl(p)).filter(Boolean) as string[];
}

/**
 * Get product image - prioritizes variant images over product images
 * @param variantImages - Array of variant image paths/URLs (highest priority)
 * @param productImages - Array of product image paths/URLs (fallback)
 * @param productName - Product name for placeholder fallback
 * @param placeholderSize - Size for placeholder image (default: 120)
 * @returns First available image URL or placeholder
 */
export function getProductImage(
  variantImages: string[] = [],
  productImages: string[] = [],
  productName: string = "Product",
  placeholderSize: number = 120,
): string {
  // Priority 1: Use variant images first (most specific to selected variant)
  if (variantImages && variantImages.length > 0) {
    const variantImgUrls = mapImageUrls(variantImages);
    if (variantImgUrls.length > 0) {
      return variantImgUrls[0];
    }
  }

  // Priority 2: Fall back to product images
  if (productImages && productImages.length > 0) {
    const productImgUrls = mapImageUrls(productImages);
    if (productImgUrls.length > 0) {
      return productImgUrls[0];
    }
  }

  // Priority 3: Placeholder as last resort
  return generateProductPlaceholder(productName, placeholderSize);
}
