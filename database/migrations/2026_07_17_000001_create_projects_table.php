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
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('department_id')->constrained('departments');
            $table->string('title');
            $table->integer('academic_year');
            $table->text('background_rationale');
            $table->json('objectives')->nullable(); // list of text objectives
            $table->json('targets')->nullable(); // quantitative and qualitative targets
            $table->foreignId('iqa_strategy_id')->constrained('iqa_strategies');
            $table->foreignId('ovec_strategy_id')->constrained('ovec_strategies');
            $table->decimal('estimated_budget', 12, 2);
            $table->string('status')->default('draft'); // draft, submitted, pending_approval, approved, rejected
            $table->integer('current_approval_step')->default(1); // 1 to 6
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();
        });

        Schema::create('project_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users'); // approver
            $table->integer('step_number'); // 1 to 6
            $table->string('status'); // approved, rejected, referred_back
            $table->text('comments')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_approvals');
        Schema::dropIfExists('projects');
    }
};
