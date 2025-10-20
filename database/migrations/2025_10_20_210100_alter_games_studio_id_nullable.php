<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('games') || !Schema::hasColumn('games', 'studio_id')) {
            return;
        }

        $driver = DB::connection()->getDriverName();
        try {
            if ($driver === 'mysql') {
                // Tenta alterar diretamente; se falhar por FK, derruba e recria
                try {
                    DB::statement('ALTER TABLE `games` MODIFY `studio_id` BIGINT UNSIGNED NULL');
                } catch (Throwable $e) {
                    // Nome padrão do FK no Laravel
                    DB::statement('ALTER TABLE `games` DROP FOREIGN KEY `games_studio_id_foreign`');
                    DB::statement('ALTER TABLE `games` MODIFY `studio_id` BIGINT UNSIGNED NULL');
                    DB::statement('ALTER TABLE `games` ADD CONSTRAINT `games_studio_id_foreign` FOREIGN KEY (`studio_id`) REFERENCES `studios`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT');
                }
            } elseif ($driver === 'pgsql') {
                DB::statement('ALTER TABLE games ALTER COLUMN studio_id DROP NOT NULL');
            } elseif ($driver === 'sqlsrv') {
                DB::statement('ALTER TABLE games ALTER COLUMN studio_id BIGINT NULL');
            }
        } catch (Throwable $e) {
            // Falha silenciosa para não travar deploys; admins podem ajustar manualmente
        }
    }

    public function down(): void
    {
        // Não forçamos voltar para NOT NULL para não quebrar registros existentes
    }
};

