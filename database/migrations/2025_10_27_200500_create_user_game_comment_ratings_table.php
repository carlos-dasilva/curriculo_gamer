<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_game_comment_ratings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained('games')->cascadeOnDelete();
            // Autor do comentário (usuário que possui o notes em user_game_infos)
            $table->foreignId('comment_user_id')->constrained('users')->cascadeOnDelete();
            // Usuário que avaliou o comentário
            $table->foreignId('rated_by_user_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedTinyInteger('rating'); // 1..5
            $table->timestamps();

            $table->unique(['game_id', 'comment_user_id', 'rated_by_user_id'], 'ugc_ratings_unique');
            $table->index(['game_id', 'comment_user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_game_comment_ratings');
    }
};

