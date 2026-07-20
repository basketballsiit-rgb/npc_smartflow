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
        Schema::create('surveys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->unique()->constrained('projects')->onDelete('cascade');
            $table->string('survey_code')->unique(); // unique code for QR codes / links
            $table->string('title');
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('survey_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('survey_id')->constrained('surveys')->onDelete('cascade');
            $table->string('respondent_name')->nullable();
            $table->string('respondent_type'); // student, teacher, staff, parent
            $table->integer('rating_q1'); // 1-5
            $table->integer('rating_q2'); // 1-5
            $table->integer('rating_q3'); // 1-5
            $table->integer('rating_q4'); // 1-5
            $table->integer('rating_q5'); // 1-5
            $table->text('comments')->nullable();
            $table->boolean('include_in_report')->default(false); // flagged by teacher for final PDF report
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('survey_responses');
        Schema::dropIfExists('surveys');
    }
};
