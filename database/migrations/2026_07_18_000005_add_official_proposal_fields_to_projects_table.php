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
            $table->string('responsible_person')->nullable()->after('academic_year');
            $table->string('position')->nullable()->after('responsible_person');
            $table->string('phone')->nullable()->after('position');
            $table->string('email')->nullable()->after('phone');
            $table->string('mission')->nullable()->after('email');
            $table->string('goal')->nullable()->after('mission');
            $table->string('strategy_tactic')->nullable()->after('goal');
            $table->json('outputs')->nullable()->after('objectives');
            $table->json('outcomes')->nullable()->after('outputs');
            $table->string('location')->nullable()->default('ณ วิทยาลัยสารพัดช่างน่าน')->after('targets');
            $table->json('expected_benefits')->nullable()->after('location');
            $table->json('indicators')->nullable()->after('expected_benefits');
            $table->json('action_plan')->nullable()->after('indicators');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn([
                'responsible_person',
                'position',
                'phone',
                'email',
                'mission',
                'goal',
                'strategy_tactic',
                'outputs',
                'outcomes',
                'location',
                'expected_benefits',
                'indicators',
                'action_plan',
            ]);
        });
    }
};
