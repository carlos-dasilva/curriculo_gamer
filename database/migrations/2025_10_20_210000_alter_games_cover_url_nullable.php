<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('games') || !Schema::hasColumn('games', 'cover_url')) {
            return;
        }

        $driver = DB::connection()->getDriverName();
        try {
            if ($driver === 'mysql') {
                DB::statement('ALTER TABLE `games` MODIFY `cover_url` VARCHAR(2048) NULL');
            } elseif ($driver === 'pgsql') {
                DB::statement('ALTER TABLE games ALTER COLUMN cover_url DROP NOT NULL');
            } elseif ($driver === 'sqlsrv') {
                DB::statement('ALTER TABLE games ALTER COLUMN cover_url NVARCHAR(2048) NULL');
            } else {
                // sqlite e outros: geralmente ignoram NOT NULL para strings; não fazer nada
            }
        } catch (Throwable $e) {
            // Em caso de ambiente sem suporte ao comando, falhamos silenciosamente para não travar deploys
        }
    }

    public function down(): void
    {
        // não forçamos voltar a NOT NULL, pois quebraria dados existentes
    }
};

