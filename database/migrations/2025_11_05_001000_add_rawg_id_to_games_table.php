<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('games')) {
            return;
        }

        Schema::table('games', function (Blueprint $table) {
            if (!Schema::hasColumn('games', 'rawg_id')) {
                $table->unsignedBigInteger('rawg_id')->nullable()->unique();
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('games')) {
            return;
        }

        Schema::table('games', function (Blueprint $table) {
            if (Schema::hasColumn('games', 'rawg_id')) {
                // Nome padrão do índice único gerado pelo Laravel
                $table->dropUnique('games_rawg_id_unique');
                $table->dropColumn('rawg_id');
            }
        });
    }
};

