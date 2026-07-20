<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('national_strategies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('provincial_strategies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->json('national_strategy_ids')->nullable()->after('ovec_strategy_ids');
            $table->json('provincial_strategy_ids')->nullable()->after('national_strategy_ids');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['national_strategy_ids', 'provincial_strategy_ids']);
        });

        Schema::dropIfExists('provincial_strategies');
        Schema::dropIfExists('national_strategies');
    }
};
