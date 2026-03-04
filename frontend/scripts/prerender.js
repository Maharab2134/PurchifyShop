/**
 * Prerender script for generating static HTML files with proper SEO meta tags
 * This helps search engines index the site properly even without JavaScript
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.resolve(__dirname, "../dist");
const indexPath = path.join(distPath, "index.html");

console.log("🔍 Prerendering static pages for better SEO...");

// Routes that need prerendering with their meta information
const routes = [
  {
    path: "/",
    title:
      "PurchifyShop - Online Shopping in Bangladesh | Fast Delivery & Secure Checkout",
    description:
      "Shop electronics, fashion, and daily needs at PurchifyShop. Fast delivery across Bangladesh, secure payment, and great deals.",
  },
  {
    path: "/shop",
    title: "Shop Products - PurchifyShop",
    description:
      "Browse our wide selection of products. Find the best deals on electronics, fashion, and daily essentials at PurchifyShop.",
  },
  {
    path: "/categories",
    title: "Product Categories - PurchifyShop",
    description:
      "Explore all product categories at PurchifyShop. From electronics to fashion, find what you need quickly.",
  },
  {
    path: "/brands",
    title: "Top Brands - PurchifyShop",
    description:
      "Shop from your favorite brands at PurchifyShop. Authentic products with warranty and fast delivery.",
  },
  {
    path: "/cart",
    title: "Shopping Cart - PurchifyShop",
    description:
      "View and manage your shopping cart. Secure checkout with multiple payment options.",
  },
  {
    path: "/contact-support",
    title: "Contact Support - PurchifyShop",
    description:
      "Get in touch with our support team. We're here to help with any questions or concerns.",
  },
];

try {
  // Check if dist directory exists
  if (!fs.existsSync(distPath)) {
    console.warn("⚠️  Dist directory not found. Run build first.");
    process.exit(0);
  }

  // Read the base index.html
  if (!fs.existsSync(indexPath)) {
    console.warn("⚠️  index.html not found in dist. Run build first.");
    process.exit(0);
  }

  const baseHtml = fs.readFileSync(indexPath, "utf-8");

  // Create prerendered HTML for each route
  routes.forEach((route) => {
    let html = baseHtml;

    // Update title
    html = html.replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`);

    // Update meta title
    html = html.replace(
      /<meta name="title" content=".*?">/,
      `<meta name="title" content="${route.title}">`,
    );

    // Update description
    html = html.replace(
      /<meta name="description" content=".*?">/,
      `<meta name="description" content="${route.description}">`,
    );

    // Update OG tags
    html = html.replace(
      /<meta property="og:title" content=".*?">/,
      `<meta property="og:title" content="${route.title}">`,
    );
    html = html.replace(
      /<meta property="og:description" content=".*?">/,
      `<meta property="og:description" content="${route.description}">`,
    );
    html = html.replace(
      /<meta property="og:url" content=".*?">/,
      `<meta property="og:url" content="https://purchifyshop.com${route.path}">`,
    );

    // Update Twitter tags
    html = html.replace(
      /<meta name="twitter:title" content=".*?">/,
      `<meta name="twitter:title" content="${route.title}">`,
    );
    html = html.replace(
      /<meta name="twitter:description" content=".*?">/,
      `<meta name="twitter:description" content="${route.description}">`,
    );
    html = html.replace(
      /<meta name="twitter:url" content=".*?">/,
      `<meta name="twitter:url" content="https://purchifyshop.com${route.path}">`,
    );

    // Update canonical URL - normalize to clean URL (no trailing slash except root)
    const normalizedPath =
      route.path === "/" ? "/" : route.path.replace(/\/$/, "");
    const canonicalUrl = `https://purchifyshop.com${normalizedPath}`;

    // More specific regex to match canonical tag
    html = html.replace(
      /<link rel=[\"']canonical[\"'] href=[\"'].*?[\"']\s*\/?>/i,
      `<link rel="canonical" href="${canonicalUrl}" />`,
    );

    // Save the prerendered HTML
    if (route.path === "/") {
      // Overwrite index.html for home page
      fs.writeFileSync(indexPath, html);
      console.log(`✅ Prerendered: / (index.html)`);
    } else {
      // Create directory structure for other routes
      const routePath = path.join(distPath, route.path.slice(1));
      if (!fs.existsSync(routePath)) {
        fs.mkdirSync(routePath, { recursive: true });
      }
      fs.writeFileSync(path.join(routePath, "index.html"), html);
      console.log(`✅ Prerendered: ${route.path}`);
    }
  });

  console.log("✨ Prerendering complete!");
  console.log(`📁 Generated ${routes.length} prerendered pages`);
} catch (error) {
  console.error("❌ Prerendering failed:", error);
  process.exit(1);
}
