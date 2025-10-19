<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('site_settings', 'system_logs_enabled')) {
                $table->boolean('system_logs_enabled')->default(false)->after('youtube');
            }
            if (!Schema::hasColumn('site_settings', 'system_logs_path')) {
                $table->string('system_logs_path', 255)->nullable()->after('system_logs_enabled');
            }
        });
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            if (Schema::hasColumn('site_settings', 'system_logs_enabled')) {
                $table->dropColumn('system_logs_enabled');
            }
            if (Schema::hasColumn('site_settings', 'system_logs_path')) {
                $table->dropColumn('system_logs_path');
            }
        });
    }
};

