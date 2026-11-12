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
        // 1. Ensure central_allocations has budget_code, activity_code, sub_account_code
        if (Schema::hasTable('central_allocations')) {
            Schema::table('central_allocations', function (Blueprint $table) {
                if (!Schema::hasColumn('central_allocations', 'budget_code')) {
                    $table->string('budget_code', 100)->nullable();
                }
                if (!Schema::hasColumn('central_allocations', 'activity_code')) {
                    $table->string('activity_code', 30)->nullable();
                }
                if (!Schema::hasColumn('central_allocations', 'sub_account_code')) {
                    $table->string('sub_account_code', 20)->nullable();
                }
            });
        }

        // 2. Ensure funding_sources has budget_code, activity_code, sub_account_code
        if (Schema::hasTable('funding_sources')) {
            Schema::table('funding_sources', function (Blueprint $table) {
                if (!Schema::hasColumn('funding_sources', 'budget_code')) {
                    $table->string('budget_code', 50)->nullable();
                }
                if (!Schema::hasColumn('funding_sources', 'activity_code')) {
                    $table->string('activity_code', 30)->nullable();
                }
                if (!Schema::hasColumn('funding_sources', 'sub_account_code')) {
                    $table->string('sub_account_code', 20)->nullable();
                }
            });
        }

        // 3. Ensure travel_loans has budget_code, activity_code, sub_account_code
        if (Schema::hasTable('travel_loans')) {
            Schema::table('travel_loans', function (Blueprint $table) {
                if (!Schema::hasColumn('travel_loans', 'budget_code')) {
                    $table->string('budget_code', 50)->nullable();
                }
                if (!Schema::hasColumn('travel_loans', 'activity_code')) {
                    $table->string('activity_code', 30)->nullable();
                }
                if (!Schema::hasColumn('travel_loans', 'sub_account_code')) {
                    $table->string('sub_account_code', 20)->nullable();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Keep columns safe
    }
};
