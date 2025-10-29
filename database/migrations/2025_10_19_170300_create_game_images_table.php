<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->string('url', 2048);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->index(['game_id','sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_images');
    }
};

