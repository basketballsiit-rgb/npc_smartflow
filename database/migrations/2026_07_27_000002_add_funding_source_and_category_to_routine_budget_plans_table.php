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
        Schema::table('routine_budget_plans', function (Blueprint $table) {
            $table->foreignId('funding_source_id')->nullable()->constrained('funding_sources')->onDelete('set null');
            $table->string('report_category')->nullable(); // e.g. '1.1', '2.2.1', '5.1'
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('routine_budget_plans', function (Blueprint $table) {
            $table->dropForeign(['funding_source_id']);
            $table->dropColumn(['funding_source_id', 'report_category']);
        });
    }
};
