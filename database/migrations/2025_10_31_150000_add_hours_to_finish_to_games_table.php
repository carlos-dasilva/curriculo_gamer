<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            if (!Schema::hasColumn('games', 'hours_to_finish')) {
                $table->unsignedInteger('hours_to_finish')->nullable()->after('gameplay_hours');
            }
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            if (Schema::hasColumn('games', 'hours_to_finish')) {
                $table->dropColumn('hours_to_finish');
            }
        });
    }
};

