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
            if (!Schema::hasColumn('procurements', 'department_id')) {
                $table->foreignId('department_id')->nullable()->after('routine_budget_plan_id')->constrained('departments')->nullOnDelete();
            }
            if (!Schema::hasColumn('procurements', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('department_id')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('procurements', 'set_name')) {
                $table->string('set_name')->nullable()->after('created_by');
            }
            if (!Schema::hasColumn('procurements', 'activity_name')) {
                $table->string('activity_name')->nullable()->after('set_name');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('procurements', function (Blueprint $table) {
            if (Schema::hasColumn('procurements', 'department_id')) {
                $table->dropForeign(['department_id']);
                $table->dropColumn('department_id');
            }
            if (Schema::hasColumn('procurements', 'created_by')) {
                $table->dropForeign(['created_by']);
                $table->dropColumn('created_by');
            }
            if (Schema::hasColumn('procurements', 'set_name')) {
                $table->dropColumn('set_name');
            }
            if (Schema::hasColumn('procurements', 'activity_name')) {
                $table->dropColumn('activity_name');
            }
        });
    }
};
