<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        $hasEmail = Schema::hasColumn('studios', 'email');
        $hasPhone = Schema::hasColumn('studios', 'phone');
        if ($hasEmail || $hasPhone) {
            Schema::table('studios', function (Blueprint $table) use ($hasEmail, $hasPhone) {
                if ($hasEmail) {
                    $table->dropColumn('email');
                }
                if ($hasPhone) {
                    $table->dropColumn('phone');
                }
            });
        }
    }

    public function down(): void
    {
        Schema::table('studios', function (Blueprint $table) {
            if (!Schema::hasColumn('studios', 'email')) {
                $table->string('email')->nullable();
            }
            if (!Schema::hasColumn('studios', 'phone')) {
                $table->string('phone')->nullable();
            }
        });
    }
};

