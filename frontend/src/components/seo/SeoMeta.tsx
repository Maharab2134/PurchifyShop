import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { seoApi } from "@/api/seo";
import { toImageUrl } from "@/utils/imageUrl";
import { storeInfoApi } from "@/api/storeInfo";
import { sanitizePlainText } from "@/utils/sanitizeText";

// Route to page name mapping for fallback titles
const routeToPageName: Record<string, string> = {
  "/": "Home",
  "/shop": "Shop",
  "/categories": "Categories",
  "/cart": "Shopping Cart",
  "/checkout": "Checkout",
  "/wishlist": "Wishlist",
  "/orders": "My Orders",
  "/profile": "Profile",
  "/contact-support": "Contact Support",
  "/coupons": "Coupons",
  "/track-order": "Track Order",
  "/sign-in": "Sign In",
  "/sign-up": "Sign Up",
  "/password-reset": "Password Reset",
  "/dashboard": "Dashboard",
  "/dashboard/products": "Products",
  "/dashboard/categories": "Categories",
  "/dashboard/users": "Users",
  "/dashboard/orders": "Orders",
  "/dashboard/settings": "Settings",
  "/dashboard/analytics": "Analytics",
  "/dashboard/reports": "Reports",
  "/dashboard/reviews": "Reviews",
  "/dashboard/coupons": "Coupons",
  "/dashboard/shipping": "Shipping",
  "/dashboard/payment-methods": "Payment Methods",
  "/dashboard/vendors": "Vendors",
  "/dashboard/roles": "Roles",
  "/dashboard/pages": "Pages",
  "/dashboard/home-sections": "Home Sections",
  "/dashboard/footer": "Footer",
  "/dashboard/email-settings": "Email Settings",
  "/dashboard/email-templates": "Email Templates",
  "/dashboard/email-logs": "Email Logs",
  "/dashboard/chats": "Chats",
  "/dashboard/logs": "Logs",
  "/dashboard/transactions": "Transactions",
  "/dashboard/refunded-orders": "Refunded Orders",
  "/dashboard/incomplete-orders": "Incomplete Orders",
  "/dashboard/attributes": "Attributes",
};

// Helper to get page name from route
function getPageNameFromRoute(pathname: string): string {
  const formatSlugTitle = (slug: string) =>
    slug
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());

  // Check exact match first
  if (routeToPageName[pathname]) {
    return routeToPageName[pathname];
  }

  // Check for dynamic routes
  if (pathname.startsWith("/product/")) {
    return "Product Details";
  }
  if (pathname.startsWith("/section/")) {
    return "Section";
  }
  if (pathname.startsWith("/orders/") && pathname.includes("/invoice")) {
    return "Invoice";
  }
  if (pathname.startsWith("/invoice-verify/")) {
    return "Invoice Verification";
  }
  if (pathname.startsWith("/orders/")) {
    return "Order Details";
  }
  if (pathname.startsWith("/dashboard/products/add")) {
    return "Add Product";
  }
  if (
    pathname.startsWith("/dashboard/products/") &&
    pathname.includes("/edit")
  ) {
    return "Edit Product";
  }
  if (pathname.startsWith("/dashboard/home-sections/add")) {
    return "Add Home Section";
  }
  if (
    pathname.startsWith("/dashboard/home-sections/") &&
    pathname.includes("/edit")
  ) {
    return "Edit Home Section";
  }
  if (pathname.startsWith("/password-reset/")) {
    return "Reset Password";
  }
  if (pathname.startsWith("/page/")) {
    const slug = pathname.replace("/page/", "").split("/")[0];
    return formatSlugTitle(slug || "Page");
  }

  return "Page";
}

