<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->decimal('parcel_weight', 8, 2)->nullable()->after('contact_phone')->comment('Weight in kg for courier parcel (manual entry)');
        });

        Schema::table('shipments', function (Blueprint $table) {
            $table->decimal('weight', 8, 2)->nullable()->after('tracking_number')->comment('Parcel weight in kg');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('parcel_weight');
        });
        Schema::table('shipments', function (Blueprint $table) {
            $table->dropColumn('weight');
        });
    }
};
