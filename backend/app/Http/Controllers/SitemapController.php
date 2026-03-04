<?php

namespace App\Http\Controllers;

use App\Models\HomeSection;
use App\Models\Page;
use App\Models\Product;
use Illuminate\Http\Response;

class SitemapController extends Controller
{
    /**
     * Generate sitemap.xml with dynamic base URL (APP_URL) and dynamic product/page/section URLs.
     */
    public function index(): Response
    {
        $base = rtrim(config('app.url'), '/');

        $urls = [];

        // Static public pages
        $static = [
            ['path' => '', 'priority' => '1.0', 'changefreq' => 'daily'],
            ['path' => 'shop', 'priority' => '0.9', 'changefreq' => 'weekly'],
            ['path' => 'categories', 'priority' => '0.8', 'changefreq' => 'weekly'],
            ['path' => 'brands', 'priority' => '0.8', 'changefreq' => 'weekly'],
            ['path' => 'faq', 'priority' => '0.6', 'changefreq' => 'monthly'],
            ['path' => 'contact-support', 'priority' => '0.6', 'changefreq' => 'monthly'],
            ['path' => 'coupons', 'priority' => '0.7', 'changefreq' => 'weekly'],
            ['path' => 'track-order', 'priority' => '0.5', 'changefreq' => 'monthly'],
            ['path' => 'apply-vendor', 'priority' => '0.5', 'changefreq' => 'monthly'],
            ['path' => 'sign-in', 'priority' => '0.4', 'changefreq' => 'monthly'],
            ['path' => 'sign-up', 'priority' => '0.4', 'changefreq' => 'monthly'],
        ];

        foreach ($static as $s) {
            $urls[] = [
                'loc' => $base . '/' . $s['path'],
                'lastmod' => now()->toAtomString(),
                'changefreq' => $s['changefreq'],
                'priority' => $s['priority'],
            ];
        }

        // Products
        $products = Product::select('slug', 'updated_at')->whereNotNull('slug')->get();
        foreach ($products as $p) {
            $urls[] = [
                'loc' => $base . '/product/' . rawurlencode($p->slug),
                'lastmod' => $p->updated_at?->toAtomString() ?? now()->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.8',
            ];
        }

        // Pages (active only)
        $pages = Page::where('is_active', true)->select('slug', 'updated_at')->get();
        foreach ($pages as $p) {
            $urls[] = [
                'loc' => $base . '/page/' . rawurlencode($p->slug),
                'lastmod' => $p->updated_at?->toAtomString() ?? now()->toAtomString(),
                'changefreq' => 'monthly',
                'priority' => '0.6',
            ];
        }

        // Home sections (section landing pages)
        $sections = HomeSection::select('slug', 'updated_at')->whereNotNull('slug')->get();
        foreach ($sections as $s) {
            $urls[] = [
                'loc' => $base . '/section/' . rawurlencode($s->slug),
                'lastmod' => $s->updated_at?->toAtomString() ?? now()->toAtomString(),
                'changefreq' => 'weekly',
                'priority' => '0.7',
            ];
        }

        $xml = $this->buildXml($urls);

        return response($xml, 200, [
            'Content-Type' => 'application/xml',
            'Cache-Control' => 'public, max-age=3600',
        ]);
    }

    private function buildXml(array $urls): string
    {
        $out = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $out .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
        foreach ($urls as $u) {
            $out .= '  <url>' . "\n";
            $out .= '    <loc>' . htmlspecialchars($u['loc'], ENT_XML1, 'UTF-8') . '</loc>' . "\n";
            $out .= '    <lastmod>' . ($u['lastmod'] ?? now()->toAtomString()) . '</lastmod>' . "\n";
            $out .= '    <changefreq>' . ($u['changefreq'] ?? 'weekly') . '</changefreq>' . "\n";
            $out .= '    <priority>' . ($u['priority'] ?? '0.5') . '</priority>' . "\n";
            $out .= '  </url>' . "\n";
        }
        $out .= '</urlset>';
        return $out;
    }
}
