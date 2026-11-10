<?php

namespace App\Http\Controllers;

use App\Models\CentralAllocation;
use Illuminate\Http\Request;

class CentralAllocationController extends Controller
{
    /**
     * Store a newly created central budget allocation.
     */
    public function store(Request $request)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPlanHead()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้');
        }

        // Clean spaces and formatting from GFMIS codes before validation
        $cleanedInput = [];
        if ($request->has('budget_code')) {
            $cleanedInput['budget_code'] = !empty($request->budget_code) ? preg_replace('/[^0-9]/', '', (string)$request->budget_code) : null;
        }
        if ($request->has('activity_code')) {
            $val = !empty($request->activity_code) ? preg_replace('/[^0-9]/', '', (string)$request->activity_code) : null;
            $cleanedInput['activity_code'] = $val ?: null;
        }
        if ($request->has('sub_account_code')) {
            $val = !empty($request->sub_account_code) ? preg_replace('/[^0-9]/', '', (string)$request->sub_account_code) : null;
            $cleanedInput['sub_account_code'] = $val ?: null;
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
            'title.required' => 'กรุณาระบุชื่องบประมาณจัดสรร',
            'funding_source_id.required' => 'กรุณาเลือกแหล่งเงินทุน',
            'amount.required' => 'กรุณาระบุจำนวนเงิน',
            'budget_code.required' => 'กรุณาระบุรหัสงบประมาณ (20 หลัก)',
            'budget_code.regex' => 'รหัสงบประมาณต้องเป็นตัวเลข 20 หลักพอดี (ตัวอย่าง: 20006330015004100003)',
            'activity_code.regex' => 'รหัสกิจกรรมหลักต้องเป็นตัวเลข 17 หลักพอดี (ตัวอย่าง: 20006690000800000)',
            'sub_account_code.regex' => 'รหัสบัญชีย่อยต้องเป็นตัวเลข 7 หลักพอดี (ตัวอย่าง: 0015011)',
        ]);

        $allocation = CentralAllocation::create($validated);

        // Synchronize GFMIS codes with the funding source for cross-module usage (Finance / Projects / Loans)
        if (!empty($validated['funding_source_id'])) {
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
        }

        return redirect()->back()->with('success', 'บันทึกรับงบประมาณจัดสรรจริงจากส่วนกลางเรียบร้อยแล้ว');
    }

    /**
     * Update the specified central budget allocation.
     */
    public function update(Request $request, CentralAllocation $centralAllocation)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPlanHead()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้');
        }

        // Clean spaces and formatting from GFMIS codes before validation
        $cleanedInput = [];
        if ($request->has('budget_code')) {
            $cleanedInput['budget_code'] = !empty($request->budget_code) ? preg_replace('/[^0-9]/', '', (string)$request->budget_code) : null;
        }
        if ($request->has('activity_code')) {
            $val = !empty($request->activity_code) ? preg_replace('/[^0-9]/', '', (string)$request->activity_code) : null;
            $cleanedInput['activity_code'] = $val ?: null;
        }
        if ($request->has('sub_account_code')) {
            $val = !empty($request->sub_account_code) ? preg_replace('/[^0-9]/', '', (string)$request->sub_account_code) : null;
            $cleanedInput['sub_account_code'] = $val ?: null;
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
            'amount.required' => 'กรุณาระบุจำนวนเงิน',
            'budget_code.required' => 'กรุณาระบุรหัสงบประมาณ (20 หลัก)',
            'budget_code.regex' => 'รหัสงบประมาณต้องเป็นตัวเลข 20 หลักพอดี (ตัวอย่าง: 20006330015004100003)',
            'activity_code.regex' => 'รหัสกิจกรรมหลักต้องเป็นตัวเลข 17 หลักพอดี (ตัวอย่าง: 20006690000800000)',
            'sub_account_code.regex' => 'รหัสบัญชีย่อยต้องเป็นตัวเลข 7 หลักพอดี (ตัวอย่าง: 0015011)',
        ]);

        $centralAllocation->update($validated);

        // Synchronize GFMIS codes with the funding source
        if (!empty($validated['funding_source_id'])) {
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
        }

        return redirect()->back()->with('success', 'แก้ไขข้อมูลรับงบจัดสรรจากส่วนกลางเรียบร้อยแล้ว');
    }

    /**
     * Remove the specified central budget allocation.
     */
    public function destroy(CentralAllocation $centralAllocation)
    {
        $user = auth()->user();
        if (!$user->isAdmin() && !$user->isPlanHead()) {
            abort(403, 'คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้');
        }

        $centralAllocation->delete();

        return redirect()->back()->with('success', 'ลบประวัติงบจัดสรรจากส่วนกลางเรียบร้อยแล้ว');
    }
}
