<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\Project;
use App\Models\TravelLoan;
use App\Models\User;
use Illuminate\Support\Collection;

class NotificationService
{
    /**
     * Send notification to one or multiple users.
     */
    public static function send(
        int|array|Collection $userIds,
        string $title,
        ?string $message = null,
        ?string $actionUrl = null,
        string $type = 'general',
        string $icon = '🔔',
        string $color = 'purple',
        ?string $referenceId = null
    ): void {
        $ids = is_numeric($userIds) ? [$userIds] : (is_array($userIds) ? $userIds : $userIds->toArray());
        $ids = array_unique(array_filter($ids));

        foreach ($ids as $uid) {
            // Avoid creating identical unread notification within 5 minutes
            $exists = AppNotification::where('user_id', $uid)
                ->where('title', $title)
                ->where('reference_id', $referenceId)
                ->whereNull('read_at')
                ->where('created_at', '>=', now()->subMinutes(5))
                ->exists();

            if (!$exists) {
                AppNotification::create([
                    'user_id' => $uid,
                    'title' => $title,
                    'message' => $message,
                    'type' => $type,
                    'action_url' => $actionUrl,
                    'icon' => $icon,
                    'color' => $color,
                    'reference_id' => $referenceId,
                ]);
            }
        }
    }

    /**
     * Notify responsible authorities when project enters an approval step.
     */
    public static function notifyProjectStep(Project $project): void
    {
        $step = (int)$project->current_approval_step;
        $projTitle = $project->title;
        $refId = 'project_' . $project->id . '_step_' . $step;
        $actionUrl = route('dashboard', ['tab' => 'reviews', 'project_id' => $project->id]);

        $stepTitles = [
            2 => 'หัวหน้างาน/สาขาวิชา',
            3 => 'งานแผนงานและงบประมาณ',
            4 => 'รองผู้อำนวยการฝ่ายที่กำกับดูแล',
            5 => 'รองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน',
            6 => 'ผู้อำนวยการวิทยาลัย',
        ];

        $stepName = $stepTitles[$step] ?? "ขั้นที่ {$step}";
        $title = "📝 โครงการรอการพิจารณาอนุมัติ ({$stepName})";
        $message = "โครงการ \"{$projTitle}\" ได้รับการเสนอเข้าสู่คิวพิจารณาของท่าน กรุณาตรวจสอบรายละเอียด";

        $recipientIds = [];

        switch ($step) {
            case 2: // Head of Department
                $deptId = $project->department_id;
                $heads = User::all()->filter(function ($u) use ($deptId, $project) {
                    return $u->isDepartmentHead($deptId) && $u->id !== $project->user_id;
                });
                $recipientIds = $heads->pluck('id')->toArray();
                break;

            case 3: // Plan Head & Plan Staff
                $planStaff = User::all()->filter(function ($u) {
                    return $u->isPlanHead() || $u->isPlanStaff();
                });
                $recipientIds = $planStaff->pluck('id')->toArray();
                break;

            case 4: // Executive supervising that department
                $execs = User::all()->filter(function ($u) use ($project) {
                    return $u->isExecutiveForDepartment($project->department_id) && 
                           str_contains($u->position ?? '', 'รองผู้อำนวยการ');
                });
                $recipientIds = $execs->pluck('id')->toArray();
                break;

            case 5: // Deputy Director of Planning & Cooperation
                $planExecs = User::all()->filter(function ($u) {
                    $pos = $u->position ?? '';
                    return $u->isExecutive() && 
                           (str_contains($pos, 'แผน') || str_contains($pos, 'ยุทธศาสตร์'));
                });
                $recipientIds = $planExecs->pluck('id')->toArray();
                break;

            case 6: // College Director
                $directors = User::all()->filter(function ($u) {
                    $pos = $u->position ?? '';
                    return $u->isExecutive() && 
                           str_contains($pos, 'ผู้อำนวยการวิทยาลัย') && 
                           !str_contains($pos, 'รอง');
                });
                $recipientIds = $directors->pluck('id')->toArray();
                break;
        }

        if (!empty($recipientIds)) {
            self::send($recipientIds, $title, $message, $actionUrl, 'approval', '✍️', 'amber', $refId);
        }
    }

