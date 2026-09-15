<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_collection_consoles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->foreign('user_id', 'uc_console_user_id_fk')->references('id')->on('users')->cascadeOnDelete();
            $table->index('user_id', 'uc_console_user_id_idx');
            $table->foreignId('item_status_id');
            $table->foreign('item_status_id', 'uc_console_item_status_id_fk')->references('id')->on('collection_item_statuses')->restrictOnDelete();
            $table->index('item_status_id', 'uc_console_item_status_id_idx');
            $table->date('acquired_at')->nullable();
            $table->string('acquisition_location', 255)->nullable();
            $table->decimal('purchase_price', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('platform_id');
            $table->foreign('platform_id', 'uc_console_platform_id_fk')->references('id')->on('platforms')->restrictOnDelete();
            $table->index('platform_id', 'uc_console_platform_id_idx');
            $table->string('nickname', 255)->nullable();
            $table->string('serial_number', 255)->nullable();
            $table->foreignId('region_id')->nullable();
            $table->foreign('region_id', 'uc_console_region_id_fk')->references('id')->on('collection_regions')->restrictOnDelete();
            $table->index('region_id', 'uc_console_region_id_idx');
            $table->unsignedTinyInteger('aesthetic_condition')->nullable();
            $table->foreignId('functional_state_id')->nullable();
            $table->foreign('functional_state_id', 'uc_console_functional_state_id_fk')->references('id')->on('collection_functional_states')->restrictOnDelete();
            $table->index('functional_state_id', 'uc_console_functional_state_id_idx');
            $table->boolean('has_box')->nullable();
            $table->boolean('box_is_original')->nullable();
            $table->boolean('box_serial_matches')->nullable();
            $table->unsignedTinyInteger('box_condition')->nullable();
            $table->boolean('has_manual')->nullable();
            $table->boolean('has_inserts')->nullable();
            $table->boolean('has_inner_tray')->nullable();
            $table->boolean('has_original_power_supply')->nullable();
            $table->boolean('has_original_video_cable')->nullable();
            $table->boolean('has_other_original_cables')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['user_id', 'deleted_at', 'created_at'], 'uc_console_owner_created_idx');
            $table->index(['user_id', 'platform_id', 'deleted_at'], 'uc_console_owner_platform_idx');
        });

        Schema::create('user_collection_games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->foreign('user_id', 'uc_game_user_id_fk')->references('id')->on('users')->cascadeOnDelete();
            $table->index('user_id', 'uc_game_user_id_idx');
            $table->foreignId('item_status_id');
            $table->foreign('item_status_id', 'uc_game_item_status_id_fk')->references('id')->on('collection_item_statuses')->restrictOnDelete();
            $table->index('item_status_id', 'uc_game_item_status_id_idx');
            $table->date('acquired_at')->nullable();
            $table->string('acquisition_location', 255)->nullable();
            $table->decimal('purchase_price', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('game_id');
            $table->foreign('game_id', 'uc_game_game_id_fk')->references('id')->on('games')->restrictOnDelete();
            $table->index('game_id', 'uc_game_game_id_idx');
            $table->foreignId('platform_id');
            $table->foreign('platform_id', 'uc_game_platform_id_fk')->references('id')->on('platforms')->restrictOnDelete();
            $table->index('platform_id', 'uc_game_platform_id_idx');
            $table->enum('media_type', ['physical', 'digital']);
            $table->foreignId('edition_id')->nullable();
            $table->foreign('edition_id', 'uc_game_edition_id_fk')->references('id')->on('collection_editions')->restrictOnDelete();
            $table->index('edition_id', 'uc_game_edition_id_idx');
            $table->foreignId('region_id')->nullable();
            $table->foreign('region_id', 'uc_game_region_id_fk')->references('id')->on('collection_regions')->restrictOnDelete();
            $table->index('region_id', 'uc_game_region_id_idx');
            $table->foreignId('originality_id')->nullable();
            $table->foreign('originality_id', 'uc_game_originality_id_fk')->references('id')->on('collection_originalities')->restrictOnDelete();
            $table->index('originality_id', 'uc_game_originality_id_idx');
            $table->unsignedTinyInteger('overall_condition')->nullable();
            $table->unsignedTinyInteger('media_condition')->nullable();
            $table->unsignedTinyInteger('box_condition')->nullable();
            $table->unsignedTinyInteger('manual_condition')->nullable();
            $table->unsignedTinyInteger('inserts_condition')->nullable();
            $table->boolean('has_media')->nullable();
            $table->boolean('has_box')->nullable();
            $table->boolean('has_manual')->nullable();
            $table->boolean('has_inserts')->nullable();
            $table->boolean('has_extras')->nullable();
            $table->foreignId('digital_store_id')->nullable();
            $table->foreign('digital_store_id', 'uc_game_digital_store_id_fk')->references('id')->on('collection_digital_stores')->restrictOnDelete();
            $table->index('digital_store_id', 'uc_game_digital_store_id_idx');
            $table->foreignId('acquisition_type_id')->nullable();
            $table->foreign('acquisition_type_id', 'uc_game_acquisition_type_id_fk')->references('id')->on('collection_acquisition_types')->restrictOnDelete();
            $table->index('acquisition_type_id', 'uc_game_acquisition_type_id_idx');
            $table->foreignId('digital_service_id')->nullable();
            $table->foreign('digital_service_id', 'uc_game_digital_service_id_fk')->references('id')->on('collection_digital_services')->restrictOnDelete();
            $table->index('digital_service_id', 'uc_game_digital_service_id_idx');
            $table->foreignId('digital_ownership_type_id')->nullable();
            $table->foreign('digital_ownership_type_id', 'uc_game_digital_ownership_type_id_fk')->references('id')->on('collection_digital_ownership_types')->restrictOnDelete();
            $table->index('digital_ownership_type_id', 'uc_game_digital_ownership_type_id_idx');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['user_id', 'deleted_at', 'created_at'], 'uc_game_owner_created_idx');
            $table->index(['user_id', 'platform_id', 'deleted_at'], 'uc_game_owner_platform_idx');
            $table->index(['user_id', 'media_type', 'digital_store_id'], 'uc_game_owner_store_idx');
        });

        Schema::create('user_collection_accessories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->foreign('user_id', 'uc_accessory_user_id_fk')->references('id')->on('users')->cascadeOnDelete();
            $table->index('user_id', 'uc_accessory_user_id_idx');
            $table->foreignId('item_status_id');
            $table->foreign('item_status_id', 'uc_accessory_item_status_id_fk')->references('id')->on('collection_item_statuses')->restrictOnDelete();
            $table->index('item_status_id', 'uc_accessory_item_status_id_idx');
            $table->date('acquired_at')->nullable();
            $table->string('acquisition_location', 255)->nullable();
            $table->decimal('purchase_price', 12, 2)->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('accessory_type_id');
            $table->foreign('accessory_type_id', 'uc_accessory_accessory_type_id_fk')->references('id')->on('collection_accessory_types')->restrictOnDelete();
            $table->index('accessory_type_id', 'uc_accessory_accessory_type_id_idx');
            $table->string('name', 255);
            $table->string('model', 255)->nullable();
            $table->foreignId('manufacturer_id')->nullable();
            $table->foreign('manufacturer_id', 'uc_accessory_manufacturer_id_fk')->references('id')->on('collection_companies')->restrictOnDelete();
            $table->index('manufacturer_id', 'uc_accessory_manufacturer_id_idx');
            $table->unsignedInteger('quantity')->default(1);
            $table->foreignId('collection_console_id')->nullable();
            $table->foreign('collection_console_id', 'uc_accessory_collection_console_id_fk')->references('id')->on('user_collection_consoles')->nullOnDelete();
            $table->index('collection_console_id', 'uc_accessory_collection_console_id_idx');
            $table->foreignId('classification_id')->nullable();
            $table->foreign('classification_id', 'uc_accessory_classification_id_fk')->references('id')->on('collection_accessory_classifications')->restrictOnDelete();
            $table->index('classification_id', 'uc_accessory_classification_id_idx');
            $table->enum('connection_type', ['wired', 'wireless', 'both', 'unknown'])->default('unknown');
            $table->string('color', 255)->nullable();
            $table->string('serial_number', 255)->nullable();
            $table->unsignedTinyInteger('condition')->nullable();
            $table->boolean('has_box')->nullable();
            $table->boolean('box_is_original')->nullable();
            $table->unsignedTinyInteger('box_condition')->nullable();
            $table->boolean('has_manual')->nullable();
            $table->boolean('has_original_items')->nullable();
            $table->boolean('has_original_cables')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['user_id', 'deleted_at', 'created_at'], 'uc_accessory_owner_created_idx');
            $table->index(['user_id', 'accessory_type_id'], 'uc_accessory_owner_type_idx');
        });

        Schema::create('user_collection_accessory_platform', function (Blueprint $table) {
            $table->foreignId('accessory_id');
            $table->foreign('accessory_id', 'uc_accessory_platform_accessory_fk')->references('id')->on('user_collection_accessories')->cascadeOnDelete();
            $table->foreignId('platform_id');
            $table->foreign('platform_id', 'uc_accessory_platform_platform_fk')->references('id')->on('platforms')->restrictOnDelete();
            $table->primary(['accessory_id', 'platform_id'], 'uc_accessory_platform_pk');
            $table->index(['platform_id', 'accessory_id'], 'uc_platform_accessory_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_collection_accessory_platform');
        Schema::dropIfExists('user_collection_accessories');
        Schema::dropIfExists('user_collection_games');
        Schema::dropIfExists('user_collection_consoles');
    }
};
