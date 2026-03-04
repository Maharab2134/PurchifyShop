<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\HomeSection;
use App\Models\Page;
use App\Models\Product;
use App\Models\Setting;
use App\Models\Subcategory;
use App\Services\SeoGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SeoController extends Controller
{
    /**
     * GET /api/v1/seo?path=/shop
     * Public endpoint to get SEO settings for a specific page
     */
    public function index(Request $request): JsonResponse
    {
        $rawPath = (string) $request->query('path', '/');
        $parsed = parse_url($rawPath);
        $path = $parsed['path'] ?? '/';
        $query = [];
        if (!empty($parsed['query'])) {
            parse_str($parsed['query'], $query);
        }
        
        try {
            $seoSettingsRaw = Setting::getValue('seo_settings', '{}');
            $seoSettings = json_decode($seoSettingsRaw, true) ?: [];
        } catch (\Exception $e) {
            // If database error, return empty defaults
            $seoSettings = [];
        }
        
        $seoSettings = array_merge([
            'defaultTitle' => '',
            'defaultDescription' => '',
            'defaultKeywords' => '',
            'defaultOgImage' => '',
            'pages' => [],
        ], is_array($seoSettings) ? $seoSettings : []);

        $storeInfoRaw = Setting::getValue('store_info', '{}');
        $storeInfo = json_decode($storeInfoRaw, true) ?: [];
        $storeName = is_array($storeInfo) ? trim((string) ($storeInfo['storeName'] ?? '')) : '';

        // Find page-specific SEO settings
        $pageSeo = null;
        if (isset($seoSettings['pages']) && is_array($seoSettings['pages'])) {
            foreach ($seoSettings['pages'] as $page) {
                if (!isset($page['path'])) {
                    continue;
                }
                if ($page['path'] === $rawPath || $page['path'] === $path) {
                    $pageSeo = $page;
                    break;
                }
            }
        }

        $dynamicSeo = null;
        $ogImage = '';
        $schema = null;

        if ($path === '/' || $path === '') {
            $dynamicSeo = SeoGenerator::buildHomeSeo($storeName);
        } elseif (str_starts_with($path, '/product/')) {
            $slug = trim(substr($path, strlen('/product/')));
            if ($slug !== '') {
                $product = Product::with(['category', 'variants'])->where('slug', $slug)->first();
                if ($product) {
                    $dynamicSeo = SeoGenerator::buildProductSeo($product, $product->category, $storeName);
                    $ogImage = is_array($product->images) && count($product->images) > 0 ? $product->images[0] : '';
                    $schema = SeoGenerator::productSchema($product, $product->category, $storeName, url($path));
                }
            }
        } elseif ($path === '/shop') {
            if (!empty($query['subcategoryId'])) {
                $subcategory = Subcategory::with('category')->find($query['subcategoryId']);
                if ($subcategory) {
                    $dynamicSeo = SeoGenerator::buildSubcategorySeo($subcategory, $subcategory->category, $storeName);
                    $ogImage = is_array($subcategory->images) && count($subcategory->images) > 0 ? $subcategory->images[0] : '';
                }
            } elseif (!empty($query['categoryId'])) {
                $category = Category::find($query['categoryId']);
                if ($category) {
                    $dynamicSeo = SeoGenerator::buildCategorySeo($category, $storeName);
                    $ogImage = is_array($category->images) && count($category->images) > 0 ? $category->images[0] : '';
                }
            }
        } elseif ($path === '/categories') {
            $dynamicSeo = SeoGenerator::buildCategoryListingSeo($storeName);
        } elseif (str_starts_with($path, '/page/')) {
            $slug = trim(substr($path, strlen('/page/')));
            if ($slug !== '') {
                $page = Page::where('slug', $slug)->where('is_active', true)->first();
                if ($page) {
                    $dynamicSeo = SeoGenerator::buildPageSeo(
                        (string) ($page->title ?? $slug),
                        (string) ($page->description ?? ''),
                        $storeName
                    );
                }
            }
        } elseif (str_starts_with($path, '/section/')) {
            $slug = trim(substr($path, strlen('/section/')));
            if ($slug !== '') {
                $section = HomeSection::where('slug', $slug)->where('is_visible', true)->first();
                if ($section) {
                    $dynamicSeo = SeoGenerator::buildSectionSeo(
                        (string) ($section->name ?? $slug),
                        $section->title,
                        $section->description,
                        $storeName
                    );
                }
            }
        }

        // Merge page-specific, dynamic, and defaults
        $defaults = [
            'title' => $seoSettings['defaultTitle'] ?? '',
            'description' => $seoSettings['defaultDescription'] ?? '',
            'keywords' => $seoSettings['defaultKeywords'] ?? '',
            'ogImage' => $seoSettings['defaultOgImage'] ?? '',
        ];
        if (!$defaults['title'] && !$defaults['description'] && !$defaults['keywords']) {
            $defaults = array_merge($defaults, SeoGenerator::buildHomeSeo($storeName));
        }

        $title = $pageSeo['title'] ?? ($dynamicSeo['title'] ?? $defaults['title']);
        $description = $pageSeo['description'] ?? ($dynamicSeo['description'] ?? $defaults['description']);
        $keywords = $pageSeo['keywords'] ?? ($dynamicSeo['keywords'] ?? $defaults['keywords']);
        $ogImage = $pageSeo['ogImage'] ?? ($ogImage ?: ($dynamicSeo['ogImage'] ?? $defaults['ogImage']));
        $ogType = $dynamicSeo['ogType'] ?? 'website';
        $headings = $dynamicSeo['headings'] ?? null;

        // Auto fallback: any path gets at least title/description from buildPathSeo
        if ($title === '' || $description === '') {
            $pathSeo = SeoGenerator::buildPathSeo($path, $storeName);
            if ($title === '') {
                $title = $pathSeo['title'];
            }
            if ($description === '') {
                $description = $pathSeo['description'];
            }
            if ($keywords === '') {
                $keywords = $pathSeo['keywords'];
            }
        }

        return response()->json([
            'message' => 'SEO settings fetched successfully',
            'data' => [
                'title' => $title,
                'description' => $description,
                'keywords' => $keywords,
                'ogImage' => $ogImage,
                'ogType' => $ogType,
                'headings' => $headings,
                'schema' => $schema,
            ],
        ]);
    }
}
