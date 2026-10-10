<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Department;

return new class extends Migration
{
    public function up(): void
    {
        // Ensure main divisions and planning sub-department have accurate codes
        DB::table('departments')->where('name', 'ฝ่ายบริหารทรัพยากร')->update(['code' => 'RESOURCE']);
        DB::table('departments')->where('name', 'ฝ่ายยุทธศาสตร์และแผนงาน')->update(['code' => 'STRATEGY_PLAN']);
        DB::table('departments')->where('name', 'like', '%พัฒนายุทธศาสตร์แผนงาน%')->update(['code' => 'PLAN']);
    }

    public function down(): void
    {
        //
    }
};
