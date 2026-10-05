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
            if (!Schema::hasColumn('projects', 'chapter_5_sections')) {
                $table->json('chapter_5_sections')->nullable()->after('chapter_4_content');
            }
            if (!Schema::hasColumn('projects', 'chapter_5_content')) {
                $table->longText('chapter_5_content')->nullable()->after('chapter_5_sections');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'chapter_5_content')) {
                $table->dropColumn('chapter_5_content');
            }
            if (Schema::hasColumn('projects', 'chapter_5_sections')) {
                $table->dropColumn('chapter_5_sections');
            }
        });
    }
};
