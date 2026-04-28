<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_game_backlogs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('game_id')->constrained('games')->cascadeOnDelete();
            $table->unsignedInteger('position');
            $table->timestamps();

            $table->unique(['user_id', 'game_id']);
            $table->index(['user_id', 'position']);
        });

        if (Schema::hasColumn('users', 'currently_playing_game_id')) {
            $rows = DB::table('users')
                ->whereNotNull('currently_playing_game_id')
                ->get(['id', 'currently_playing_game_id']);

            foreach ($rows as $row) {
                DB::table('user_game_backlogs')->updateOrInsert(
                    [
                        'user_id' => $row->id,
                        'game_id' => $row->currently_playing_game_id,
                    ],
                    [
                        'position' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_game_backlogs');
    }
};
