<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('studio_id')->constrained()->cascadeOnUpdate()->restrictOnDelete();
            $table->string('name', 255);
            $table->string('cover_url', 2048)->nullable();
            $table->string('age_rating', 50)->nullable();
            $table->text('description')->nullable();
            $table->unsignedTinyInteger('metacritic_metascore')->nullable(); // 0-100
            $table->decimal('metacritic_user_score', 4, 2)->nullable();     // 0.00-10.00
            $table->decimal('overall_score', 4, 2)->nullable();              // 0.00-10.00
            $table->decimal('difficulty', 4, 2)->nullable();                 // 0.00-10.00
            $table->decimal('gameplay_hours', 6, 1)->nullable();             // e.g., 1234.5
            $table->boolean('ptbr_subtitled')->default(false);
            $table->boolean('ptbr_dubbed')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['studio_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('games');
    }
};
