<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_collection_console_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('console_id');
            $table->foreign('console_id', 'uc_console_image_item_fk')->references('id')->on('user_collection_consoles')->cascadeOnDelete();
            $table->string('url', 2048);
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('description', 255)->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
            $table->index(['console_id', 'sort_order'], 'uc_console_image_order_idx');
        });

        Schema::create('user_collection_game_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id');
            $table->foreign('game_id', 'uc_game_image_item_fk')->references('id')->on('user_collection_games')->cascadeOnDelete();
            $table->string('url', 2048);
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('description', 255)->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
            $table->index(['game_id', 'sort_order'], 'uc_game_image_order_idx');
        });

        Schema::create('user_collection_accessory_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('accessory_id');
            $table->foreign('accessory_id', 'uc_accessory_image_item_fk')->references('id')->on('user_collection_accessories')->cascadeOnDelete();
            $table->string('url', 2048);
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('description', 255)->nullable();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
            $table->index(['accessory_id', 'sort_order'], 'uc_accessory_image_order_idx');
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('user_collection_accessory_images');
        Schema::dropIfExists('user_collection_game_images');
        Schema::dropIfExists('user_collection_console_images');
    }
};
