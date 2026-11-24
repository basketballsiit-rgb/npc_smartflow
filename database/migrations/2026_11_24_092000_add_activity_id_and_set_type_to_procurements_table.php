<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('procurements', function (Blueprint $table) {
            if (!Schema::hasColumn('procurements', 'set_type')) {
                $table->string('set_type', 30)->default('procurement')->after('set_name');
            }
            if (!Schema::hasColumn('procurements', 'activity_id')) {
                $table->string('activity_id', 64)->nullable()->after('activity_name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('procurements', function (Blueprint $table) {
            if (Schema::hasColumn('procurements', 'set_type')) {
                $table->dropColumn('set_type');
            }
            if (Schema::hasColumn('procurements', 'activity_id')) {
                $table->dropColumn('activity_id');
            }
        });
    }
};
