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
            if (!Schema::hasColumn('projects', 'preliminary_sections')) {
                $table->json('preliminary_sections')->nullable()->after('chapter_1_sections');
            }
            if (!Schema::hasColumn('projects', 'preliminary_content')) {
                $table->longText('preliminary_content')->nullable()->after('preliminary_sections');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            if (Schema::hasColumn('projects', 'preliminary_content')) {
                $table->dropColumn('preliminary_content');
            }
            if (Schema::hasColumn('projects', 'preliminary_sections')) {
                $table->dropColumn('preliminary_sections');
            }
        });
    }
};
