<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'currently_playing_game_id')) {
                $table->foreignId('currently_playing_game_id')
                    ->nullable()
                    ->constrained('games')
                    ->nullOnDelete()
                    ->after('remember_token');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'currently_playing_game_id')) {
                $table->dropForeign(['currently_playing_game_id']);
                $table->dropColumn('currently_playing_game_id');
            }
        });
    }
};

