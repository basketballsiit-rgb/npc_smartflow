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
        Schema::table('projects', function (Blueprint $table) {
            if (!Schema::hasColumn('projects', 'approved_budget')) {
                $table->decimal('approved_budget', 12, 2)->nullable()->after('proposed_budget');
            }
            if (!Schema::hasColumn('projects', 'allocation_status')) {
                $table->string('allocation_status', 50)->default('pending_review')->after('status');
            }
            if (!Schema::hasColumn('projects', 'committee_feedback')) {
                $table->text('committee_feedback')->nullable()->after('committee_comment');
            }
            if (!Schema::hasColumn('projects', 'budget_adjustment_reason')) {
                $table->text('budget_adjustment_reason')->nullable()->after('committee_feedback');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn([
                'approved_budget',
                'allocation_status',
                'committee_feedback',
                'budget_adjustment_reason',
            ]);
        });
    }
};
