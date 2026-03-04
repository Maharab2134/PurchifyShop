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
        Schema::table('shipments', function (Blueprint $table) {
            $table->string('courier_company')->nullable()->after('carrier');
            $table->string('courier_tracking_id')->nullable()->after('courier_company');
            $table->date('dispatch_date')->nullable()->after('courier_tracking_id');
            $table->date('expected_delivery_date')->nullable()->after('dispatch_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shipments', function (Blueprint $table) {
            $table->dropColumn(['courier_company', 'courier_tracking_id', 'dispatch_date', 'expected_delivery_date']);
        });
    }
};
