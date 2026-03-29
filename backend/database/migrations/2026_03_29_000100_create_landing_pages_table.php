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
        Schema::create('landing_pages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('template');
            $table->uuid('product_id')->nullable();
            $table->string('hero_headline')->nullable();
            $table->text('hero_text')->nullable();
            $table->string('video_url')->nullable();
            $table->string('primary_color', 20)->default('#F97316');
            $table->string('thumbnail')->nullable();
            $table->unsignedBigInteger('view_count')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->nullOnDelete();
            $table->index(['is_active', 'updated_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('landing_pages');
    }
};
