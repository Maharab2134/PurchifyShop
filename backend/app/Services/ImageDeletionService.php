<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\Category;
use App\Models\HomeSection;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Section;
use App\Models\Setting;
use App\Models\Slider;
use App\Models\Subcategory;
use Illuminate\Support\Facades\Storage;

class ImageDeletionService
{
    public function normalizePath(string $path): string
    {
        $clean = trim($path);
        if ($clean === '') {
            return '';
        }
        if (str_starts_with($clean, 'http://') || str_starts_with($clean, 'https://')) {
            $parsed = parse_url($clean);
            $clean = $parsed['path'] ?? $clean;
        }
        $storagePos = strpos($clean, '/storage/');
        if ($storagePos !== false) {
            $clean = substr($clean, $storagePos + strlen('/storage/'));
        }
        $clean = ltrim($clean, '/');
        return $clean;
    }

    /** @var list<string> Same as UploadController ALLOWED_FOLDERS */
    private const ALLOWED_STORAGE_PREFIXES = ['products/', 'utility/', 'logo/', 'categories/', 'brands/'];

    public function isAllowedPath(string $path): bool
    {
        if ($path === '' || str_contains($path, '..')) {
            return false;
        }
        foreach (self::ALLOWED_STORAGE_PREFIXES as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return true;
            }
        }
        return false;
    }

    public function removeFromOwner(string $ownerType, ?string $ownerId, ?string $field, string $path): bool
    {
        switch ($ownerType) {
            case 'product':
                $product = Product::findOrFail($ownerId);
                $images = array_values(array_filter($product->images ?? [], fn ($img) => $img !== $path));
                $product->update(['images' => $images]);
                return true;
            case 'category':
                $category = Category::findOrFail($ownerId);
                $images = array_values(array_filter($category->images ?? [], fn ($img) => $img !== $path));
                $category->update(['images' => $images]);
                return true;
            case 'subcategory':
                $subcategory = Subcategory::findOrFail($ownerId);
                $images = array_values(array_filter($subcategory->images ?? [], fn ($img) => $img !== $path));
                $subcategory->update(['images' => $images]);
                return true;
            case 'brand':
                $brand = Brand::findOrFail($ownerId);
                if ($brand->logo === $path) {
                    $brand->update(['logo' => null]);
                }
                return true;
            case 'slider':
                $slider = Slider::findOrFail($ownerId);
                if ($slider->image === $path) {
                    $slider->update(['image' => null]);
                }
                return true;
            case 'section':
                $section = Section::findOrFail($ownerId);
                $images = array_values(array_filter($section->images ?? [], fn ($img) => $img !== $path));
                $section->update(['images' => $images]);
                return true;
            case 'homeSection':
                $section = HomeSection::findOrFail($ownerId);
                if ($field === 'themeData.images') {
                    $themeData = is_array($section->theme_data) ? $section->theme_data : [];
                    $images = array_values(array_filter($themeData['images'] ?? [], fn ($img) => $img !== $path));
                    $themeData['images'] = $images;
                    $section->update(['theme_data' => $themeData]);
                    return true;
                }
                if ($section->image === $path) {
                    $section->update(['image' => null]);
                }
                return true;
            case 'settings':
                return $this->removeFromSettings($field, $path);
            case 'variant':
                $variant = ProductVariant::findOrFail($ownerId);
                $images = array_values(array_filter($variant->images ?? [], fn ($img) => $img !== $path));
                $variant->update(['images' => $images]);
                return true;
            default:
                return false;
        }
    }

    public function isReferenced(string $path): bool
    {
        if (Product::whereJsonContains('images', $path)->exists()) return true;
        if (ProductVariant::whereJsonContains('images', $path)->exists()) return true;
        if (Category::whereJsonContains('images', $path)->exists()) return true;
        if (Subcategory::whereJsonContains('images', $path)->exists()) return true;
        if (Section::whereJsonContains('images', $path)->exists()) return true;
        if (HomeSection::where('image', $path)->exists()) return true;
        if (HomeSection::whereJsonContains('theme_data->images', $path)->exists()) return true;
        if (Slider::where('image', $path)->exists()) return true;
        if (Brand::where('logo', $path)->exists()) return true;
        if ($this->settingsContainPath($path)) return true;
        return false;
    }

    public function deleteFromStorageIfOrphan(string $path): bool
    {
        if ($this->isReferenced($path)) {
            return false;
        }
        $disk = Storage::disk('public');
        if ($disk->exists($path)) {
            return (bool) $disk->delete($path);
        }
        return false;
    }

    private function settingsContainPath(string $path): bool
    {
        $keys = ['store_info', 'popup_settings', 'seo_settings'];
        foreach ($keys as $key) {
            $raw = Setting::getValue($key, '{}');
            $data = json_decode($raw, true) ?: [];
            if ($this->arrayHasPath($data, $path)) {
                return true;
            }
        }
        return false;
    }

    private function arrayHasPath(array $data, string $path): bool
    {
        foreach ($data as $value) {
            if (is_array($value)) {
                if ($this->arrayHasPath($value, $path)) {
                    return true;
                }
                continue;
            }
            if (is_string($value) && $value === $path) {
                return true;
            }
        }
        return false;
    }

    private function removeFromSettings(?string $field, string $path): bool
    {
        if ($field === 'storeInfo.logo') {
            $raw = Setting::getValue('store_info', '{}');
            $data = json_decode($raw, true) ?: [];
            if (($data['logo'] ?? '') === $path) {
                $data['logo'] = '';
                Setting::setValue('store_info', json_encode($data));
            }
            return true;
        }
        if ($field === 'popupSettings.image') {
            $raw = Setting::getValue('popup_settings', '{}');
            $data = json_decode($raw, true) ?: [];
            if (($data['image'] ?? '') === $path) {
                $data['image'] = '';
                Setting::setValue('popup_settings', json_encode($data));
            }
            return true;
        }
        if ($field === 'seoSettings.ogImage') {
            $raw = Setting::getValue('seo_settings', '{}');
            $data = json_decode($raw, true) ?: [];
            if (($data['defaultOgImage'] ?? '') === $path) {
                $data['defaultOgImage'] = '';
                Setting::setValue('seo_settings', json_encode($data));
            }
            return true;
        }
        return false;
    }
}
