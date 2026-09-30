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
            if (!Schema::hasColumn('projects', 'chapter_3_sections')) {
                $table->json('chapter_3_sections')->nullable()->after('chapter_2_content');
            }
            if (!Schema::hasColumn('projects', 'chapter_3_content')) {
                $table->longText('chapter_3_content')->nullable()->after('chapter_3_sections');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'chapter_3_content')) {
                $table->dropColumn('chapter_3_content');
            }
            if (Schema::hasColumn('projects', 'chapter_3_sections')) {
                $table->dropColumn('chapter_3_sections');
            }
        });
    }
};
