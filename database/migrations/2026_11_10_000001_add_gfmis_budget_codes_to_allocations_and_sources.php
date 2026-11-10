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
        // 1. Add GFMIS budget codes to central_allocations table
        if (Schema::hasTable('central_allocations')) {
            Schema::table('central_allocations', function (Blueprint $table) {
                if (!Schema::hasColumn('central_allocations', 'activity_code')) {
                    $table->string('activity_code', 30)->nullable()->after('budget_code');
                }
                if (!Schema::hasColumn('central_allocations', 'sub_account_code')) {
                    $table->string('sub_account_code', 20)->nullable()->after('activity_code');
                }
            });
        }

        // 2. Add GFMIS budget codes to funding_sources table
        if (Schema::hasTable('funding_sources')) {
            Schema::table('funding_sources', function (Blueprint $table) {
                if (!Schema::hasColumn('funding_sources', 'budget_code')) {
                    $table->string('budget_code', 50)->nullable()->after('budget_number');
                }
                if (!Schema::hasColumn('funding_sources', 'activity_code')) {
                    $table->string('activity_code', 30)->nullable()->after('budget_code');
                }
                if (!Schema::hasColumn('funding_sources', 'sub_account_code')) {
                    $table->string('sub_account_code', 20)->nullable()->after('activity_code');
                }
            });
        }

        // 3. Add GFMIS budget codes to travel_loans table for finance tracking
        if (Schema::hasTable('travel_loans')) {
            Schema::table('travel_loans', function (Blueprint $table) {
                if (!Schema::hasColumn('travel_loans', 'budget_code')) {
                    $table->string('budget_code', 50)->nullable()->after('funding_source_id');
                }
                if (!Schema::hasColumn('travel_loans', 'activity_code')) {
                    $table->string('activity_code', 30)->nullable()->after('budget_code');
                }
                if (!Schema::hasColumn('travel_loans', 'sub_account_code')) {
                    $table->string('sub_account_code', 20)->nullable()->after('activity_code');
                }
            });
        }

        // 4. Add GFMIS budget codes to procurements table for finance tracking
        if (Schema::hasTable('procurements')) {
            Schema::table('procurements', function (Blueprint $table) {
                if (!Schema::hasColumn('procurements', 'budget_code')) {
                    $table->string('budget_code', 50)->nullable();
                }
                if (!Schema::hasColumn('procurements', 'activity_code')) {
                    $table->string('activity_code', 30)->nullable();
                }
                if (!Schema::hasColumn('procurements', 'sub_account_code')) {
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
        if (Schema::hasTable('central_allocations')) {
            Schema::table('central_allocations', function (Blueprint $table) {
                $table->dropColumn(['activity_code', 'sub_account_code']);
            });
        }

        if (Schema::hasTable('funding_sources')) {
            Schema::table('funding_sources', function (Blueprint $table) {
                $table->dropColumn(['budget_code', 'activity_code', 'sub_account_code']);
            });
        }

        if (Schema::hasTable('travel_loans')) {
            Schema::table('travel_loans', function (Blueprint $table) {
                $table->dropColumn(['budget_code', 'activity_code', 'sub_account_code']);
            });
        }

        if (Schema::hasTable('procurements')) {
            Schema::table('procurements', function (Blueprint $table) {
                $table->dropColumn(['budget_code', 'activity_code', 'sub_account_code']);
            });
        }
    }
};
