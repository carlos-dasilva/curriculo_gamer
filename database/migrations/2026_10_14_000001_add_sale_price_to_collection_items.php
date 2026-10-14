<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['user_collection_consoles', 'user_collection_games', 'user_collection_accessories'] as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->decimal('sale_price', 12, 2)->nullable();
            });
        }
    }

    public function down(): void
    {
        foreach (['user_collection_consoles', 'user_collection_games', 'user_collection_accessories'] as $table) {
            Schema::table($table, fn (Blueprint $table) => $table->dropColumn('sale_price'));
        }
    }
};
