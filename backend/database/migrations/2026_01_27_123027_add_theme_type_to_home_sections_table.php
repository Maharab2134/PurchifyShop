<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('home_sections', function (Blueprint $table) {
            $table->string('theme_type', 50)->default('PRODUCT_GRID')->after('slug');
            $table->text('title')->nullable()->after('theme_type');
            $table->text('description')->nullable()->after('title');
            $table->text('subtitle')->nullable()->after('description');
            $table->json('theme_data')->nullable()->after('subtitle'); // For storing theme-specific data
            $table->string('background_color', 20)->nullable()->after('theme_data');
            $table->string('text_color', 20)->nullable()->after('background_color');
            $table->string('cta_text', 100)->nullable()->after('text_color');
            $table->string('cta_link', 500)->nullable()->after('cta_text');
            $table->boolean('is_visible')->default(true)->after('cta_link');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('home_sections', function (Blueprint $table) {
            $table->dropColumn([
                'theme_type',
                'title',
                'description',
                'subtitle',
                'theme_data',
                'background_color',
                'text_color',
                'cta_text',
                'cta_link',
                'is_visible',
            ]);
        });
    }
};
