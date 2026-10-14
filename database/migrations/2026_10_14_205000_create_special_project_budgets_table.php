<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('special_project_budgets')) {
            Schema::create('special_project_budgets', function (Blueprint $table) {
                $table->id();
                $table->string('fiscal_year', 10)->default('2570');
                $table->string('document_number')->nullable()->comment('เลขที่หนังสือแจ้งจัดสรรงบเฉพาะ');
                $table->date('document_date')->nullable()->comment('วันที่หนังสือแจ้งจัดสรร');
                $table->string('title')->comment('ชื่อรายการงบเฉพาะกิจ / โครงการ');
                $table->string('agency_name')->nullable()->comment('หน่วยงานเจ้าของงบ เช่น สอศ., อว., จังหวัด, กสศ., MOU');
                $table->decimal('allocated_amount', 12, 2)->default(0)->comment('วงเงินที่ได้รับจัดสรร');
                $table->decimal('spent_amount', 12, 2)->default(0)->comment('ยอดเบิกจ่ายจริง');
                $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete()->comment('โครงการที่ผูกพัน');
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('description')->nullable()->comment('วัตถุประสงค์ / รายละเอียดเพิ่มเติม');
                $table->timestamps();
            });
        }

        if (Schema::hasTable('projects') && !Schema::hasColumn('projects', 'special_project_budget_id')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->foreignId('special_project_budget_id')->nullable()->constrained('special_project_budgets')->nullOnDelete();
            });
        }

        // Seed Funding Sources for Non-Budget and Special Dedicated Project Budget
        if (Schema::hasTable('funding_sources')) {
            $specialSources = [
                12 => [
                    'id' => 12,
                    'name' => 'ไม่ใช้งบประมาณ',
                    'code' => 'NON_BUDGET',
                    'description' => 'โครงการที่ไม่ใช้งบประมาณ (0.00 บาท)',
                    'fiscal_year' => '2570',
                    'budget_number' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                13 => [
                    'id' => 13,
                    'name' => 'งบเฉพาะโครงการ (จัดสรรเฉพาะกิจ)',
                    'code' => 'SPECIAL_PROJECT',
                    'description' => 'งบประมาณจัดสรรเฉพาะกิจสำหรับโครงการจากส่วนกลาง/ภายนอก',
                    'fiscal_year' => '2570',
                    'budget_number' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ];

            foreach ($specialSources as $id => $data) {
                $exists = DB::table('funding_sources')->where('id', $id)->orWhere('code', $data['code'])->first();
                if ($exists) {
                    DB::table('funding_sources')->where('id', $exists->id)->update([
                        'name' => $data['name'],
                        'code' => $data['code'],
                        'description' => $data['description'],
                    ]);
                } else {
                    DB::table('funding_sources')->insert($data);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('projects') && Schema::hasColumn('projects', 'special_project_budget_id')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->dropForeign(['special_project_budget_id']);
                $table->dropColumn('special_project_budget_id');
            });
        }

        Schema::dropIfExists('special_project_budgets');
        DB::table('funding_sources')->whereIn('code', ['NON_BUDGET', 'SPECIAL_PROJECT'])->delete();
    }
};