export default function SeoMeta() {
  const location = useLocation();
  const [storeInfo, setStoreInfo] = useState<{
    storeName: string;
    logo: string;
  } | null>(null);

  // Load store info once
  useEffect(() => {
    storeInfoApi
      .get()
      .then((info) => {
        setStoreInfo({ storeName: info.storeName, logo: info.logo });
      })
      .catch(() => {
        setStoreInfo(null);
      });
  }, []);

  // Update favicon from store logo
  useEffect(() => {
    if (storeInfo?.logo) {
      const faviconUrl = toImageUrl(storeInfo.logo);
      let favicon = document.querySelector(
        "link[rel='icon']",
      ) as HTMLLinkElement;

      if (!favicon) {
        favicon = document.createElement("link");
        favicon.rel = "icon";
        document.head.appendChild(favicon);
      }

      favicon.href = faviconUrl;
      favicon.type = "image/png";
    }
  }, [storeInfo?.logo]);

  useEffect(() => {
    const updateMetaTags = async () => {
      try {
        const path = `${location.pathname}${location.search || ""}`;
        const res = await seoApi.get(path);
        const seo = res.data.data;

        // Get page name for fallback
        const pageName = getPageNameFromRoute(path);
        const storeName = storeInfo?.storeName || "Store";

        // Update title with fallback
        let title = sanitizePlainText(seo.title);
        if (!title) {
          // Use page name with store name as fallback
          title = `${pageName} - ${storeName}`;
        } else if (!title.includes(storeName)) {
          // If SEO title exists but doesn't include store name, append it
          const withStore = `${title} - ${storeName}`;
          title = withStore.length <= 60 ? withStore : title;
        }

        if (title.length > 60) {
          const trimmed = title.slice(0, 60);
          title = trimmed.includes(" ")
            ? trimmed.slice(0, trimmed.lastIndexOf(" "))
            : trimmed;
        }

        document.title = title;

        // Update or create meta tags
        const updateMetaTag = (
          name: string,
          content: string,
          attribute: string = "name",
        ) => {
          if (!content) return;
          let meta = document.querySelector(`meta[${attribute}="${name}"]`);
          if (!meta) {
            meta = document.createElement("meta");
            meta.setAttribute(attribute, name);
            document.head.appendChild(meta);
          }
          meta.setAttribute("content", content);
        };

        const description = sanitizePlainText(seo.description);
        const safeDescription =
          description.length > 160
            ? description
                .slice(0, 160)
                .trim()
                .replace(/\s+\S*$/, "")
            : description;

        // Description
        updateMetaTag("description", safeDescription);

        // Keywords
        updateMetaTag("keywords", sanitizePlainText(seo.keywords));

        // Canonical URL - always use clean URL without query params for main content
        const canonicalUrl = `https://purchifyshop.com${location.pathname.replace(/\/$/, "") || "/"}`;
        let canonical = document.querySelector(
          'link[rel="canonical"]',
        ) as HTMLLinkElement;
        if (!canonical) {
          canonical = document.createElement("link");
          canonical.rel = "canonical";
          document.head.appendChild(canonical);
        }
        canonical.href = canonicalUrl;

        // Open Graph tags
        updateMetaTag("og:title", title, "property");
        updateMetaTag("og:description", safeDescription, "property");
        if (seo.ogImage) {
          const ogImageUrl =
            seo.ogImage.startsWith("http") || seo.ogImage.startsWith("//")
              ? seo.ogImage
              : toImageUrl(seo.ogImage);
          updateMetaTag("og:image", ogImageUrl, "property");
        }
        updateMetaTag("og:url", canonicalUrl, "property");
        updateMetaTag("og:type", seo.ogType || "website", "property");

        // Twitter Card tags
        updateMetaTag("twitter:card", "summary_large_image");
        updateMetaTag("twitter:title", title);
        updateMetaTag("twitter:description", safeDescription);
        if (seo.ogImage) {
          const ogImageUrl =
            seo.ogImage.startsWith("http") || seo.ogImage.startsWith("//")
              ? seo.ogImage
              : toImageUrl(seo.ogImage);
          updateMetaTag("twitter:image", ogImageUrl);
        }

        const updateStructuredData = (schema: unknown) => {
          const existing = document.getElementById("seo-structured-data");
          if (!schema) {
            if (existing) existing.remove();
            return;
          }
          let payload: unknown = schema;
          if (Array.isArray(schema)) {
            payload = { "@context": "https://schema.org", "@graph": schema };
          }
          if (!existing) {
            const script = document.createElement("script");
            script.type = "application/ld+json";
            script.id = "seo-structured-data";
            script.text = JSON.stringify(payload);
            document.head.appendChild(script);
          } else {
            existing.textContent = JSON.stringify(payload);
          }
        };

        updateStructuredData(seo.schema);
      } catch (error) {
        // Fallback title if API fails
        const pageName = getPageNameFromRoute(location.pathname);
        const storeName = storeInfo?.storeName || "Store";
        document.title = `${pageName} - ${storeName}`;
        console.error("Failed to load SEO settings:", error);
      }
    };

    updateMetaTags();
  }, [location.pathname, location.search, storeInfo]);

  return null;
}
