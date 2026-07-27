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
        Schema::create('routine_budget_plans', function (Blueprint $table) {
            $table->id();
            $table->string('fiscal_year');
            $table->foreignId('department_id')->constrained('departments')->onDelete('cascade');
            $table->string('title');
            $table->decimal('allocated_amount', 12, 2);
            $table->decimal('encumbered_amount', 12, 2)->default(0.00);
            $table->decimal('spent_amount', 12, 2)->default(0.00);
            $table->timestamps();
        });

        // Update procurements table to allow nullable project_id and link to routine_budget_plans
        Schema::table('procurements', function (Blueprint $table) {
            // Drop foreign key and unique index
            $table->dropForeign(['project_id']);
            $table->dropUnique(['project_id']);
        });

        Schema::table('procurements', function (Blueprint $table) {
            // Re-add project_id as nullable
            $table->unsignedBigInteger('project_id')->nullable()->change();
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');

            // Add routine_budget_plan_id
            $table->foreignId('routine_budget_plan_id')->nullable()->constrained('routine_budget_plans')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('procurements', function (Blueprint $table) {
            $table->dropForeign(['routine_budget_plan_id']);
            $table->dropColumn('routine_budget_plan_id');

            $table->dropForeign(['project_id']);
        });

        Schema::table('procurements', function (Blueprint $table) {
            $table->unsignedBigInteger('project_id')->change();
            $table->unique('project_id');
            $table->foreign('project_id')->references('id')->on('projects')->onDelete('cascade');
        });

        Schema::dropIfExists('routine_budget_plans');
    }
};
