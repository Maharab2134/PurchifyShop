<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use App\Models\Subcategory;

class SeoGenerator
{
    public static function buildHomeSeo(?string $storeName = null): array
    {
        $store = $storeName ? trim($storeName) : '';
        $baseTitle = 'Online Shopping in Bangladesh';
        $title = self::appendStoreName($baseTitle, $store, 60);
        $description = self::limitText(
            self::composeDescription([
                'Shop electronics, fashion, and daily needs',
                $store ? "at {$store}" : null,
                'Fast delivery and secure checkout across Bangladesh.',
            ]),
            160
        );
        $keywords = self::keywords([
            'online shopping Bangladesh',
            'buy products online BD',
            'best price Bangladesh',
            'ecommerce Bangladesh',
            $store ? "{$store} online store" : null,
        ]);

        return [
            'title' => $title,
            'description' => $description,
            'keywords' => $keywords,
            'ogType' => 'website',
            'headings' => [
                'h1' => $baseTitle,
                'h2' => $store ? "Top categories at {$store}" : 'Top categories to explore',
                'h3' => 'Trusted delivery across Bangladesh',
            ],
        ];
    }

    public static function buildCategorySeo(Category $category, ?string $storeName = null): array
    {
        $categoryName = trim($category->name);
        $store = $storeName ? trim($storeName) : '';
        $baseTitle = "Buy {$categoryName} in Bangladesh";
        $title = self::appendStoreName($baseTitle, $store, 60);
        $description = self::limitText(
            self::composeDescription([
                "Explore {$categoryName} with the best prices in Bangladesh.",
                "Browse latest {$categoryName} products, reviews, and fast delivery.",
            ]),
            160
        );
        $keywords = self::keywords(self::bangladeshCategoryKeywords($categoryName));

        return [
            'title' => $title,
            'description' => $description,
            'keywords' => $keywords,
            'ogType' => 'website',
            'headings' => [
                'h1' => "Shop {$categoryName} in Bangladesh",
                'h2' => "Popular {$categoryName} products",
                'h3' => $store
                    ? "Why buy {$categoryName} from {$store}"
                    : "Why buy {$categoryName} online in Bangladesh",
            ],
        ];
    }

    public static function buildCategoryListingSeo(?string $storeName = null): array
    {
        $store = $storeName ? trim($storeName) : '';
        $baseTitle = 'All Categories in Bangladesh';
        $title = self::appendStoreName($baseTitle, $store, 60);
        $description = self::limitText(
            self::composeDescription([
                'Browse all product categories and find what you need in Bangladesh.',
                $store ? "Shop trusted brands at {$store}." : null,
            ]),
            160
        );
        $keywords = self::keywords([
            'categories in Bangladesh',
            'shop by category BD',
            'online shopping Bangladesh',
            $store ? "{$store} categories" : null,
        ]);

        return [
            'title' => $title,
            'description' => $description,
            'keywords' => $keywords,
            'ogType' => 'website',
            'headings' => [
                'h1' => 'All Categories in Bangladesh',
                'h2' => 'Explore products by category',
                'h3' => 'Find the right products faster',
            ],
        ];
    }

    /**
     * Auto-generate SEO for any path (static pages). Used when no page-specific or dynamic SEO exists.
     */
    public static function buildPathSeo(string $path, ?string $storeName = null): array
    {
        $store = $storeName ? trim($storeName) : '';
        $path = '/' . trim($path, '/');
        if ($path === '/') {
            $path = '';
        }

        $titles = [
            '' => 'Online Shopping in Bangladesh',
            '/' => 'Online Shopping in Bangladesh',
            '/shop' => 'Shop All Products',
            '/cart' => 'Shopping Cart',
            '/checkout' => 'Checkout',
            '/wishlist' => 'My Wishlist',
            '/orders' => 'My Orders',
            '/profile' => 'My Profile',
            '/contact-support' => 'Contact Support',
            '/coupons' => 'Coupons & Offers',
            '/track-order' => 'Track Your Order',
            '/sign-in' => 'Sign In',
            '/sign-up' => 'Sign Up',
            '/password-reset' => 'Password Reset',
            '/apply-vendor' => 'Become a Vendor',
            '/faq' => 'FAQ',
            '/brands' => 'Brands',
        ];

        $descriptions = [
            '' => 'Shop electronics, fashion, and daily needs. Fast delivery and secure checkout across Bangladesh.',
            '/' => 'Shop electronics, fashion, and daily needs. Fast delivery and secure checkout across Bangladesh.',
            '/shop' => 'Browse all products. Compare prices, read reviews, and get fast delivery.',
            '/cart' => 'Review your cart and proceed to checkout.',
            '/checkout' => 'Complete your order securely.',
            '/wishlist' => 'Your saved items and wishlist.',
            '/orders' => 'View and track your orders.',
            '/profile' => 'Manage your account and preferences.',
            '/contact-support' => 'Get help and contact our support team.',
            '/coupons' => 'Apply coupons and get the best deals.',
            '/track-order' => 'Track your order status with tracking number.',
            '/sign-in' => 'Sign in to your account.',
            '/sign-up' => 'Create an account to shop and track orders.',
            '/password-reset' => 'Reset your password.',
            '/apply-vendor' => 'Apply to sell on our platform.',
            '/faq' => 'Frequently asked questions and answers.',
            '/brands' => 'Explore brands and products.',
        ];

        $baseTitle = $titles[$path] ?? self::pathToTitle($path);
        $title = self::appendStoreName($baseTitle, $store, 60);
        $description = self::limitText(
            $descriptions[$path] ?? self::composeDescription([$baseTitle, $store ? "at {$store}" : null, 'Bangladesh.']),
            160
        );
        $keywords = self::keywords([
            'online shopping Bangladesh',
            $store ? "{$store}" : null,
            trim($baseTitle),
        ]);

        return [
            'title' => $title,
            'description' => $description,
            'keywords' => $keywords,
            'ogType' => 'website',
        ];
    }

