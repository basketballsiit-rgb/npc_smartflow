<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('travel_loans') && !Schema::hasColumn('travel_loans', 'budget_category')) {
            Schema::table('travel_loans', function (Blueprint $table) {
                $table->string('budget_category', 50)
                    ->default('in_budget')
                    ->after('funding_source_id')
                    ->comment('in_budget = เงินในระบบ, off_budget = เงินนอกระบบ (งบ บกศ.)');
            });

            // Update existing rows based on funding source if applicable
            DB::table('travel_loans')
                ->where('funding_source_id', 11)
                ->update(['budget_category' => 'off_budget']);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('travel_loans') && Schema::hasColumn('travel_loans', 'budget_category')) {
            Schema::table('travel_loans', function (Blueprint $table) {
                $table->dropColumn('budget_category');
            });
        }
    }
};
