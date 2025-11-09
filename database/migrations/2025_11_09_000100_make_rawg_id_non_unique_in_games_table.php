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
            if (Schema::hasColumn('games', 'rawg_id')) {
                // Remove a restrição de unicidade de rawg_id, mantendo a coluna
                $table->dropUnique('games_rawg_id_unique');
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
                // Restaura a restrição de unicidade caso seja feito rollback
                $table->unique('rawg_id', 'games_rawg_id_unique');
            }
        });
    }
};

