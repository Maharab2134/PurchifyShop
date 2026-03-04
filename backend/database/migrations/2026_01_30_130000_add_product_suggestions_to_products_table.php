<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->json('suggested_size_ids')->nullable()->after('images');
            $table->json('suggested_attribute_value_ids')->nullable()->after('suggested_size_ids');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['suggested_size_ids', 'suggested_attribute_value_ids']);
        });
    }
};
