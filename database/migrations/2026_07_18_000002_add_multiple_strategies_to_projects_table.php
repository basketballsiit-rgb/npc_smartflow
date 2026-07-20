<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->json('iqa_strategy_ids')->nullable()->after('iqa_strategy_id');
            $table->json('ovec_strategy_ids')->nullable()->after('ovec_strategy_id');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['iqa_strategy_ids', 'ovec_strategy_ids']);
        });
    }
};
