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
        Schema::create('funding_sources', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('code')->unique()->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('funding_source_id')->constrained('funding_sources');
            $table->decimal('allocated_amount', 12, 2);
            $table->decimal('encumbered_amount', 12, 2)->default(0.00);
            $table->decimal('spent_amount', 12, 2)->default(0.00);
            $table->boolean('is_advance_payment')->default(false);
            $table->timestamp('advance_cleared_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('budgets');
        Schema::dropIfExists('funding_sources');
    }
};
