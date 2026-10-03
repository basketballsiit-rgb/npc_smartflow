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
            $table->dateTime('sealed_at')->nullable()->after('budget_approved_at');
            $table->string('digital_seal_hash', 64)->nullable()->after('sealed_at');
            $table->string('verification_code', 50)->nullable()->unique()->after('digital_seal_hash');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['sealed_at', 'digital_seal_hash', 'verification_code']);
        });
    }
};
