<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Table used by Admin "Recent Activities" dashboard (recent-activities API).
     */
    public function up(): void
    {
        if (Schema::hasTable('logs')) {
            return;
        }
        Schema::create('logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('level', 20);
            $table->text('message');
            $table->json('context')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('logs');
    }
};
