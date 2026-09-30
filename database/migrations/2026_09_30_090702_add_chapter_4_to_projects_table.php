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
            $table->json('chapter_4_sections')->nullable()->after('chapter_3_content');
            $table->longText('chapter_4_content')->nullable()->after('chapter_4_sections');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['chapter_4_sections', 'chapter_4_content']);
        });
    }
};
