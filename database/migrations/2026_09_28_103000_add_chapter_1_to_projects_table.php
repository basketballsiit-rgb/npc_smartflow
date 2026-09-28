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
            if (!Schema::hasColumn('projects', 'chapter_1_sections')) {
                $table->json('chapter_1_sections')->nullable()->after('budget_approved_at');
            }
            if (!Schema::hasColumn('projects', 'chapter_1_content')) {
                $table->longText('chapter_1_content')->nullable()->after('chapter_1_sections');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'chapter_1_content')) {
                $table->dropColumn('chapter_1_content');
            }
            if (Schema::hasColumn('projects', 'chapter_1_sections')) {
                $table->dropColumn('chapter_1_sections');
            }
        });
    }
};
