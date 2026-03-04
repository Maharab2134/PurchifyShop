<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Steadfast official API doc uses Base URL https://portal.packzy.com/api/v1.
     * Replace any saved old URL so API calls stop returning 500.
     */
    public function up(): void
    {
        $official = 'https://portal.packzy.com/api/v1';
        $old = 'https://portal.steadfast.com.bd/api/v1';

        $updated = DB::table('settings')
            ->where('key', 'steadfast_base_url')
            ->where('value', $old)
            ->update(['value' => $official]);

        if ($updated) {
            Cache::forget('setting:steadfast_base_url');
        }
    }

    public function down(): void
    {
        $official = 'https://portal.packzy.com/api/v1';
        $old = 'https://portal.steadfast.com.bd/api/v1';

        DB::table('settings')
            ->where('key', 'steadfast_base_url')
            ->where('value', $official)
            ->update(['value' => $old]);

        Cache::forget('setting:steadfast_base_url');
    }
};
