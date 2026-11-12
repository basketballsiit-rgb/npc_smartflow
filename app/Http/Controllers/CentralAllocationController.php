<?php

namespace App\Http\Controllers;

use App\Models\CentralAllocation;
use Illuminate\Http\Request;

class CentralAllocationController extends Controller
{
    /**
     * Ensure required GFMIS columns exist in SQLite/MySQL tables.
     */
    private function ensureColumnsExist(): void
    {
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('central_allocations')) {
                \Illuminate\Support\Facades\Schema::table('central_allocations', function (\Illuminate\Database\Schema\Blueprint $table) {
                    if (!\Illuminate\Support\Facades\Schema::hasColumn('central_allocations', 'budget_code')) {
                        $table->string('budget_code', 100)->nullable();
                    }
                    if (!\Illuminate\Support\Facades\Schema::hasColumn('central_allocations', 'activity_code')) {
                        $table->string('activity_code', 30)->nullable();
                    }
                    if (!\Illuminate\Support\Facades\Schema::hasColumn('central_allocations', 'sub_account_code')) {
                        $table->string('sub_account_code', 20)->nullable();
                    }
                });
            }
            if (\Illuminate\Support\Facades\Schema::hasTable('funding_sources')) {
                \Illuminate\Support\Facades\Schema::table('funding_sources', function (\Illuminate\Database\Schema\Blueprint $table) {
                    if (!\Illuminate\Support\Facades\Schema::hasColumn('funding_sources', 'budget_code')) {
                        $table->string('budget_code', 50)->nullable();
                    }
                    if (!\Illuminate\Support\Facades\Schema::hasColumn('funding_sources', 'activity_code')) {
                        $table->string('activity_code', 30)->nullable();
                    }
                    if (!\Illuminate\Support\Facades\Schema::hasColumn('funding_sources', 'sub_account_code')) {
                        $table->string('sub_account_code', 20)->nullable();
                    }
                });
            }
        } catch (\Throwable $e) {
            \Log::warning('ensureColumnsExist warning: ' . $e->getMessage());
        }
    }

    /**
     * Store a newly created central budget allocation.
     */
    public function store(Request $request)
    {
        $this->ensureColumnsExist();

        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPlanHead() && !$user->isPlanStaff() && !$user->isExecutive()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้');
        }

        // Clean spaces, dashes, commas, and Thai numerals from inputs before validation
        $thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
        $arabicDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        $cleanedInput = [];
        if ($request->has('budget_code')) {
            $val = str_replace($thaiDigits, $arabicDigits, (string)$request->budget_code);
            $cleanedInput['budget_code'] = !empty($val) ? preg_replace('/[^0-9]/', '', $val) : null;
        }
        if ($request->has('activity_code')) {
            $val = str_replace($thaiDigits, $arabicDigits, (string)$request->activity_code);
            $digits = preg_replace('/[^0-9]/', '', $val);
            $cleanedInput['activity_code'] = !empty($digits) ? $digits : null;
        }
        if ($request->has('sub_account_code')) {
            $val = str_replace($thaiDigits, $arabicDigits, (string)$request->sub_account_code);
            $digits = preg_replace('/[^0-9]/', '', $val);
            $cleanedInput['sub_account_code'] = !empty($digits) ? $digits : null;
        }
        if ($request->has('amount')) {
            $val = str_replace([',', ' '], '', (string)$request->amount);
            $val = str_replace($thaiDigits, $arabicDigits, $val);
            $cleanedInput['amount'] = is_numeric($val) ? (float)$val : $request->amount;
        }
        if (!empty($cleanedInput)) {
            $request->merge($cleanedInput);
        }

        $validated = $request->validate([
            'fiscal_year' => 'required|string',
            'document_number' => 'nullable|string|max:255',
            'budget_code' => ['required', 'string', 'regex:/^[0-9]{20}$/'],
            'activity_code' => ['nullable', 'string', 'regex:/^[0-9]{17}$/'],
            'sub_account_code' => ['nullable', 'string', 'regex:/^[0-9]{7}$/'],
            'title' => 'required|string|max:255',
            'funding_source_id' => 'required|exists:funding_sources,id',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ], [
            'fiscal_year.required' => 'กรุณาระบุปีงบประมาณ',
            'title.required' => 'กรุณาระบุชื่องบประมาณจัดสรร',
            'funding_source_id.required' => 'กรุณาเลือกแหล่งเงินทุน',
            'funding_source_id.exists' => 'ไม่พบแหล่งเงินทุนที่เลือกในระบบ',
            'amount.required' => 'กรุณาระบุจำนวนเงิน',
            'amount.numeric' => 'จำนวนเงินต้องเป็นตัวเลขที่ถูกต้อง',
            'budget_code.required' => 'กรุณาระบุรหัสงบประมาณ (20 หลัก)',
            'budget_code.regex' => 'รหัสงบประมาณต้องเป็นตัวเลข 20 หลักพอดี (ตัวอย่าง: 20006330015004100003)',
            'activity_code.regex' => 'รหัสกิจกรรมหลักต้องเป็นตัวเลข 17 หลักพอดี (ตัวอย่าง: 20006690000800000)',
            'sub_account_code.regex' => 'รหัสบัญชีย่อยต้องเป็นตัวเลข 7 หลักพอดี (ตัวอย่าง: 0015011)',
        ]);

        $allocation = CentralAllocation::create($validated);

        // Synchronize GFMIS codes with the funding source for cross-module usage (Finance / Projects / Loans)
        if (!empty($validated['funding_source_id'])) {
            try {
                $sourceUpdate = [
                    'budget_code' => $validated['budget_code'] ?? null,
                ];
                if (!empty($validated['activity_code'])) {
                    $sourceUpdate['activity_code'] = $validated['activity_code'];
                }
                if (!empty($validated['sub_account_code'])) {
                    $sourceUpdate['sub_account_code'] = $validated['sub_account_code'];
                }
                \App\Models\FundingSource::where('id', $validated['funding_source_id'])->update($sourceUpdate);
            } catch (\Throwable $e) {
                \Log::warning('FundingSource sync warning: ' . $e->getMessage());
            }
        }

        return redirect()->back()->with('success', 'บันทึกรับงบประมาณจัดสรรจริงจากส่วนกลางเรียบร้อยแล้ว');
    }

    /**
     * Update the specified central budget allocation.
     */
    public function update(Request $request, CentralAllocation $centralAllocation)
    {
        $this->ensureColumnsExist();

        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPlanHead() && !$user->isPlanStaff() && !$user->isExecutive()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้');
        }

        // Clean spaces, dashes, commas, and Thai numerals from inputs before validation
        $thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
        $arabicDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        $cleanedInput = [];
        if ($request->has('budget_code')) {
            $val = str_replace($thaiDigits, $arabicDigits, (string)$request->budget_code);
            $cleanedInput['budget_code'] = !empty($val) ? preg_replace('/[^0-9]/', '', $val) : null;
        }
        if ($request->has('activity_code')) {
            $val = str_replace($thaiDigits, $arabicDigits, (string)$request->activity_code);
            $digits = preg_replace('/[^0-9]/', '', $val);
            $cleanedInput['activity_code'] = !empty($digits) ? $digits : null;
        }
        if ($request->has('sub_account_code')) {
            $val = str_replace($thaiDigits, $arabicDigits, (string)$request->sub_account_code);
            $digits = preg_replace('/[^0-9]/', '', $val);
            $cleanedInput['sub_account_code'] = !empty($digits) ? $digits : null;
        }
        if ($request->has('amount')) {
            $val = str_replace([',', ' '], '', (string)$request->amount);
            $val = str_replace($thaiDigits, $arabicDigits, $val);
            $cleanedInput['amount'] = is_numeric($val) ? (float)$val : $request->amount;
        }
        if (!empty($cleanedInput)) {
            $request->merge($cleanedInput);
        }

        $validated = $request->validate([
            'document_number' => 'nullable|string|max:255',
            'budget_code' => ['required', 'string', 'regex:/^[0-9]{20}$/'],
            'activity_code' => ['nullable', 'string', 'regex:/^[0-9]{17}$/'],
            'sub_account_code' => ['nullable', 'string', 'regex:/^[0-9]{7}$/'],
            'title' => 'required|string|max:255',
            'funding_source_id' => 'required|exists:funding_sources,id',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ], [
            'title.required' => 'กรุณาระบุชื่องบประมาณจัดสรร',
            'funding_source_id.required' => 'กรุณาเลือกแหล่งเงินทุน',
            'funding_source_id.exists' => 'ไม่พบแหล่งเงินทุนที่เลือกในระบบ',
            'amount.required' => 'กรุณาระบุจำนวนเงิน',
            'amount.numeric' => 'จำนวนเงินต้องเป็นตัวเลขที่ถูกต้อง',
            'budget_code.required' => 'กรุณาระบุรหัสงบประมาณ (20 หลัก)',
            'budget_code.regex' => 'รหัสงบประมาณต้องเป็นตัวเลข 20 หลักพอดี (ตัวอย่าง: 20006330015004100003)',
            'activity_code.regex' => 'รหัสกิจกรรมหลักต้องเป็นตัวเลข 17 หลักพอดี (ตัวอย่าง: 20006690000800000)',
            'sub_account_code.regex' => 'รหัสบัญชีย่อยต้องเป็นตัวเลข 7 หลักพอดี (ตัวอย่าง: 0015011)',
        ]);

        $centralAllocation->update($validated);

        // Synchronize GFMIS codes with the funding source
        if (!empty($validated['funding_source_id'])) {
            try {
                $sourceUpdate = [
                    'budget_code' => $validated['budget_code'] ?? null,
                ];
                if (!empty($validated['activity_code'])) {
                    $sourceUpdate['activity_code'] = $validated['activity_code'];
                }
                if (!empty($validated['sub_account_code'])) {
                    $sourceUpdate['sub_account_code'] = $validated['sub_account_code'];
                }
                \App\Models\FundingSource::where('id', $validated['funding_source_id'])->update($sourceUpdate);
            } catch (\Throwable $e) {
                \Log::warning('FundingSource sync warning: ' . $e->getMessage());
            }
        }

        return redirect()->back()->with('success', 'แก้ไขข้อมูลรับงบจัดสรรจากส่วนกลางเรียบร้อยแล้ว');
    }

    /**
     * Remove the specified central budget allocation.
     */
    public function destroy(CentralAllocation $centralAllocation)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPlanHead() && !$user->isPlanStaff() && !$user->isExecutive()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้');
        }

        $centralAllocation->delete();

        return redirect()->back()->with('success', 'ลบประวัติงบจัดสรรจากส่วนกลางเรียบร้อยแล้ว');
    }
}
