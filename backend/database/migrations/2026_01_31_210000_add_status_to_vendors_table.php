<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('vendors') && !Schema::hasColumn('vendors', 'status')) {
            Schema::table('vendors', function (Blueprint $table) {
                $table->string('status', 20)->default('pending')->after('contact_name');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('vendors', 'status')) {
            Schema::table('vendors', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }
    }
};
