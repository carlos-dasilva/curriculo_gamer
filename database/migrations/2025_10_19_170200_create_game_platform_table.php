<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_platform', function (Blueprint $table) {
            $table->foreignId('game_id')->constrained()->cascadeOnDelete();
            $table->foreignId('platform_id')->constrained()->cascadeOnDelete();
            $table->date('release_date')->nullable();
            $table->primary(['game_id','platform_id']);
            $table->index('release_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_platform');
    }
};

