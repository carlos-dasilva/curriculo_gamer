<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_game_platform_statuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('game_id')->constrained('games')->cascadeOnDelete();
            $table->foreignId('platform_id')->constrained('platforms')->cascadeOnDelete();
            $table->string('status', 30); // nao_joguei, quero_jogar, joguei, finalizei, cem_por_cento
            $table->timestamps();

            $table->unique(['user_id','game_id','platform_id'], 'ugps_unique');
            $table->index(['user_id','game_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_game_platform_statuses');
    }
};

