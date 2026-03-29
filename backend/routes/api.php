<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes (v1) – Ecommerce REST API
|--------------------------------------------------------------------------
| All routes prefixed with /api/v1. Auth via Laravel Sanctum (Bearer token).
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Health
    Route::get('/health', fn () => response()->json(['status' => 'ok', 'timestamp' => now()->toIso8601String()]))->name('api.health');

    // Public
    Route::post('/auth/sign-up', [\App\Http\Controllers\Api\V1\AuthController::class, 'signUp'])->name('api.auth.signup');
    Route::post('/auth/sign-in', [\App\Http\Controllers\Api\V1\AuthController::class, 'signIn'])->name('api.auth.signin');
    Route::post('/auth/forgot-password', [\App\Http\Controllers\Api\V1\AuthController::class, 'forgotPassword'])->name('api.auth.forgot');
    Route::post('/auth/reset-password', [\App\Http\Controllers\Api\V1\AuthController::class, 'resetPassword'])->name('api.auth.reset');

    Route::get('/products', [\App\Http\Controllers\Api\V1\ProductController::class, 'index'])->name('api.products.index');
    Route::get('/products/slug/{slug}', [\App\Http\Controllers\Api\V1\ProductController::class, 'showBySlug'])->name('api.products.slug');
    Route::get('/products/{id}/related', [\App\Http\Controllers\Api\V1\ProductController::class, 'related'])->name('api.products.related');
    Route::get('/products/{id}', [\App\Http\Controllers\Api\V1\ProductController::class, 'show'])->name('api.products.show');
    Route::get('/products/{productId}/reviews', [\App\Http\Controllers\Api\V1\ReviewController::class, 'index'])->name('api.reviews.index');
    Route::get('/brands', [\App\Http\Controllers\Api\V1\BrandController::class, 'index'])->name('api.brands.index');
    Route::get('/categories', [\App\Http\Controllers\Api\V1\CategoryController::class, 'index'])->name('api.categories.index');
    Route::get('/categories/{id}', [\App\Http\Controllers\Api\V1\CategoryController::class, 'show'])->name('api.categories.show');
    Route::get('/subcategories', [\App\Http\Controllers\Api\V1\SubcategoryController::class, 'index'])->name('api.subcategories.index');
    Route::get('/subcategories/{id}', [\App\Http\Controllers\Api\V1\SubcategoryController::class, 'show'])->name('api.subcategories.show');
    Route::get('/sections', [\App\Http\Controllers\Api\V1\SectionController::class, 'index'])->name('api.sections.index');
    Route::get('/home-sections', [\App\Http\Controllers\Api\V1\HomeSectionController::class, 'index'])->name('api.home-sections.index');
    Route::get('/sliders', [\App\Http\Controllers\Api\V1\SliderController::class, 'index'])->name('api.sliders.index');
    Route::get('/notices', [\App\Http\Controllers\Api\V1\NoticeController::class, 'index'])->name('api.notices.index');
    Route::get('/config', [\App\Http\Controllers\Api\V1\ConfigController::class, 'index'])->name('api.config.index');
    Route::get('/store-info', [\App\Http\Controllers\Api\V1\StoreInfoController::class, 'index'])->name('api.store-info.index');
    Route::get('/seo', [\App\Http\Controllers\Api\V1\SeoController::class, 'index'])->name('api.seo.index');
    Route::get('/animation-settings', [\App\Http\Controllers\Api\V1\AnimationController::class, 'index'])->name('api.animation-settings.index');
    Route::get('/footer', [\App\Http\Controllers\Api\V1\FooterController::class, 'index'])->name('api.footer.index');
    Route::get('/pages', [\App\Http\Controllers\Api\V1\PageController::class, 'index'])->name('api.pages.index');
    Route::get('/pages/slug/{slug}', [\App\Http\Controllers\Api\V1\PageController::class, 'showBySlug'])->name('api.pages.slug');
    Route::get('/landing-pages', [\App\Http\Controllers\Api\V1\LandingPageController::class, 'index'])->name('api.landing-pages.index');
    Route::get('/landing-pages/slug/{slug}', [\App\Http\Controllers\Api\V1\LandingPageController::class, 'showBySlug'])->name('api.landing-pages.slug');
    Route::get('/payment-methods', [\App\Http\Controllers\Api\V1\PaymentMethodController::class, 'index'])->name('api.payment-methods.index');
    Route::get('/shipping-options', [\App\Http\Controllers\Api\V1\ShippingOptionController::class, 'index'])->name('api.shipping-options.index');

    // Cart (guest by session or auth by token)
    Route::get('/cart', [\App\Http\Controllers\Api\V1\CartController::class, 'index'])->name('api.cart.index');
    Route::post('/cart/items', [\App\Http\Controllers\Api\V1\CartController::class, 'addItem'])->name('api.cart.add');
    Route::patch('/cart/items/{id}', [\App\Http\Controllers\Api\V1\CartController::class, 'updateItem'])->name('api.cart.update');
    Route::delete('/cart/items/{id}', [\App\Http\Controllers\Api\V1\CartController::class, 'removeItem'])->name('api.cart.remove');

    // Incomplete-orders track (cart/checkout visit) – auth optional; guests use X-Cart-Session-ID
    Route::post('/incomplete-orders/track', [\App\Http\Controllers\Api\V1\IncompleteOrderController::class, 'track'])->name('api.incomplete-orders.track');

    // Page-view tracking (public, storefront visits for SUPERADMIN analytics)
    Route::post('/track-page-view', [\App\Http\Controllers\Api\V1\PageViewController::class, 'track'])->name('api.track-page-view');

    // Track Order (public, no auth required)
    Route::post('/track-order', [\App\Http\Controllers\Api\V1\TrackOrderController::class, 'track'])->name('api.track-order');

    // Steadfast webhook (public, validated by Bearer token)
    Route::post('/webhooks/steadfast', [\App\Http\Controllers\Api\V1\SteadfastWebhookController::class, 'handle'])->name('api.webhooks.steadfast');

    // Vendor application (public)
    Route::post('/vendor-applications', [\App\Http\Controllers\Api\V1\VendorApplicationController::class, 'store'])->name('api.vendor-applications.store');

    // Protected (Sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/sign-out', [\App\Http\Controllers\Api\V1\AuthController::class, 'signOut'])->name('api.auth.signout');
        Route::post('/auth/refresh-token', [\App\Http\Controllers\Api\V1\AuthController::class, 'refreshToken'])->name('api.auth.refresh');
        Route::get('/auth/me', [\App\Http\Controllers\Api\V1\AuthController::class, 'me'])->name('api.auth.me');
        Route::put('/auth/profile', [\App\Http\Controllers\Api\V1\AuthController::class, 'updateProfile'])->name('api.auth.update-profile');
        Route::put('/auth/change-password', [\App\Http\Controllers\Api\V1\AuthController::class, 'changePassword'])->name('api.auth.change-password');

        Route::get('/orders', [\App\Http\Controllers\Api\V1\OrderController::class, 'index'])->name('api.orders.index');
        Route::get('/orders/{id}', [\App\Http\Controllers\Api\V1\OrderController::class, 'show'])->name('api.orders.show');
        Route::post('/orders/{id}/cancel', [\App\Http\Controllers\Api\V1\OrderController::class, 'cancel'])->name('api.orders.cancel');
        Route::post('/checkout', [\App\Http\Controllers\Api\V1\CheckoutController::class, 'store'])->name('api.checkout.store');
        Route::get('/wishlist', [\App\Http\Controllers\Api\V1\WishlistController::class, 'index'])->name('api.wishlist.index');
        Route::post('/wishlist', [\App\Http\Controllers\Api\V1\WishlistController::class, 'store'])->name('api.wishlist.store');
        Route::delete('/wishlist/{productId}', [\App\Http\Controllers\Api\V1\WishlistController::class, 'destroy'])->name('api.wishlist.destroy');
        Route::get('/addresses', [\App\Http\Controllers\Api\V1\AddressController::class, 'index'])->name('api.addresses.index');
        Route::post('/addresses', [\App\Http\Controllers\Api\V1\AddressController::class, 'store'])->name('api.addresses.store');
        Route::put('/addresses/{id}', [\App\Http\Controllers\Api\V1\AddressController::class, 'update'])->name('api.addresses.update');
        Route::delete('/addresses/{id}', [\App\Http\Controllers\Api\V1\AddressController::class, 'destroy'])->name('api.addresses.destroy');
        Route::post('/reviews', [\App\Http\Controllers\Api\V1\ReviewController::class, 'store'])->name('api.reviews.store');
        Route::get('/coupons', [\App\Http\Controllers\Api\V1\CouponController::class, 'index'])->name('api.coupons.index');
        Route::get('/coupons/validate/{code}', [\App\Http\Controllers\Api\V1\CouponController::class, 'validateCoupon'])->name('api.coupons.validate');

        Route::get('/chat', [\App\Http\Controllers\Api\V1\ChatController::class, 'index'])->name('api.chat.index');
        Route::post('/chat', [\App\Http\Controllers\Api\V1\ChatController::class, 'create'])->name('api.chat.create');
        Route::get('/chat/{id}/messages', [\App\Http\Controllers\Api\V1\ChatController::class, 'messages'])->name('api.chat.messages');
        Route::post('/chat/{id}/messages', [\App\Http\Controllers\Api\V1\ChatController::class, 'sendMessage'])->name('api.chat.send');
    });

    // Shared admin panel data for ADMIN/SUPERADMIN/VENDOR (vendor is vendor-scoped in controllers)
    Route::middleware(['auth:sanctum', 'admin_or_vendor'])->prefix('admin')->name('api.admin.')->group(function () {
        Route::get('products', [\App\Http\Controllers\Api\V1\Admin\ProductController::class, 'index'])->name('products.index');
        Route::get('products/{id}', [\App\Http\Controllers\Api\V1\Admin\ProductController::class, 'show'])->name('products.show');
        Route::get('analytics', [\App\Http\Controllers\Api\V1\Admin\AnalyticsController::class, 'index'])->name('analytics.index');
        Route::get('orders', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'index'])->name('orders.index');
        Route::get('orders/notifications', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'notifications'])->name('orders.notifications');
        Route::post('orders/notifications/mark-read', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'markNotificationsAsRead'])->name('orders.notifications.mark-read');
        Route::get('orders/{id}', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'show'])->name('orders.show');
        Route::get('transactions', [\App\Http\Controllers\Api\V1\Admin\TransactionController::class, 'index'])->name('transactions.index');
    });

    // Admin-only (auth + role)
    Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->name('api.admin.')->group(function () {
        Route::post('products', [\App\Http\Controllers\Api\V1\Admin\ProductController::class, 'store'])->name('products.store');
        Route::put('products/{id}', [\App\Http\Controllers\Api\V1\Admin\ProductController::class, 'update'])->name('products.update');
        Route::delete('products/{id}', [\App\Http\Controllers\Api\V1\Admin\ProductController::class, 'destroy'])->name('products.destroy');
        Route::post('products/bulk', [\App\Http\Controllers\Api\V1\Admin\ProductController::class, 'bulk'])->name('products.bulk');
        Route::apiResource('categories', \App\Http\Controllers\Api\V1\Admin\CategoryController::class)->except(['index', 'show']);
        Route::post('categories/reorder', [\App\Http\Controllers\Api\V1\Admin\CategoryController::class, 'reorder'])->name('categories.reorder');
        Route::apiResource('subcategories', \App\Http\Controllers\Api\V1\Admin\SubcategoryController::class);
        Route::apiResource('roles', \App\Http\Controllers\Api\V1\Admin\RoleController::class);
        Route::apiResource('users', \App\Http\Controllers\Api\V1\Admin\UserController::class);
        Route::get('attributes', [\App\Http\Controllers\Api\V1\Admin\AttributeController::class, 'index'])->name('attributes.index');
        Route::post('attributes', [\App\Http\Controllers\Api\V1\Admin\AttributeController::class, 'store'])->name('attributes.store');
        Route::put('attributes/{id}', [\App\Http\Controllers\Api\V1\Admin\AttributeController::class, 'update'])->name('attributes.update');
        Route::get('variants', [\App\Http\Controllers\Api\V1\Admin\VariantController::class, 'index'])->name('variants.index');
        Route::get('variants/{id}', [\App\Http\Controllers\Api\V1\Admin\VariantController::class, 'show'])->name('variants.show');
        Route::post('variants', [\App\Http\Controllers\Api\V1\Admin\VariantController::class, 'store'])->name('variants.store');
        Route::put('variants/{id}', [\App\Http\Controllers\Api\V1\Admin\VariantController::class, 'update'])->name('variants.update');
        Route::delete('variants/{id}', [\App\Http\Controllers\Api\V1\Admin\VariantController::class, 'destroy'])->name('variants.destroy');
        Route::post('variants/{id}/add-stock', [\App\Http\Controllers\Api\V1\Admin\VariantController::class, 'addStock'])->name('variants.add-stock');
        Route::post('variants/{id}/reduce-stock', [\App\Http\Controllers\Api\V1\Admin\VariantController::class, 'reduceStock'])->name('variants.reduce-stock');
        Route::get('sections', [\App\Http\Controllers\Api\V1\Admin\SectionController::class, 'index'])->name('sections.index');
        Route::post('sections', [\App\Http\Controllers\Api\V1\Admin\SectionController::class, 'store'])->name('sections.store');
        Route::put('sections/{id}', [\App\Http\Controllers\Api\V1\Admin\SectionController::class, 'update'])->name('sections.update');
        Route::delete('sections/{id}', [\App\Http\Controllers\Api\V1\Admin\SectionController::class, 'destroy'])->name('sections.destroy');
        Route::get('home-sections', [\App\Http\Controllers\Api\V1\Admin\HomeSectionController::class, 'index'])->name('home-sections.index');
        Route::post('home-sections', [\App\Http\Controllers\Api\V1\Admin\HomeSectionController::class, 'store'])->name('home-sections.store');
        Route::get('home-sections/{id}', [\App\Http\Controllers\Api\V1\Admin\HomeSectionController::class, 'show'])->name('home-sections.show');
        Route::put('home-sections/{id}', [\App\Http\Controllers\Api\V1\Admin\HomeSectionController::class, 'update'])->name('home-sections.update');
        Route::delete('home-sections/{id}', [\App\Http\Controllers\Api\V1\Admin\HomeSectionController::class, 'destroy'])->name('home-sections.destroy');
        Route::put('home-sections/{id}/products', [\App\Http\Controllers\Api\V1\Admin\HomeSectionController::class, 'updateProducts'])->name('home-sections.products');
        Route::post('home-sections/reorder', [\App\Http\Controllers\Api\V1\Admin\HomeSectionController::class, 'reorder'])->name('home-sections.reorder');
        Route::get('sliders', [\App\Http\Controllers\Api\V1\Admin\SliderController::class, 'index'])->name('sliders.index');
        Route::post('sliders', [\App\Http\Controllers\Api\V1\Admin\SliderController::class, 'store'])->name('sliders.store');
        Route::get('sliders/{id}', [\App\Http\Controllers\Api\V1\Admin\SliderController::class, 'show'])->name('sliders.show');
        Route::put('sliders/{id}', [\App\Http\Controllers\Api\V1\Admin\SliderController::class, 'update'])->name('sliders.update');
        Route::delete('sliders/{id}', [\App\Http\Controllers\Api\V1\Admin\SliderController::class, 'destroy'])->name('sliders.destroy');
        Route::post('sliders/reorder', [\App\Http\Controllers\Api\V1\Admin\SliderController::class, 'reorder'])->name('sliders.reorder');
        Route::get('notices', [\App\Http\Controllers\Api\V1\Admin\NoticeController::class, 'index'])->name('notices.index');
        Route::post('notices', [\App\Http\Controllers\Api\V1\Admin\NoticeController::class, 'store'])->name('notices.store');
        Route::get('notices/{id}', [\App\Http\Controllers\Api\V1\Admin\NoticeController::class, 'show'])->name('notices.show');
        Route::put('notices/{id}', [\App\Http\Controllers\Api\V1\Admin\NoticeController::class, 'update'])->name('notices.update');
        Route::delete('notices/{id}', [\App\Http\Controllers\Api\V1\Admin\NoticeController::class, 'destroy'])->name('notices.destroy');
        Route::post('notices/reorder', [\App\Http\Controllers\Api\V1\Admin\NoticeController::class, 'reorder'])->name('notices.reorder');
        Route::get('settings', [\App\Http\Controllers\Api\V1\Admin\SettingsController::class, 'index'])->name('settings.index');
        Route::put('settings', [\App\Http\Controllers\Api\V1\Admin\SettingsController::class, 'update'])->name('settings.update');
        Route::get('footer', [\App\Http\Controllers\Api\V1\Admin\FooterController::class, 'index'])->name('footer.index');
        Route::post('footer', [\App\Http\Controllers\Api\V1\Admin\FooterController::class, 'store'])->name('footer.store');
        Route::put('footer/{id}', [\App\Http\Controllers\Api\V1\Admin\FooterController::class, 'update'])->name('footer.update');
        Route::delete('footer/{id}', [\App\Http\Controllers\Api\V1\Admin\FooterController::class, 'destroy'])->name('footer.destroy');
        Route::get('logs', [\App\Http\Controllers\Api\V1\Admin\LogController::class, 'index'])->name('logs.index');
        Route::get('recent-activities', [\App\Http\Controllers\Api\V1\Admin\ActivityController::class, 'index'])->name('activities.recent');
        Route::post('recent-activities/clear', [\App\Http\Controllers\Api\V1\Admin\ActivityController::class, 'clear'])->name('activities.recent.clear');
        Route::post('analytics/top-pages/clear', [\App\Http\Controllers\Api\V1\Admin\AnalyticsController::class, 'clearTopPages'])->name('analytics.top-pages.clear');
        Route::get('recent-visitors', [\App\Http\Controllers\Api\V1\Admin\VisitorController::class, 'index'])->name('visitors.recent');
        Route::post('recent-visitors/clear', [\App\Http\Controllers\Api\V1\Admin\VisitorController::class, 'clear'])->name('visitors.recent.clear');
        Route::post('orders/clear', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'clear'])->name('orders.clear');
        Route::put('orders/{id}/parcel-weight', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'updateParcelWeight'])->name('orders.parcel-weight');
        Route::get('orders/{id}/vendor-whatsapp', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'vendorWhatsApp'])->name('orders.vendor-whatsapp');
        Route::post('orders/{id}/steadfast-create', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'createSteadfastParcel'])->name('orders.steadfast-create');
        Route::get('orders/{id}/steadfast-create', fn (string $id) => response()->json(['message' => 'Use POST to create a Steadfast parcel.', 'supported_method' => 'POST'], 405))->name('orders.steadfast-create.get');
        Route::get('orders/{id}/steadfast-status', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'getSteadfastStatus'])->name('orders.steadfast-status');
        Route::post('orders/{id}/steadfast-cancel', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'cancelSteadfast'])->name('orders.steadfast-cancel');
        Route::post('orders/{id}/pathao-create', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'createPathaoParcel'])->name('orders.pathao-create');
        Route::get('orders/{id}/pathao-status', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'getPathaoStatus'])->name('orders.pathao-status');
        Route::post('orders/{id}/pathao-cancel', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'cancelPathao'])->name('orders.pathao-cancel');
        Route::put('orders/{id}', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'update'])->name('orders.update');
        Route::delete('orders/{id}', [\App\Http\Controllers\Api\V1\Admin\OrderController::class, 'destroy'])->name('orders.destroy');
        Route::put('payments/{id}', [\App\Http\Controllers\Api\V1\Admin\PaymentController::class, 'update'])->name('payments.update');
        Route::delete('transactions/{id}', [\App\Http\Controllers\Api\V1\Admin\TransactionController::class, 'destroy'])->name('transactions.destroy');
        Route::post('uploads', [\App\Http\Controllers\Api\V1\Admin\UploadController::class, 'store'])->name('uploads.store');
        Route::options('uploads', function () { return response('', 204); });
        Route::get('media', [\App\Http\Controllers\Api\V1\Admin\MediaController::class, 'index'])->name('media.index');
        Route::post('images/delete', [\App\Http\Controllers\Api\V1\Admin\ImageController::class, 'destroy'])->name('images.delete');
        Route::get('payment-methods', [\App\Http\Controllers\Api\V1\Admin\PaymentMethodController::class, 'index'])->name('payment-methods.index');
        Route::get('payment-methods/{id}', [\App\Http\Controllers\Api\V1\Admin\PaymentMethodController::class, 'show'])->name('payment-methods.show');
        Route::post('payment-methods', [\App\Http\Controllers\Api\V1\Admin\PaymentMethodController::class, 'store'])->name('payment-methods.store');
        Route::put('payment-methods/{id}', [\App\Http\Controllers\Api\V1\Admin\PaymentMethodController::class, 'update'])->name('payment-methods.update');
        Route::delete('payment-methods/{id}', [\App\Http\Controllers\Api\V1\Admin\PaymentMethodController::class, 'destroy'])->name('payment-methods.destroy');
        Route::apiResource('coupons', \App\Http\Controllers\Api\V1\Admin\CouponController::class);
        Route::post('coupons/{id}/assign', [\App\Http\Controllers\Api\V1\Admin\CouponController::class, 'assignToUser'])->name('coupons.assign');
        Route::get('reviews', [\App\Http\Controllers\Api\V1\Admin\ReviewController::class, 'index'])->name('reviews.index');
        Route::get('reviews/{id}', [\App\Http\Controllers\Api\V1\Admin\ReviewController::class, 'show'])->name('reviews.show');
        Route::delete('reviews/{id}', [\App\Http\Controllers\Api\V1\Admin\ReviewController::class, 'destroy'])->name('reviews.destroy');
        Route::apiResource('sizes', \App\Http\Controllers\Api\V1\Admin\SizeController::class);
        Route::apiResource('shipping-options', \App\Http\Controllers\Api\V1\Admin\ShippingOptionController::class);
        Route::get('shipping-settings', [\App\Http\Controllers\Api\V1\Admin\ShippingSettingsController::class, 'show'])->name('shipping-settings.show');
        Route::put('shipping-settings', [\App\Http\Controllers\Api\V1\Admin\ShippingSettingsController::class, 'update'])->name('shipping-settings.update');
        Route::get('steadfast/status', [\App\Http\Controllers\Api\V1\Admin\SteadfastController::class, 'status'])->name('steadfast.status');
        Route::get('pathao/status', [\App\Http\Controllers\Api\V1\Admin\PathaoController::class, 'status'])->name('pathao.status');
        Route::get('pathao/cities', [\App\Http\Controllers\Api\V1\Admin\PathaoController::class, 'cities'])->name('pathao.cities');
        Route::get('pathao/zones', [\App\Http\Controllers\Api\V1\Admin\PathaoController::class, 'zones'])->name('pathao.zones');
        Route::get('pathao/areas', [\App\Http\Controllers\Api\V1\Admin\PathaoController::class, 'areas'])->name('pathao.areas');
        Route::get('courier/steadfast/settings', [\App\Http\Controllers\Api\V1\Admin\CourierSteadfastSettingsController::class, 'show'])->name('courier.steadfast.settings.show');
        Route::put('courier/steadfast/settings', [\App\Http\Controllers\Api\V1\Admin\CourierSteadfastSettingsController::class, 'update'])->name('courier.steadfast.settings.update');
        Route::get('courier/pathao/settings', [\App\Http\Controllers\Api\V1\Admin\CourierPathaoSettingsController::class, 'show'])->name('courier.pathao.settings.show');
        Route::put('courier/pathao/settings', [\App\Http\Controllers\Api\V1\Admin\CourierPathaoSettingsController::class, 'update'])->name('courier.pathao.settings.update');
        Route::get('vendors', [\App\Http\Controllers\Api\V1\Admin\VendorController::class, 'index'])->name('vendors.index');
        Route::post('vendors', [\App\Http\Controllers\Api\V1\Admin\VendorController::class, 'store'])->name('vendors.store');
        Route::get('vendors/system-status', [\App\Http\Controllers\Api\V1\Admin\VendorController::class, 'systemStatus'])->name('vendors.system-status');
        Route::put('vendors/system-status', [\App\Http\Controllers\Api\V1\Admin\VendorController::class, 'updateSystemStatus'])->name('vendors.system-status.update');
        Route::get('vendors/{id}', [\App\Http\Controllers\Api\V1\Admin\VendorController::class, 'show'])->name('vendors.show');
        Route::put('vendors/{id}', [\App\Http\Controllers\Api\V1\Admin\VendorController::class, 'update'])->name('vendors.update');
        Route::post('vendors/{id}/approve', [\App\Http\Controllers\Api\V1\Admin\VendorController::class, 'approve'])->name('vendors.approve');
        Route::delete('vendors/{id}', [\App\Http\Controllers\Api\V1\Admin\VendorController::class, 'destroy'])->name('vendors.destroy');
        Route::get('brands', [\App\Http\Controllers\Api\V1\Admin\BrandController::class, 'index'])->name('brands.index');
        Route::post('brands', [\App\Http\Controllers\Api\V1\Admin\BrandController::class, 'store'])->name('brands.store');
        Route::get('brands/{id}', [\App\Http\Controllers\Api\V1\Admin\BrandController::class, 'show'])->name('brands.show');
        Route::put('brands/{id}', [\App\Http\Controllers\Api\V1\Admin\BrandController::class, 'update'])->name('brands.update');
        Route::delete('brands/{id}', [\App\Http\Controllers\Api\V1\Admin\BrandController::class, 'destroy'])->name('brands.destroy');
        Route::get('incomplete-orders', [\App\Http\Controllers\Api\V1\Admin\IncompleteOrderController::class, 'index'])->name('incomplete-orders.index');
        Route::get('incomplete-orders/{id}', [\App\Http\Controllers\Api\V1\Admin\IncompleteOrderController::class, 'show'])->name('incomplete-orders.show');
        Route::post('incomplete-orders/{id}/send-marketing', [\App\Http\Controllers\Api\V1\Admin\IncompleteOrderController::class, 'sendMarketing'])->name('incomplete-orders.send-marketing');
        Route::delete('incomplete-orders/{id}', [\App\Http\Controllers\Api\V1\Admin\IncompleteOrderController::class, 'destroy'])->name('incomplete-orders.destroy');
        
        // Email Management
        Route::get('email-settings', [\App\Http\Controllers\Api\V1\Admin\EmailSettingController::class, 'show'])->name('email-settings.show');
        Route::put('email-settings', [\App\Http\Controllers\Api\V1\Admin\EmailSettingController::class, 'update'])->name('email-settings.update');
        Route::post('email-settings/test', [\App\Http\Controllers\Api\V1\Admin\EmailSettingController::class, 'testEmail'])->name('email-settings.test');
        // Email Templates - specific routes must come before apiResource
        Route::get('email-templates/event-types', [\App\Http\Controllers\Api\V1\Admin\EmailTemplateController::class, 'getEventTypes'])->name('email-templates.event-types');
        Route::post('email-templates/{id}/test', [\App\Http\Controllers\Api\V1\Admin\EmailTemplateController::class, 'testEmail'])->name('email-templates.test');
        Route::apiResource('email-templates', \App\Http\Controllers\Api\V1\Admin\EmailTemplateController::class);
        Route::get('email-logs', [\App\Http\Controllers\Api\V1\Admin\EmailLogController::class, 'index'])->name('email-logs.index');
        Route::delete('email-logs/clear', [\App\Http\Controllers\Api\V1\Admin\EmailLogController::class, 'clearAll'])->name('email-logs.clear');
        Route::get('email-logs/{id}', [\App\Http\Controllers\Api\V1\Admin\EmailLogController::class, 'show'])->name('email-logs.show');
        Route::delete('email-logs/{id}', [\App\Http\Controllers\Api\V1\Admin\EmailLogController::class, 'destroy'])->name('email-logs.destroy');
        Route::apiResource('pages', \App\Http\Controllers\Api\V1\Admin\PageController::class);
        Route::apiResource('landing-page-templates', \App\Http\Controllers\Api\V1\Admin\LandingPageTemplateController::class);
        Route::apiResource('landing-pages', \App\Http\Controllers\Api\V1\Admin\LandingPageController::class);
        Route::get('chats', [\App\Http\Controllers\Api\V1\Admin\ChatController::class, 'index'])->name('chats.index');
        Route::get('chats/{id}', [\App\Http\Controllers\Api\V1\Admin\ChatController::class, 'show'])->name('chats.show');
        Route::post('chats/{id}/messages', [\App\Http\Controllers\Api\V1\Admin\ChatController::class, 'sendMessage'])->name('chats.send-message');
        Route::put('chats/{id}/status', [\App\Http\Controllers\Api\V1\Admin\ChatController::class, 'updateStatus'])->name('chats.update-status');
        Route::delete('chats/{id}', [\App\Http\Controllers\Api\V1\Admin\ChatController::class, 'destroy'])->name('chats.destroy');
    });
});