    /**
     * SEO for CMS pages (Page model: title, description).
     */
    public static function buildPageSeo(string $pageTitle, string $pageDescription, ?string $storeName = null): array
    {
        $store = $storeName ? trim($storeName) : '';
        $baseTitle = trim($pageTitle) !== '' ? $pageTitle : 'Page';
        $title = self::appendStoreName($baseTitle, $store, 60);
        $description = self::limitText(self::stripHtml($pageDescription), 160);
        if ($description === '') {
            $description = self::limitText(self::composeDescription([$baseTitle, $store ? "at {$store}" : null]), 160);
        }
        $keywords = self::keywords([$baseTitle, 'Bangladesh', $store ? "{$store}" : null]);

        return [
            'title' => $title,
            'description' => $description,
            'keywords' => $keywords,
            'ogType' => 'website',
        ];
    }

    /**
     * SEO for section pages (HomeSection: name, title, description).
     */
    public static function buildSectionSeo(string $sectionName, ?string $sectionTitle, ?string $sectionDescription, ?string $storeName = null): array
    {
        $store = $storeName ? trim($storeName) : '';
        $baseTitle = trim($sectionTitle ?? $sectionName) !== '' ? ($sectionTitle ?? $sectionName) : $sectionName;
        $title = self::appendStoreName($baseTitle, $store, 60);
        $desc = trim(self::stripHtml($sectionDescription ?? ''));
        $description = $desc !== '' ? self::limitText($desc, 160) : self::limitText(
            self::composeDescription([$baseTitle, $store ? "at {$store}" : null, 'Bangladesh.']),
            160
        );
        $keywords = self::keywords([$baseTitle, $sectionName, 'Bangladesh', $store ? "{$store}" : null]);

        return [
            'title' => $title,
            'description' => $description,
            'keywords' => $keywords,
            'ogType' => 'website',
        ];
    }

    private static function pathToTitle(string $path): string
    {
        $path = trim($path, '/');
        if ($path === '') {
            return 'Home';
        }
        $parts = explode('/', $path);
        $last = end($parts);
        return ucwords(str_replace(['-', '_'], ' ', $last));
    }

    public static function buildSubcategorySeo(Subcategory $subcategory, ?Category $category = null, ?string $storeName = null): array
    {
        $subcategoryName = trim($subcategory->name);
        $categoryName = $category ? trim($category->name) : '';
        $store = $storeName ? trim($storeName) : '';
        $baseTitle = "Buy {$subcategoryName} in Bangladesh";
        $title = self::appendStoreName($baseTitle, $store, 60);
        $description = self::limitText(
            self::composeDescription([
                "Find {$subcategoryName}" . ($categoryName ? " in {$categoryName}" : '') . ' at great prices in Bangladesh.',
                'Compare ratings, offers, and delivery options.',
            ]),
            160
        );
        $keywords = self::keywords(self::bangladeshCategoryKeywords($subcategoryName, $categoryName));

        return [
            'title' => $title,
            'description' => $description,
            'keywords' => $keywords,
            'ogType' => 'website',
            'headings' => [
                'h1' => "Shop {$subcategoryName} in Bangladesh",
                'h2' => $categoryName ? "More from {$categoryName}" : "Popular {$subcategoryName} picks",
                'h3' => $store
                    ? "Why buy {$subcategoryName} from {$store}"
                    : "Why buy {$subcategoryName} online in Bangladesh",
            ],
        ];
    }

    public static function buildProductSeo(Product $product, ?Category $category = null, ?string $storeName = null): array
    {
        $productName = trim($product->name);
        $categoryName = $category ? trim($category->name) : '';
        $store = $storeName ? trim($storeName) : '';

        $baseTitle = "Buy {$productName} in Bangladesh";
        $title = self::appendStoreName($baseTitle, $store, 60);

        $shortDesc = trim((string) ($product->short_description ?? ''));
        $description = $shortDesc !== ''
            ? $shortDesc
            : self::composeDescription([
                "Get {$productName}" . ($categoryName ? " from {$categoryName}" : '') . ' at a great price in Bangladesh.',
                'Check ratings, stock, and fast delivery options.',
            ]);
        $description = self::limitText(self::stripHtml($description), 160);

        $keywords = self::keywords([
            $productName,
            $categoryName ? "{$categoryName} in Bangladesh" : null,
            "buy {$productName} online",
            "{$productName} price in Bangladesh",
            "BD {$productName}",
            "{$productName} reviews",
        ]);

        return [
            'title' => $title,
            'description' => $description,
            'keywords' => $keywords,
            'ogType' => 'product',
            'headings' => [
                'h1' => $productName,
                'h2' => "Key features of {$productName}",
                'h3' => $store
                    ? "Why buy {$productName} from {$store}"
                    : "Why buy {$productName} online in Bangladesh",
            ],
        ];
    }

