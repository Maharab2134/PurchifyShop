<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Section;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class EcommerceSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            ['name' => 'Admin', 'password' => bcrypt('password'), 'role' => 'SUPERADMIN']
        );

        $categories = [
            ['name' => 'Electronics', 'description' => 'Electronic devices and gadgets'],
            ['name' => 'Clothing', 'description' => 'Apparel and fashion'],
            ['name' => 'Home & Garden', 'description' => 'Home and garden supplies'],
        ];
        foreach ($categories as $c) {
            Category::firstOrCreate(
                ['slug' => Str::slug($c['name'])],
                ['name' => $c['name'], 'description' => $c['description'], 'images' => []]
            );
        }

        $cat = Category::where('slug', 'electronics')->first();
        if ($cat) {
            $p = Product::firstOrCreate(
                ['slug' => 'sample-wireless-headphones'],
                [
                    'name' => 'Sample Wireless Headphones',
                    'description' => 'High-quality wireless headphones with noise cancellation.',
                    'category_id' => $cat->id,
                    'is_new' => true,
                    'is_featured' => true,
                    'sales_count' => 0,
                    'average_rating' => 0,
                    'review_count' => 0,
                ]
            );
            ProductVariant::firstOrCreate(
                ['sku' => 'WH-001'],
                [
                    'product_id' => $p->id,
                    'price' => 99.99,
                    'stock' => 50,
                    'images' => [],
                ]
            );
        }

        Section::firstOrCreate(
            ['type' => 'HERO'],
            [
                'title' => 'Welcome to Our Store',
                'description' => 'Discover amazing products at great prices.',
                'images' => [],
                'is_visible' => true,
            ]
        );

        $this->call(PaymentMethodSeeder::class);
        $this->call(EmailTemplateSeeder::class);
        $this->call(ActivitySeeder::class);
    }
}
