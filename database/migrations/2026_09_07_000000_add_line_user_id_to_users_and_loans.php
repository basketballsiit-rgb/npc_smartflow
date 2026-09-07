<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users') && !Schema::hasColumn('users', 'line_user_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('line_user_id')->nullable()->after('email');
            });
        }

        if (Schema::hasTable('travel_loans') && !Schema::hasColumn('travel_loans', 'borrower_line_user_id')) {
            Schema::table('travel_loans', function (Blueprint $table) {
                $table->string('borrower_line_user_id')->nullable()->after('borrower_name');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'line_user_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('line_user_id');
            });
        }

        if (Schema::hasTable('travel_loans') && Schema::hasColumn('travel_loans', 'borrower_line_user_id')) {
            Schema::table('travel_loans', function (Blueprint $table) {
                $table->dropColumn('borrower_line_user_id');
            });
        }
    }
};
