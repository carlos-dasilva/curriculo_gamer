<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            if (!Schema::hasColumn('games', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('released_by')->constrained('users')->nullOnDelete();
                $table->index('created_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            if (Schema::hasColumn('games', 'created_by')) {
                $table->dropConstrainedForeignId('created_by');
            }
        });
    }
};

