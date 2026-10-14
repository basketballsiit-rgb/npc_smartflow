<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\RoleDelegation;
use App\Models\User;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class RoleDelegationController extends Controller
{
    /**
     * Display a listing of role delegations for the authenticated user.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // 1. Delegations created by this user (ผู้มอบอำนาจ)
        $givenQuery = RoleDelegation::where('user_id', $user->id)
            ->with(['delegateUser'])
            ->latest();

        // 2. Delegations assigned to this user (ผู้รักษาการแทน)
        $receivedQuery = RoleDelegation::where('delegate_user_id', $user->id)
            ->with(['principalUser'])
            ->latest();

        // Admin can view all delegations if requested
        if ($user->isAdmin() && $request->boolean('all')) {
            $allDelegations = RoleDelegation::with(['principalUser', 'delegateUser'])
                ->latest()
                ->paginate(20);

            return response()->json([
                'all' => $allDelegations,
            ]);
        }

        return response()->json([
            'given' => $givenQuery->get(),
            'received' => $receivedQuery->get(),
        ]);
    }

    /**
     * Store a newly created delegation in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'delegate_user_id' => [
                'required',
                'exists:users,id',
                function ($attribute, $value, $fail) use ($user) {
                    if ((int)$value === (int)$user->id) {
                        $fail('ไม่สามารถมอบอำนาจให้ตนเองได้ กรุณาเลือกบุคลากรท่านอื่น');
                    }
                },
            ],
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'acting_position' => 'nullable|string|max:255',
            'reason' => 'nullable|string|max:255',
            'order_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ], [
            'delegate_user_id.required' => 'กรุณาเลือกผู้รับมอบอำนาจ / ผู้รักษาการแทน',
            'delegate_user_id.exists' => 'ไม่พบบุคลากรที่เลือกในระบบ',
            'start_date.required' => 'กรุณาระบุวันที่เริ่มต้น',
            'start_date.date' => 'รูปแบบวันที่เริ่มต้นไม่ถูกต้อง',
            'end_date.required' => 'กรุณาระบุวันที่สิ้นสุด',
            'end_date.date' => 'รูปแบบวันที่สิ้นสุดไม่ถูกต้อง',
            'end_date.after_or_equal' => 'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น',
        ]);

        // Auto-resolve acting position title if left blank
        $actingTitle = trim($validated['acting_position'] ?? '');
        if (empty($actingTitle)) {
            $pos = $user->position_level ?: $user->position;
            if (!empty($pos)) {
                $actingTitle = str_starts_with($pos, 'รักษาการในตำแหน่ง') ? $pos : ('รักษาการในตำแหน่ง' . $pos);
            } elseif ($user->isDirector()) {
                $actingTitle = 'รักษาการในตำแหน่งผู้อำนวยการวิทยาลัยสารพัดช่างน่าน';
            } elseif ($user->isDeputyDirector()) {
                $actingTitle = 'รักษาการในตำแหน่งรองผู้อำนวยการ';
            } elseif ($user->isDepartmentHead()) {
                $deptName = $user->department?->name ?? '';
                $actingTitle = 'รักษาการในตำแหน่งหัวหน้า' . $deptName;
            } else {
                $actingTitle = 'รักษาการในตำแหน่ง';
            }
        }

        $delegation = RoleDelegation::create([
            'user_id' => $user->id,
            'delegate_user_id' => $validated['delegate_user_id'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'acting_position' => $actingTitle,
            'reason' => $validated['reason'] ?? 'ไปราชการ',
            'order_number' => $validated['order_number'] ?? null,
            'is_active' => true,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Audit Trail Log
        AuditLog::record(
            action: 'CREATE_DELEGATION',
            model: $delegation,
            notes: "มอบอำนาจรักษาการแทนให้แก่ User ID #{$validated['delegate_user_id']} ในตำแหน่ง {$actingTitle} (ช่วง {$validated['start_date']} ถึง {$validated['end_date']})"
        );

        // Notify the delegate user
        $delegateUser = User::find($validated['delegate_user_id']);
        if ($delegateUser) {
            $thaiStart = Carbon::parse($validated['start_date'])->addYears(543)->format('d/m/Y');
            $thaiEnd = Carbon::parse($validated['end_date'])->addYears(543)->format('d/m/Y');
            NotificationService::send(
                $delegateUser->id,
                '📋 ได้รับมอบหมายให้ปฏิบัติหน้าที่รักษาการแทน',
                "ท่านได้รับมอบหมายจาก {$user->name} ให้ปฏิบัติหน้าที่ \"{$actingTitle}\" ระหว่างวันที่ {$thaiStart} ถึง {$thaiEnd} คิวงานและเอกสารจะถูกส่งต่อให้ท่านลงนามแทนได้ทันที",
                route('dashboard', ['tab' => 'reviews']),
                'role_delegation',
                '🏛️',
                'purple',
                'delegation_' . $delegation->id
            );
        }

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'บันทึกการมอบอำนาจรักษาการแทนเรียบร้อยแล้ว',
                'delegation' => $delegation->load(['delegateUser']),
            ]);
        }

        return redirect()->back()->with('success', 'บันทึกการมอบอำนาจรักษาการแทนเรียบร้อยแล้ว ระบบจะส่งต่องานให้ผู้รักษาการลงนามแทนในช่วงเวลาดังกล่าว');
    }

    /**
     * Toggle active status or cancel delegation.
     */
    public function toggle(Request $request, RoleDelegation $delegation)
    {
        $user = $request->user();

        // Check ownership or admin
        if ($delegation->user_id !== $user->id && !$user->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์แก้ไขคำสั่งมอบอำนาจนี้');
        }

        $delegation->is_active = !$delegation->is_active;
        $delegation->save();

        AuditLog::record(
            action: 'TOGGLE_DELEGATION',
            model: $delegation,
            notes: "เปลี่ยนสถานะคำสั่งมอบอำนาจ ID #{$delegation->id} เป็น: " . ($delegation->is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน/ยกเลิก')
        );

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'is_active' => $delegation->is_active,
                'message' => $delegation->is_active ? 'เปิดใช้งานคำสั่งมอบอำนาจแล้ว' : 'ระงับ/ยกเลิกคำสั่งมอบอำนาจแล้ว',
            ]);
        }

        return redirect()->back()->with('success', $delegation->is_active ? 'เปิดใช้งานคำสั่งมอบอำนาจแล้ว' : 'ระงับคำสั่งมอบอำนาจเรียบร้อยแล้ว');
    }

    /**
     * Remove the specified delegation from storage.
     */
    public function destroy(Request $request, RoleDelegation $delegation)
    {
        $user = $request->user();

        if ($delegation->user_id !== $user->id && !$user->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์ลบคำสั่งมอบอำนาจนี้');
        }

        AuditLog::record(
            action: 'DELETE_DELEGATION',
            model: $delegation,
            notes: "ลบคำสั่งมอบอำนาจ ID #{$delegation->id}"
        );

        $delegation->delete();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'ลบคำสั่งมอบอำนาจรักษาการเรียบร้อยแล้ว',
            ]);
        }

        return redirect()->back()->with('success', 'ลบคำสั่งมอบอำนาจรักษาการเรียบร้อยแล้ว');
    }
}
