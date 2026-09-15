<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collection_regions', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('slug', 150)->unique();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('collection_originalities', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('slug', 150)->unique();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('collection_editions', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('slug', 150)->unique();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('collection_functional_states', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('slug', 150)->unique();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('collection_accessory_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('slug', 150)->unique();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('collection_accessory_classifications', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('slug', 150)->unique();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('collection_acquisition_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('slug', 150)->unique();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('collection_digital_services', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('slug', 150)->unique();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('collection_digital_ownership_types', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('slug', 150)->unique();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('collection_item_statuses', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('slug', 150)->unique();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('collection_digital_stores', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('slug', 150)->unique();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('logo_url', 2048)->nullable();
            $table->string('icon_url', 2048)->nullable();
            $table->string('color', 7)->nullable();
            $table->string('website_url', 2048)->nullable();
            $table->timestamps();
        });

        Schema::create('collection_companies', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('slug', 150)->unique();
            $table->string('website_url', 2048)->nullable();
            $table->string('logo_url', 2048)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('collection_platform_companies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->unique()->constrained('platforms')->cascadeOnDelete();
            $table->foreignId('company_id')->constrained('collection_companies')->restrictOnDelete();
            $table->timestamps();
            $table->index(['company_id', 'platform_id'], 'collection_company_platform_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('collection_platform_companies');
        Schema::dropIfExists('collection_companies');
        Schema::dropIfExists('collection_digital_stores');
        Schema::dropIfExists('collection_item_statuses');
        Schema::dropIfExists('collection_digital_ownership_types');
        Schema::dropIfExists('collection_digital_services');
        Schema::dropIfExists('collection_acquisition_types');
        Schema::dropIfExists('collection_accessory_classifications');
        Schema::dropIfExists('collection_accessory_types');
        Schema::dropIfExists('collection_functional_states');
        Schema::dropIfExists('collection_editions');
        Schema::dropIfExists('collection_originalities');
        Schema::dropIfExists('collection_regions');
    }
};
