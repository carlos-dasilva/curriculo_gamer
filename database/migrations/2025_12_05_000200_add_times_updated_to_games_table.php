<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('games') || Schema::hasColumn('games', 'times_updated')) {
            return;
        }

        Schema::table('games', function (Blueprint $table) {
            $table->unsignedInteger('times_updated')->default(0);
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('games') || !Schema::hasColumn('games', 'times_updated')) {
            return;
        }

        Schema::table('games', function (Blueprint $table) {
            $table->dropColumn('times_updated');
        });
    }
};
