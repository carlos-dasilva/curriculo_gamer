<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_game_infos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('game_id')->constrained('games')->cascadeOnDelete();
            $table->unsignedTinyInteger('score')->nullable(); // 0..10
            $table->unsignedTinyInteger('difficulty')->nullable(); // 0..10
            $table->unsignedInteger('gameplay_hours')->nullable(); // inteiro >= 0
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['user_id','game_id']);
            $table->index(['user_id','game_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_game_infos');
    }
};

