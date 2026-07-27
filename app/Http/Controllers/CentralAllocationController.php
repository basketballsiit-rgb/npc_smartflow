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

        $validated = $request->validate([
            'fiscal_year' => 'required|string',
            'document_number' => 'nullable|string|max:255',
            'title' => 'required|string|max:255',
            'funding_source_id' => 'required|exists:funding_sources,id',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ], [
            'title.required' => 'กรุณาระบุชื่องบประมาณจัดสรร',
            'funding_source_id.required' => 'กรุณาเลือกแหล่งเงินทุน',
            'amount.required' => 'กรุณาระบุจำนวนเงิน',
        ]);

        CentralAllocation::create($validated);

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

        $validated = $request->validate([
            'document_number' => 'nullable|string|max:255',
            'title' => 'required|string|max:255',
            'funding_source_id' => 'required|exists:funding_sources,id',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
        ], [
            'title.required' => 'กรุณาระบุชื่องบประมาณจัดสรร',
            'funding_source_id.required' => 'กรุณาเลือกแหล่งเงินทุน',
            'amount.required' => 'กรุณาระบุจำนวนเงิน',
        ]);

        $centralAllocation->update($validated);

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