    public static function productSchema(Product $product, ?Category $category = null, ?string $storeName = null, ?string $productUrl = null): array
    {
        $images = [];
        if (is_array($product->images)) {
            $images = array_values(array_filter($product->images));
        }
        $imageUrls = array_map(fn ($path) => self::toAbsoluteImageUrl($path), $images);

        $price = self::productPrice($product);
        $availability = $product->isOutOfStock() ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock';
        $brandName = $product->brand?->name ?? $storeName ?? null;

        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'Product',
            'name' => $product->name,
            'description' => self::stripHtml($product->short_description ?? $product->description ?? ''),
            'image' => array_values(array_filter($imageUrls)),
            'sku' => $product->variants()->value('sku'),
            'brand' => $brandName ? ['@type' => 'Brand', 'name' => $brandName] : null,
            'category' => $category?->name ?? null,
            'offers' => [
                '@type' => 'Offer',
                'priceCurrency' => 'BDT',
                'price' => number_format($price, 2, '.', ''),
                'availability' => $availability,
                'url' => $productUrl,
                'itemCondition' => 'https://schema.org/NewCondition',
            ],
        ];

        if ((int) ($product->review_count ?? 0) > 0) {
            $schema['aggregateRating'] = [
                '@type' => 'AggregateRating',
                'ratingValue' => number_format((float) ($product->average_rating ?? 0), 1, '.', ''),
                'reviewCount' => (int) ($product->review_count ?? 0),
            ];
        }

        return self::stripNulls($schema);
    }

    private static function productPrice(Product $product): float
    {
        $variant = $product->variants()->orderBy('created_at')->first();
        if ($variant) {
            return (float) $variant->discountedPrice();
        }
        return (float) $product->discountedPrice();
    }

    private static function bangladeshCategoryKeywords(string $categoryName, string $parentCategory = ''): array
    {
        $name = trim($categoryName);
        $parent = trim($parentCategory);
        $base = $parent ? "{$name} {$parent}" : $name;
        return array_filter([
            $name,
            "{$name} price in Bangladesh",
            "buy {$name} online",
            "best {$name} in Bangladesh",
            "{$name} shop BD",
            "{$name} in Dhaka",
            "{$name} in Chattogram",
            $parent ? "{$base} Bangladesh" : null,
        ]);
    }

    private static function toAbsoluteImageUrl(string $path): string
    {
        if ($path === '') {
            return '';
        }
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }
        $base = rtrim(config('app.url'), '/');
        $clean = ltrim($path, '/');
        return "{$base}/storage/{$clean}";
    }

    private static function appendStoreName(string $title, string $storeName, int $limit): string
    {
        $title = trim($title);
        if ($storeName === '') {
            return self::limitText($title, $limit);
        }
        $withStore = "{$title} | {$storeName}";
        if (strlen($withStore) <= $limit) {
            return $withStore;
        }
        return self::limitText($title, $limit);
    }

    private static function composeDescription(array $parts): string
    {
        $filtered = array_values(array_filter(array_map(fn ($part) => $part ? trim((string) $part) : '', $parts)));
        return implode(' ', $filtered);
    }

    private static function keywords(array $parts): string
    {
        $cleaned = [];
        foreach ($parts as $part) {
            if (!is_string($part) || trim($part) === '') {
                continue;
            }
            $normalized = strtolower(trim($part));
            $cleaned[$normalized] = trim($part);
        }
        return implode(', ', array_values($cleaned));
    }

    private static function stripHtml(string $text): string
    {
        return trim(preg_replace('/\s+/', ' ', strip_tags($text)));
    }

    private static function limitText(string $text, int $limit): string
    {
        $clean = trim(preg_replace('/\s+/', ' ', $text));
        if (strlen($clean) <= $limit) {
            return $clean;
        }
        $truncated = substr($clean, 0, $limit);
        $lastSpace = strrpos($truncated, ' ');
        if ($lastSpace !== false && $lastSpace > 0) {
            $truncated = substr($truncated, 0, $lastSpace);
        }
        return rtrim($truncated, '.,;:') . '...';
    }

    private static function stripNulls(array $data): array
    {
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $value = self::stripNulls($value);
                if ($value === []) {
                    unset($data[$key]);
                    continue;
                }
                $data[$key] = $value;
                continue;
            }
            if ($value === null || $value === '') {
                unset($data[$key]);
            }
        }
        return $data;
    }
}