    /**
     * Notify project proposer when their project has a result (approved / rejected / returned).
     */
    public static function notifyProjectResult(Project $project, string $action, ?string $comment = null): void
    {
        $userId = $project->user_id;
        if (!$userId) return;

        $projTitle = $project->title;
        $refId = 'project_result_' . $project->id . '_' . $action . '_' . time();

        if ($action === 'approved') {
            $isFinal = ($project->status === 'approved' || $project->current_approval_step >= 6);
            if ($isFinal) {
                $title = "🎉 โครงการได้รับอนุมัติเรียบร้อยแล้ว!";
                $message = "โครงการ \"{$projTitle}\" ได้รับการอนุมัติขั้นสุดท้ายจากผู้อำนวยการเรียบร้อยแล้ว ท่านสามารถดำเนินการจัดซื้อจัดจ้างและดำเนินโครงการได้ทันที";
                $actionUrl = route('dashboard', ['tab' => 'proposals']);
                self::send($userId, $title, $message, $actionUrl, 'status', '🎉', 'emerald', $refId);
            } else {
                $title = "✅ โครงการผ่านการพิจารณาในขั้นที่ " . ($project->current_approval_step - 1);
                $message = "โครงการ \"{$projTitle}\" ผ่านการพิจารณาแล้ว และกำลังส่งต่อคิวอนุมัติในลำดับถัดไป";
                $actionUrl = route('dashboard', ['tab' => 'proposals']);
                self::send($userId, $title, $message, $actionUrl, 'status', 'ℹ️', 'blue', $refId);
            }
        } elseif ($action === 'rejected' || $action === 'revision_requested') {
            $title = "⚠️ โครงการถูกส่งกลับเพื่อแก้ไข / ข้อเสนอแนะ";
            $message = "โครงการ \"{$projTitle}\" มีข้อเสนอแนะ: " . ($comment ?: 'กรุณาตรวจสอบและปรับปรุงรายละเอียดโครงการ');
            $actionUrl = route('projects.edit', $project->id);
            self::send($userId, $title, $message, $actionUrl, 'status', '⚠️', 'rose', $refId);
        }
    }

    /**
     * Notify Plan Staff when a travel loan or procurement needs budget cutting.
     */
    public static function notifyLoanCutNeeded(TravelLoan $loan): void
    {
        $planStaff = User::all()->filter(fn($u) => $u->isPlanHead() || $u->isPlanStaff());
        $docNo = $loan->document_number ?: 'ไม่มีเลขที่';
        $title = "📑 สัญญายืมเงิน (กค.๑๐๑) รอตัดยอดงบประมาณ";
        $message = "สัญญายืมเงินไปราชการเลขที่ {$docNo} ({$loan->borrower_name}) ยอดเงิน " . number_format($loan->total_loan_amount, 2) . " บาท รอยืนยันตัดยอดงบประมาณ";
        $actionUrl = route('dashboard', ['tab' => 'document_tracking']);

        self::send($planStaff->pluck('id'), $title, $message, $actionUrl, 'loan', '📑', 'purple', 'loan_cut_' . $loan->id);
    }

    /**
     * Notify Finance Staff when a loan budget has been cut and is ready for disbursement.
     */
    public static function notifyFinanceDisbursementNeeded(TravelLoan $loan): void
    {
        $finStaff = User::all()->filter(fn($u) => $u->isFinanceStaff());
        $docNo = $loan->document_number ?: 'ไม่มีเลขที่';
        $title = "💰 สัญญายืมเงินพร้อมจ่ายเงิน (การเงิน)";
        $message = "สัญญายืมเงินเลขที่ {$docNo} ได้รับการตัดยอดงบแผนงานแล้ว พร้อมให้งานการเงินตรวจรับและเบิกจ่ายเงิน";
        $actionUrl = route('dashboard', ['tab' => 'clearings']);

        self::send($finStaff->pluck('id'), $title, $message, $actionUrl, 'loan', '💰', 'emerald', 'loan_disburse_' . $loan->id);
    }

