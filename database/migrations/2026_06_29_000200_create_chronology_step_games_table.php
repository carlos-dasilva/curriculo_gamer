<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chronology_step_games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chronology_step_id')->constrained('chronology_steps')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('game_id')->constrained('games')->cascadeOnUpdate()->restrictOnDelete();
            $table->unsignedInteger('position');
            $table->timestamps();

            $table->unique(['chronology_step_id', 'game_id']);
            $table->unique(['chronology_step_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chronology_step_games');
    }
};
