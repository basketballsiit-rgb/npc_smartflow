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
            $table->decimal('proposed_budget', 15, 2)->nullable()->after('estimated_budget');
            $table->decimal('allocated_budget', 15, 2)->nullable()->after('proposed_budget');
            $table->foreignId('funding_source_id')->nullable()->after('allocated_budget')->constrained('funding_sources')->onDelete('set null');
            $table->string('report_category')->nullable()->after('funding_source_id'); // e.g. '6.1', '6.2', '6.3', '6.4'
            $table->text('committee_comment')->nullable()->after('report_category');
            $table->timestamp('budget_approved_at')->nullable()->after('committee_comment');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropForeign(['funding_source_id']);
            $table->dropColumn([
                'proposed_budget',
                'allocated_budget',
                'funding_source_id',
                'report_category',
                'committee_comment',
                'budget_approved_at',
            ]);
        });
    }
};
