<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('platforms')) {
            return;
        }
        Schema::table('platforms', function (Blueprint $table) {
            if (!Schema::hasColumn('platforms', 'cover_url')) {
                $table->string('cover_url', 2048)->nullable()->after('description');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('platforms')) {
            return;
        }
        Schema::table('platforms', function (Blueprint $table) {
            if (Schema::hasColumn('platforms', 'cover_url')) {
                $table->dropColumn('cover_url');
            }
        });
    }
};

