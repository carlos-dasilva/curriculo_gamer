<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            if (!Schema::hasColumn('games', 'status')) {
                $table->string('status', 20)->default('avaliacao')->after('cover_url');
                $table->index('status');
            }
            if (!Schema::hasColumn('games', 'released_by')) {
                $table->foreignId('released_by')->nullable()->after('status')->constrained('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            if (Schema::hasColumn('games', 'released_by')) {
                $table->dropConstrainedForeignId('released_by');
            }
            if (Schema::hasColumn('games', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};

