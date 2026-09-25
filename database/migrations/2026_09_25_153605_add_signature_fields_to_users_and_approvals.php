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
        Schema::table('users', function (Blueprint $table) {
            $table->longText('signature_data')->nullable()->after('citizen_id')->comment('Encrypted base64 signature image or data');
            $table->timestamp('signature_updated_at')->nullable()->after('signature_data');
        });

        Schema::table('project_approvals', function (Blueprint $table) {
            $table->longText('signature_data')->nullable()->after('comments')->comment('Encrypted base64 digital signature at time of signing');
            $table->string('signature_type')->nullable()->after('signature_data')->comment('stored, live, upload, admin');
            $table->string('signature_hash', 64)->nullable()->after('signature_type')->comment('SHA256 digital verification hash');
            $table->string('ip_address', 45)->nullable()->after('signature_hash');
            $table->text('user_agent')->nullable()->after('ip_address');
            $table->timestamp('signed_at')->nullable()->after('user_agent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_approvals', function (Blueprint $table) {
            $table->dropColumn([
                'signature_data',
                'signature_type',
                'signature_hash',
                'ip_address',
                'user_agent',
                'signed_at',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'signature_data',
                'signature_updated_at',
            ]);
        });
    }
};
