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
        Schema::table('appendices', function (Blueprint $table) {
            $table->string('category')->default('others')->after('title');
            $table->text('caption')->nullable()->after('category');
            $table->string('external_url')->nullable()->after('file_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appendices', function (Blueprint $table) {
            $table->dropColumn(['category', 'caption', 'external_url']);
        });
    }
};