    /**
     * Automatically scan and sync unread task action notifications for the logged in user.
     * Ensures that if the user has active pending items in their queue, an unread notification exists!
     */
    public static function syncPendingActionsForUser(User $user): void
    {
        // 1. Projects pending approval for this user
        if ($user->isAdmin() || $user->isExecutive() || $user->isPlanHead() || $user->isDepartmentHead()) {
            $pendingProjects = Project::whereIn('status', ['submitted', 'pending_approval'])->get();

            foreach ($pendingProjects as $project) {
                $step = (int)$project->current_approval_step;
                $isTarget = false;

                if ($user->isAdmin()) {
                    $isTarget = true;
                } elseif ($step === 2 && $user->isDepartmentHead($project->department_id) && $user->id !== $project->user_id) {
                    $isTarget = true;
                } elseif ($step === 3 && ($user->isPlanHead() || $user->isPlanStaff())) {
                    $isTarget = true;
                } elseif ($step === 4 && $user->isExecutiveForDepartment($project->department_id) && str_contains($user->position ?? '', 'รองผู้อำนวยการ')) {
                    $isTarget = true;
                } elseif ($step === 5 && $user->isExecutive() && (str_contains($user->position ?? '', 'แผน') || str_contains($user->position ?? '', 'ยุทธศาสตร์'))) {
                    $isTarget = true;
                } elseif ($step === 6 && $user->isExecutive() && str_contains($user->position ?? '', 'ผู้อำนวยการวิทยาลัย') && !str_contains($user->position ?? '', 'รอง')) {
                    $isTarget = true;
                }

                if ($isTarget) {
                    $refId = 'pending_step_' . $project->id . '_' . $step;
                    $exists = AppNotification::where('user_id', $user->id)
                        ->where('reference_id', $refId)
                        ->exists();

                    if (!$exists) {
                        AppNotification::create([
                            'user_id' => $user->id,
                            'title' => "📝 โครงการรอการพิจารณาอนุมัติ (ขั้นที่ {$step})",
                            'message' => "โครงการ \"{$project->title}\" รอการตรวจสอบและลงนามอนุมัติจากท่าน",
                            'type' => 'approval',
                            'action_url' => route('dashboard', ['tab' => 'reviews', 'project_id' => $project->id]),
                            'icon' => '✍️',
                            'color' => 'amber',
                            'reference_id' => $refId,
                        ]);
                    }
                }
            }
        }

        // 2. Travel Loans pending budget cut (for Plan Head & Plan Staff)
        if ($user->isPlanHead() || $user->isPlanStaff() || $user->isAdmin()) {
            $pendingLoans = TravelLoan::where('loan_status', 'pending')
                ->orWhereNull('plan_cut_at')
                ->latest()
                ->take(5)
                ->get();

            foreach ($pendingLoans as $loan) {
                if ($loan->loan_status === 'pending' || !$loan->plan_cut_at) {
                    $refId = 'pending_cut_loan_' . $loan->id;
                    $exists = AppNotification::where('user_id', $user->id)
                        ->where('reference_id', $refId)
                        ->exists();

                    if (!$exists) {
                        AppNotification::create([
                            'user_id' => $user->id,
                            'title' => '📑 สัญญายืมเงินรอแผนงานตัดยอดงบประมาณ',
                            'message' => "สัญญายืมเงินของ {$loan->borrower_name} (" . number_format($loan->total_loan_amount, 2) . " บาท) รอยืนยันตัดยอดงบ",
                            'type' => 'loan',
                            'action_url' => route('dashboard', ['tab' => 'document_tracking']),
                            'icon' => '📑',
                            'color' => 'purple',
                            'reference_id' => $refId,
                        ]);
                    }
                }
            }
        }

        // 3. Clearings pending finance verification (for Finance Staff)
        if ($user->isFinanceStaff() || $user->isAdmin()) {
            $clearingLoans = TravelLoan::where('loan_status', 'plan_cut')
                ->latest()
                ->take(5)
                ->get();

            foreach ($clearingLoans as $loan) {
                $refId = 'pending_finance_loan_' . $loan->id;
                $exists = AppNotification::where('user_id', $user->id)
                    ->where('reference_id', $refId)
                    ->exists();

                if (!$exists) {
                    AppNotification::create([
                        'user_id' => $user->id,
                        'title' => '💰 สัญญายืมเงินรอดำเนินการจ่ายเงิน (งานการเงิน)',
                        'message' => "สัญญายืมเงินของ {$loan->borrower_name} ได้รับการตัดยอดงบแล้ว รอตรวจรับและจ่ายเงิน",
                        'type' => 'loan',
                        'action_url' => route('dashboard', ['tab' => 'clearings']),
                        'icon' => '💰',
                        'color' => 'emerald',
                        'reference_id' => $refId,
                    ]);
                }
            }
        }
    }
}
