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
        Schema::table('landing_pages', function (Blueprint $table) {
            if (!Schema::hasColumn('landing_pages', 'template_id')) {
                $table->uuid('template_id')->nullable()->after('template');
                $table->foreign('template_id')
                    ->references('id')
                    ->on('landing_page_templates')
                    ->nullOnDelete();
                $table->index('template_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('landing_pages', function (Blueprint $table) {
            if (Schema::hasColumn('landing_pages', 'template_id')) {
                $table->dropForeign(['template_id']);
                $table->dropIndex(['template_id']);
                $table->dropColumn('template_id');
            }
        });
    }
};
