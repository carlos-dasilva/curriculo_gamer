<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->string('label', 80);
            $table->string('url', 2048);
            $table->timestamps();
            $table->index('game_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_links');
    }
};

