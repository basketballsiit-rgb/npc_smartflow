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
        Schema::create('procurements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->unique()->constrained('projects')->onDelete('cascade');
            $table->string('procurement_number')->unique()->nullable();
            $table->date('memo_date')->nullable();
            $table->string('memo_subject')->nullable();
            $table->text('tor_specifications')->nullable();
            $table->string('status')->default('pending'); // pending, processing, completed
            $table->timestamps();
        });

        Schema::create('procurement_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('procurement_id')->constrained('procurements')->onDelete('cascade');
            $table->string('description');
            $table->decimal('quantity', 10, 2);
            $table->string('unit');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('total_price', 12, 2);
            $table->timestamps();
        });

        Schema::create('procurement_committees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('procurement_id')->constrained('procurements')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('committee_type'); // purchasing, inspection
            $table->string('role')->default('member'); // chairperson, member, secretary
            $table->timestamps();

            // Prevent duplicate membership in the same committee type for a procurement process
            $table->unique(['procurement_id', 'user_id', 'committee_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('procurement_committees');
        Schema::dropIfExists('procurement_items');
        Schema::dropIfExists('procurements');
    }
};
