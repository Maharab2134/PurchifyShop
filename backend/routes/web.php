<?php

use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

/*
| Sitemap: dynamic XML from APP_URL + products/pages/sections from DB.
*/
Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');

/*
| SPA fallback: when frontend build is deployed inside Laravel public/,
| serve index.html for any path so refresh and direct links work (no 404).
| API routes are under /api and handled by api.php, so they are not affected.
*/
$spaIndex = public_path('index.html');
$serveSpa = file_exists($spaIndex);

if ($serveSpa) {
    Route::get('/{path?}', function () use ($spaIndex) {
        if (str_starts_with(request()->path(), 'api')) {
            abort(404);
        }
        return response()->file($spaIndex);
    })->where('path', '.*')->name('spa.fallback');
} else {
    Route::get('/', function () {
        return view('welcome');
    });
}
