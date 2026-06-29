<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chronology_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chronology_id')->constrained('chronologies')->cascadeOnUpdate()->cascadeOnDelete();
            $table->unsignedInteger('position');
            $table->string('title', 160)->nullable();
            $table->timestamps();

            $table->unique(['chronology_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chronology_steps');
    }
};
