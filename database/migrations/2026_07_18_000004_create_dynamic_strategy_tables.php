<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('strategy_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('order_index')->default(0);
            $table->timestamps();
        });

        Schema::create('strategy_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('strategy_category_id')->constrained('strategy_categories')->onDelete('cascade');
            $table->string('name');
            $table->string('code')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('order_index')->default(0);
            $table->timestamps();
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->json('strategy_selections')->nullable()->after('provincial_strategy_ids');
        });
    }

    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('strategy_selections');
        });

        Schema::dropIfExists('strategy_items');
        Schema::dropIfExists('strategy_categories');
    }
};
