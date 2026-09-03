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
        // 1. Create vendors table for Procurement Department
        if (!Schema::hasTable('vendors')) {
            Schema::create('vendors', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('tax_id', 20)->nullable();
                $table->string('bank_name')->nullable();
                $table->string('bank_account_number', 50)->nullable();
                $table->string('bank_account_name')->nullable();
                $table->text('address')->nullable();
                $table->string('phone', 50)->nullable();
                $table->string('contact_person')->nullable();
                $table->string('category')->nullable();
                $table->timestamps();
            });

            // Seed standard Nan vocational vendors
            DB::table('vendors')->insert([
                [
                    'name' => 'ห้างหุ้นส่วนจำกัด น่านศึกษาภัณฑ์',
                    'tax_id' => '0543542001234',
                    'bank_name' => 'ธนาคารกรุงไทย',
                    'bank_account_number' => '507-1-23456-7',
                    'bank_account_name' => 'หจก. น่านศึกษาภัณฑ์',
                    'address' => '124/5 ถ.สุมนเทวราช ต.ในเวียง อ.เมืองน่าน จ.น่าน 55000',
                    'phone' => '054-710234',
                    'contact_person' => 'คุณสมชาย ศึกษาการ',
                    'category' => 'เครื่องเขียน สื่อการสอน แบบเรียน อุปกรณ์สำนักงาน',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'บริษัท น่านไอที คอมพิวเตอร์ แอนด์ เซอร์วิส จำกัด',
                    'tax_id' => '0545558005678',
                    'bank_name' => 'ธนาคารกสิกรไทย',
                    'bank_account_number' => '114-2-98765-4',
                    'bank_account_name' => 'บจก. น่านไอที คอมพิวเตอร์ แอนด์ เซอร์วิส',
                    'address' => '88/12 ถ.อนันตวรฤทธิเดช ต.ในเวียง อ.เมืองน่าน จ.น่าน 55000',
                    'phone' => '054-771890',
                    'contact_person' => 'คุณวิชัย เทคโนโลยี',
                    'category' => 'อุปกรณ์คอมพิวเตอร์ ไอที เครื่องพิมพ์ โทเนอร์ ซอฟต์แวร์',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'ร้าน น่านการช่างและวัสดุก่อสร้าง',
                    'tax_id' => '3540100456789',
                    'bank_name' => 'ธนาคารกรุงเทพ',
                    'bank_account_number' => '325-0-54321-0',
                    'bank_account_name' => 'ร้าน น่านการช่างและวัสดุก่อสร้าง',
                    'address' => '205 ถ.มหายศ ต.ในเวียง อ.เมืองน่าน จ.น่าน 55000',
                    'phone' => '054-750112',
                    'contact_person' => 'คุณประสิทธิ์ การช่าง',
                    'category' => 'วัสดุฝึกงานช่าง เครื่องมือช่าง อุปกรณ์ไฟฟ้า สีและเคมีภัณฑ์',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'โรงพิมพ์ น่านพาณิชย์การพิมพ์และไวนิล',
                    'tax_id' => '0543536009876',
                    'bank_name' => 'ธนาคารไทยพาณิชย์',
                    'bank_account_number' => '567-2-33445-5',
                    'bank_account_name' => 'โรงพิมพ์ น่านพาณิชย์การพิมพ์',
                    'address' => '45/3 ถ.ผากอง ต.ในเวียง อ.เมืองน่าน จ.น่าน 55000',
                    'phone' => '054-712345',
                    'contact_person' => 'คุณสุรีย์ การพิมพ์',
                    'category' => 'เอกสารประกอบการฝึกอบรม แผ่นพับ ป้ายไวนิล สิ่งพิมพ์',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'name' => 'ร้าน น่านอีเล็คทรอนิคส์ แอนด์ ซัพพลาย',
                    'tax_id' => '3540100789123',
                    'bank_name' => 'ธนาคารออมสิน',
                    'bank_account_number' => '020-1-88990-1',
                    'bank_account_name' => 'ร้าน น่านอีเล็คทรอนิคส์ แอนด์ ซัพพลาย',
                    'address' => '99/4 ถ.เปรมประชาราษฎร์ ต.ในเวียง อ.เมืองน่าน จ.น่าน 55000',
                    'phone' => '054-774561',
                    'contact_person' => 'คุณนพดล อิเล็กทรอนิกส์',
                    'category' => 'อุปกรณ์อิเล็กทรอนิกส์ ชิ้นส่วนวงจร เครื่องเสียง เครื่องวัดไฟฟ้า',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ]);
        }

        // 2. Add citizen_id to users table (Encrypted via Eloquent)
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'citizen_id')) {
                    $table->text('citizen_id')->nullable()->after('department_id');
                }
            });
        }

        // 3. Add fiscal_year and budget_number to funding_sources table
        if (Schema::hasTable('funding_sources')) {
            Schema::table('funding_sources', function (Blueprint $table) {
                if (!Schema::hasColumn('funding_sources', 'fiscal_year')) {
                    $table->string('fiscal_year', 10)->nullable()->default('2569')->after('code');
                }
                if (!Schema::hasColumn('funding_sources', 'budget_number')) {
                    $table->string('budget_number', 100)->nullable()->after('fiscal_year');
                }
            });

            // Set initial official GFMIS / Budget codes for Nan Polytechnic College
            $defaultCodes = [
                'ปวช.' => '20006-2569-101',
                'ปวส.' => '20006-2569-102',
                'ระยะสั้น' => '20006-2569-201',
                'งบทวิศึกษา' => '20006-2569-301',
                'อุดหนุนเพื่อการจัดการฯ' => '20006-2569-401',
                'อุดหนุนพัฒนาฯ' => '20006-2569-501',
                'บกศ. (บำรุงการศึกษา)' => '20006-2569-601',
            ];
            foreach ($defaultCodes as $srcName => $bCode) {
                DB::table('funding_sources')
                    ->where('name', 'LIKE', '%' . $srcName . '%')
                    ->update([
                        'fiscal_year' => '2569',
                        'budget_number' => $bCode,
                    ]);
            }
        }

        // 4. Add budget_code to central_allocations table
        if (Schema::hasTable('central_allocations')) {
            Schema::table('central_allocations', function (Blueprint $table) {
                if (!Schema::hasColumn('central_allocations', 'budget_code')) {
                    $table->string('budget_code', 100)->nullable()->after('document_number');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('funding_sources')) {
            Schema::table('funding_sources', function (Blueprint $table) {
                if (Schema::hasColumn('funding_sources', 'fiscal_year')) {
                    $table->dropColumn('fiscal_year');
                }
                if (Schema::hasColumn('funding_sources', 'budget_number')) {
                    $table->dropColumn('budget_number');
                }
            });
        }

        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (Schema::hasColumn('users', 'citizen_id')) {
                    $table->dropColumn('citizen_id');
                }
            });
        }

        Schema::dropIfExists('vendors');
    }
};
