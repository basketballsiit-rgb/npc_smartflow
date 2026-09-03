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
        if (!Schema::hasTable('standard_items')) {
            Schema::create('standard_items', function (Blueprint $table) {
                $table->id();
                $table->string('name')->index();
                $table->string('unit')->default('ชิ้น');
                $table->decimal('standard_price', 12, 2)->default(0);
                $table->string('category')->nullable()->default('วัสดุทั่วไป');
                $table->integer('usage_count')->default(1);
                $table->timestamps();
            });
        }

        // Seed initial official vocational college items
        $initialItems = [
            ['name' => 'กระดาษถ่ายเอกสาร 80 g 500 แผ่น A4 ดับเบิ้ลเอ', 'unit' => 'รีม', 'standard_price' => 145.00, 'category' => 'วัสดุสำนักงาน'],
            ['name' => 'ลวดเสียบกระดาษ เบอร์ 00', 'unit' => 'กล่อง', 'standard_price' => 12.00, 'category' => 'วัสดุสำนักงาน'],
            ['name' => 'ลวดเสียบกระดาษ เบอร์ 1 กลม', 'unit' => 'กล่อง', 'standard_price' => 10.00, 'category' => 'วัสดุสำนักงาน'],
            ['name' => 'หมึกเติมปริ้นเตอร์ epson 003 สีดำ', 'unit' => 'ขวด', 'standard_price' => 450.00, 'category' => 'วัสดุคอมพิวเตอร์'],
            ['name' => 'หมึกเติมปริ้นเตอร์ epson 003 สีแดง', 'unit' => 'ขวด', 'standard_price' => 450.00, 'category' => 'วัสดุคอมพิวเตอร์'],
            ['name' => 'หมึกเติมปริ้นเตอร์ epson 003 สีเหลือง', 'unit' => 'ขวด', 'standard_price' => 450.00, 'category' => 'วัสดุคอมพิวเตอร์'],
            ['name' => 'หมึกเติมปริ้นเตอร์ epson 003 สีน้ำเงิน', 'unit' => 'ขวด', 'standard_price' => 450.00, 'category' => 'วัสดุคอมพิวเตอร์'],
            ['name' => 'ปากกา ดับเบิ้ลเอ สีแดง', 'unit' => 'ด้าม', 'standard_price' => 12.00, 'category' => 'วัสดุสำนักงาน'],
            ['name' => 'ปากกา ดับเบิ้ลเอ สีน้ำเงิน', 'unit' => 'ด้าม', 'standard_price' => 12.00, 'category' => 'วัสดุสำนักงาน'],
            ['name' => 'ปากกา ดับเบิ้ลเอ สีดำ', 'unit' => 'ด้าม', 'standard_price' => 12.00, 'category' => 'วัสดุสำนักงาน'],
            ['name' => 'แฟ้มเอกสาร 2 นิ้ว ตราช้าง 2101F', 'unit' => 'เล่ม', 'standard_price' => 65.00, 'category' => 'วัสดุสำนักงาน'],
            ['name' => 'คลิปหนีบกระดาษ เบอร์ 108', 'unit' => 'กล่อง', 'standard_price' => 45.00, 'category' => 'วัสดุสำนักงาน'],
            ['name' => 'เทปใส 3/4 นิ้ว x 36 หลา หลุยส์', 'unit' => 'ม้วน', 'standard_price' => 18.00, 'category' => 'วัสดุสำนักงาน'],
            ['name' => 'น้ำยาลบคำผิดพร้อมหัวปากกา Pentel', 'unit' => 'ขวด', 'standard_price' => 45.00, 'category' => 'วัสดุสำนักงาน'],
            ['name' => 'แผ่นรองตัดขนาด A3', 'unit' => 'แผ่น', 'standard_price' => 120.00, 'category' => 'วัสดุการศึกษา'],
            ['name' => 'กระดาษการ์ดขาว 180 แกรม A4', 'unit' => 'แพ็ค', 'standard_price' => 95.00, 'category' => 'วัสดุการศึกษา'],
            ['name' => 'ชุดฝึกปฏิบัติการเขียนแบบพื้นฐาน', 'unit' => 'ชุด', 'standard_price' => 450.00, 'category' => 'วัสดุฝึก'],
        ];

        foreach ($initialItems as $item) {
            DB::table('standard_items')->updateOrInsert(
                ['name' => $item['name']],
                [
                    'unit' => $item['unit'],
                    'standard_price' => $item['standard_price'],
                    'category' => $item['category'],
                    'usage_count' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }

        // Also harvest existing items from procurement_items
        if (Schema::hasTable('procurement_items')) {
            $existingProcItems = DB::table('procurement_items')
                ->whereNotNull('description')
                ->where('description', '!=', '')
                ->select('description', 'unit', 'unit_price')
                ->get();

            foreach ($existingProcItems as $pItem) {
                $cleanName = preg_replace('/[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/u', '', $pItem->description);
                $cleanName = trim(str_replace(['💵', '📦', '💰', '📑', '📝', '🛒', '📄', '📊'], '', $cleanName));
                if (strlen($cleanName) > 2) {
                    DB::table('standard_items')->updateOrInsert(
                        ['name' => $cleanName],
                        [
                            'unit' => $pItem->unit ?: 'ชิ้น',
                            'standard_price' => $pItem->unit_price ?: 0,
                            'category' => 'วัสดุทั่วไป',
                            'usage_count' => DB::raw('usage_count + 1'),
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]
                    );
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('standard_items');
    }
};
