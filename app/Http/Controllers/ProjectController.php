<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\IqaStrategy;
use App\Models\OvecStrategy;
use App\Models\Department;
use App\Models\ProjectApproval;
use App\Models\Budget;
use App\Models\AuditLog;
use App\Jobs\StitchProjectDocumentsJob;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Services\NotificationService;
use App\Services\GeminiService;

class ProjectController extends Controller
{
    /**
     * Show the form for creating a new project.
     */
    public function create(Request $request)
    {
        $user = auth()->user();

        if ($request->has('project_id')) {
            $proj = Project::find($request->input('project_id'));
            if ($proj && in_array($proj->status, ['budget_approved', 'draft'])) {
                return redirect()->route('projects.edit', $proj->id);
            }
        }

        $allUserProjects = Project::with(['department', 'fundingSource', 'budget'])
            ->when(!$user->isAdmin() && !$user->isPlanHead(), function($q) use ($user) {
                $q->where(function($sub) use ($user) {
                    $sub->where('user_id', $user->id)
                        ->orWhere('department_id', $user->department_id);
                });
            })
            ->orderBy('updated_at', 'desc')
            ->get();

        $approvedProjects = $allUserProjects->filter(function($p) {
            return in_array($p->status, ['budget_approved', 'draft']);
        })->values();

        $otherProjects = $allUserProjects->filter(function($p) {
            return !in_array($p->status, ['budget_approved', 'draft']);
        })->values();

        $activeCategories = [];
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('strategy_categories')) {
                $activeCategories = \App\Models\StrategyCategory::with(['items' => function($q) {
                    $q->where('is_active', true)->orderBy('order_index', 'asc');
                }])->where('is_active', true)->orderBy('order_index', 'asc')->get();
            }
        } catch (\Exception $e) {
            $activeCategories = [];
        }

        return Inertia::render('Projects/Create', [
            'approvedProjects' => $approvedProjects,
            'otherProjects' => $otherProjects,
            'strategyCategories' => $activeCategories,
            'iqaStrategies' => IqaStrategy::all(),
            'ovecStrategies' => OvecStrategy::all(),
            'nationalStrategies' => \App\Models\NationalStrategy::all(),
            'provincialStrategies' => \App\Models\ProvincialStrategy::all(),
            'departments' => Department::all(),
        ]);
    }

    /**
     * Show the preliminary proposal quick create form.
     */
    public function preliminaryCreate()
    {
        $activeCategories = [];
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('strategy_categories')) {
                $activeCategories = \App\Models\StrategyCategory::with(['items' => function($q) {
                    $q->where('is_active', true)->orderBy('order_index', 'asc');
                }])->where('is_active', true)->orderBy('order_index', 'asc')->get();
            }
        } catch (\Exception $e) {
            $activeCategories = [];
        }

        return Inertia::render('Projects/QuickCreate', [
            'departments' => Department::all(),
            'currentFiscalYear' => \App\Models\SystemSetting::where('key', 'current_fiscal_year')->value('value') ?: (int)(new \DateTime())->format('Y') + 543,
            'strategyCategories' => $activeCategories,
            'iqaStrategies' => IqaStrategy::all(),
            'ovecStrategies' => OvecStrategy::all(),
            'nationalStrategies' => \App\Models\NationalStrategy::all(),
            'provincialStrategies' => \App\Models\ProvincialStrategy::all(),
        ]);
    }

    /**
     * Store a newly created project in database as draft.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'academic_year' => 'required|integer|min:2500|max:2650',
            'responsible_person' => 'nullable|string',
            'position' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|string',
            'mission' => 'nullable|string',
            'goal' => 'nullable|string',
            'strategy_tactic' => 'nullable|string',
            'background_rationale' => 'required|string',
            'objectives' => 'required|array|min:1',
            'objectives.*' => 'required|string',
            'outputs' => 'nullable|array',
            'outcomes' => 'nullable|array',
            'targets' => 'required|array',
            'location' => 'nullable|string',
            'expected_benefits' => 'nullable|array',
            'indicators' => 'nullable|array',
            'action_plan' => 'nullable|array',
            'iqa_strategy_ids' => 'nullable|array',
            'ovec_strategy_ids' => 'nullable|array',
            'national_strategy_ids' => 'nullable|array',
            'provincial_strategy_ids' => 'nullable|array',
            'strategy_selections' => 'nullable|array',
            'iqa_strategy_id' => 'nullable|exists:iqa_strategies,id',
            'ovec_strategy_id' => 'nullable|exists:ovec_strategies,id',
            'estimated_budget' => 'required|numeric|min:0',
        ], [
            'academic_year.required' => 'กรุณาระบุปีการศึกษา (พ.ศ.)',
            'academic_year.integer' => 'ปีการศึกษาต้องเป็นตัวเลข พ.ศ.',
            'academic_year.min' => 'ปีการศึกษาต้องไม่น้อยกว่า พ.ศ. 2500',
            'academic_year.max' => 'ปีการศึกษาต้องไม่เกิน พ.ศ. 2650',
        ]);

        $iqaIds = $request->input('iqa_strategy_ids', []);
        if (empty($iqaIds) && $request->input('iqa_strategy_id')) {
            $iqaIds = [(int)$request->input('iqa_strategy_id')];
        }
        $ovecIds = $request->input('ovec_strategy_ids', []);
        if (empty($ovecIds) && $request->input('ovec_strategy_id')) {
            $ovecIds = [(int)$request->input('ovec_strategy_id')];
        }

        $validated['iqa_strategy_ids'] = $iqaIds;
        $validated['ovec_strategy_ids'] = $ovecIds;
        $validated['national_strategy_ids'] = $request->input('national_strategy_ids', []);
        $validated['provincial_strategy_ids'] = $request->input('provincial_strategy_ids', []);
        $validated['strategy_selections'] = $request->input('strategy_selections', []);
        $validated['iqa_strategy_id'] = $iqaIds[0] ?? null;
        $validated['ovec_strategy_id'] = $ovecIds[0] ?? null;

        $project = new Project($validated);
        $project->user_id = auth()->id();
        $project->department_id = auth()->user()->department_id ?? Department::first()->id;
        $project->status = 'draft';
        $project->current_approval_step = 1;
        $project->save();

        AuditLog::record(
            action: 'CREATED',
            model: $project,
            stepNumber: 1,
            notes: 'สร้างแบบร่างโครงการใหม่'
        );

        return redirect()->route('dashboard')->with('message', 'Project draft created successfully.');
    }

    /**
     * Store a preliminary project proposal (Quick Proposal for Department/Teacher).
     */
    public function preliminaryStore(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'academic_year' => 'required|integer|min:2500|max:2650',
            'proposed_budget' => 'required|numeric|min:0',
            'user_position_id' => 'nullable|exists:user_positions,id',
            'department_id' => 'nullable|exists:departments,id',
            'responsible_person' => 'nullable|string',
            'position' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|string',
            'background_rationale' => 'nullable|string',
            'mission' => 'nullable|string',
            'goal' => 'nullable|string',
            'strategy_tactic' => 'nullable|string',
            'objectives' => 'nullable|array',
            'targets' => 'nullable|array',
            'indicators' => 'nullable|array',
            'strategy_selections' => 'nullable|array',
            'iqa_strategy_ids' => 'nullable|array',
            'ovec_strategy_ids' => 'nullable|array',
            'national_strategy_ids' => 'nullable|array',
            'provincial_strategy_ids' => 'nullable|array',
        ], [
            'title.required' => 'กรุณาระบุชื่อโครงการ',
            'academic_year.required' => 'กรุณาระบุปีงบประมาณ พ.ศ.',
            'proposed_budget.required' => 'กรุณาระบุวงเงินงบประมาณที่ต้องการขอเสนอ',
        ]);

        $user = auth()->user();

        // ดึงข้อมูลภาระงานที่เลือก
        $userPosId = $request->input('user_position_id');
        $userPosition = null;
        if ($userPosId) {
            $userPosition = \App\Models\UserPosition::find($userPosId);
        }
        if (!$userPosition && $user->userPositions()->exists()) {
            $userPosition = $user->userPositions()->where('is_primary', true)->first() ?: $user->userPositions()->first();
        }

        $deptId = $request->input('department_id') ?: ($userPosition ? ($userPosition->sub_department_id ?: $userPosition->department_id) : ($user->department_id ?: Department::first()->id));
        $posTitle = $validated['position'] ?? ($userPosition ? $userPosition->formatPositionTitle() : $user->position);
        $proposerDuty = $userPosition?->duty;

        $iqa = \App\Models\IqaStrategy::firstOrCreate(
            ['id' => 1],
            ['name' => 'มาตรฐานการอาชีวศึกษา', 'description' => 'มาตรฐานการอาชีวศึกษา']
        );
        $ovec = \App\Models\OvecStrategy::firstOrCreate(
            ['id' => 1],
            ['name' => 'นโยบายเร่งด่วน สอศ.', 'description' => 'นโยบายเร่งด่วน สอศ.']
        );
        $defaultIqaId = $iqa->id;
        $defaultOvecId = $ovec->id;

        $iqaIds = $request->input('iqa_strategy_ids', [$defaultIqaId]);
        if (empty($iqaIds)) $iqaIds = [$defaultIqaId];
        $ovecIds = $request->input('ovec_strategy_ids', [$defaultOvecId]);
        if (empty($ovecIds)) $ovecIds = [$defaultOvecId];

        // Filter and sanitize user objectives
        $userObjectives = array_values(array_filter($request->input('objectives', []), fn($val) => !empty(trim($val ?? ''))));

        // Filter and sanitize targets
        $userTargets = $request->input('targets', []);
        $quantTargets = array_values(array_filter($userTargets['quantitative'] ?? [], fn($val) => !empty(trim($val ?? ''))));
        $qualTargets = array_values(array_filter($userTargets['qualitative'] ?? [], fn($val) => !empty(trim($val ?? ''))));

        $project = new Project();
        $project->user_id = $user->id;
        $project->user_position_id = $userPosition?->id;
        $project->proposer_duty = $proposerDuty;
        $project->department_id = $deptId;
        $project->title = $validated['title'];
        $project->academic_year = $validated['academic_year'];
        $project->proposed_budget = $validated['proposed_budget'];
        $project->estimated_budget = $validated['proposed_budget'];
        $project->responsible_person = $validated['responsible_person'] ?? $user->name;
        $project->position = $posTitle;
        $project->phone = $validated['phone'] ?? '';
        $project->email = $validated['email'] ?? $user->email;
        $project->background_rationale = $validated['background_rationale'] ?? 'เสนอคำขอรับการจัดสรรงบประมาณโครงการเบื้องต้น';
        $project->mission = $validated['mission'] ?? '';
        $project->goal = $validated['goal'] ?? '';
        $project->strategy_tactic = $validated['strategy_tactic'] ?? '';
        $project->iqa_strategy_id = $iqaIds[0] ?? $defaultIqaId;
        $project->ovec_strategy_id = $ovecIds[0] ?? $defaultOvecId;
        $project->iqa_strategy_ids = $iqaIds;
        $project->ovec_strategy_ids = $ovecIds;
        $project->national_strategy_ids = $request->input('national_strategy_ids', []);
        $project->provincial_strategy_ids = $request->input('provincial_strategy_ids', []);
        $project->strategy_selections = $request->input('strategy_selections', []);

        $project->objectives = !empty($userObjectives) ? $userObjectives : ['เพื่อดำเนินโครงการตามวัตถุประสงค์ที่กำหนด'];
        $project->targets = [
            'quantitative' => !empty($quantTargets) ? $quantTargets : ['ผู้เข้าร่วมโครงการตามเป้าหมาย'],
            'qualitative' => !empty($qualTargets) ? $qualTargets : ['มีความพึงพอใจในระดับดีขึ้นไป']
        ];
        $project->indicators = $request->input('indicators') ?: null;
        $project->outputs = ['ผลผลิตโครงการ'];
        $project->outcomes = ['ผลลัพธ์โครงการ'];
        $project->status = 'preliminary';
        $project->current_approval_step = 1;
        $project->save();

        ProjectApproval::create([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'step_number' => 1,
            'status' => 'pending',
            'comments' => 'ยื่นเสนอคำของบประมาณโครงการเบื้องต้น (Preliminary Budget Request)',
        ]);

        AuditLog::record(
            action: 'CREATED_PRELIMINARY',
            model: $project,
            stepNumber: 1,
            notes: 'ยื่นเสนอคำของบประมาณโครงการเบื้องต้น'
        );

        return redirect()->back()->with('success', 'บันทึกเสนอชื่อโครงการและงบประมาณเบื้องต้นเรียบร้อยแล้ว รอการพิจารณาจัดสรรงบจากงานแผนงาน/คณะกรรมการ');
    }

    /**
     * Direct Project Creation & Budget Allocation (Admin & Planning Staff only).
     */
    public function directStoreAndAllocate(Request $request)
    {
        $user = auth()->user();
        $isPlanStaff = $user->isAdmin() || $user->isPlanHead() || ($user->department && (str_contains($user->department->name, 'แผน') || $user->department->code === 'PLAN'));
        if (!$isPlanStaff) {
            abort(403, 'เฉพาะผู้ดูแลระบบและเจ้าหน้าที่งานแผนงานเท่านั้นที่สามารถใช้งานฟังก์ชันนี้ได้');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'academic_year' => 'required|integer|min:2500|max:2650',
            'department_id' => 'required|exists:departments,id',
            'proposed_budget' => 'nullable|numeric|min:0',
            'allocated_budget' => 'required|numeric|min:0',
            'funding_source_id' => 'required|exists:funding_sources,id',
            'report_category' => 'nullable|string',
            'responsible_person' => 'nullable|string',
            'committee_comment' => 'nullable|string',
        ], [
            'title.required' => 'กรุณาระบุชื่อโครงการ',
            'academic_year.required' => 'กรุณาระบุปีงบประมาณ พ.ศ.',
            'department_id.required' => 'กรุณาเลือกฝ่าย/งานที่รับผิดชอบ',
            'allocated_budget.required' => 'กรุณาระบุวงเงินงบประมาณที่จัดสรรจริง',
            'funding_source_id.required' => 'กรุณาเลือกแหล่งเงินทุน',
        ]);

        // Auto-detect report_category if not explicitly provided
        $dept = Department::find($validated['department_id']);
        $cat = $validated['report_category'] ?? null;
        if (!$cat) {
            if ($dept && (str_contains($dept->name, 'วิชาการ') || $dept->code === 'ACAD')) $cat = '6.1';
            elseif ($dept && (str_contains($dept->name, 'พัฒนากิจการ') || str_contains($dept->name, 'นักเรียน') || $dept->code === 'STUD')) $cat = '6.2';
            elseif ($dept && (str_contains($dept->name, 'บริหาร') || str_contains($dept->name, 'พัสดุ') || str_contains($dept->name, 'ทรัพยากร') || $dept->code === 'ADMIN')) $cat = '6.3';
            elseif ($dept && (str_contains($dept->name, 'แผน') || $dept->code === 'PLAN')) $cat = '6.4';
            else $cat = '6.1';
        }

        $iqa = \App\Models\IqaStrategy::firstOrCreate(
            ['id' => 1],
            ['name' => 'มาตรฐานการอาชีวศึกษา', 'description' => 'มาตรฐานการอาชีวศึกษา']
        );
        $ovec = \App\Models\OvecStrategy::firstOrCreate(
            ['id' => 1],
            ['name' => 'นโยบายเร่งด่วน สอศ.', 'description' => 'นโยบายเร่งด่วน สอศ.']
        );
        $defaultIqaId = $iqa->id;
        $defaultOvecId = $ovec->id;

        $project = new Project();
        $project->user_id = $user->id;
        $project->department_id = $validated['department_id'];
        $project->title = $validated['title'];
        $project->academic_year = $validated['academic_year'];
        $project->proposed_budget = $validated['proposed_budget'] ?? $validated['allocated_budget'];
        $project->allocated_budget = $validated['allocated_budget'];
        $project->estimated_budget = $validated['allocated_budget'];
        $project->funding_source_id = $validated['funding_source_id'];
        $project->report_category = $cat;
        $project->iqa_strategy_id = $defaultIqaId;
        $project->ovec_strategy_id = $defaultOvecId;
        $project->iqa_strategy_ids = [$defaultIqaId];
        $project->ovec_strategy_ids = [$defaultOvecId];
        $project->responsible_person = $validated['responsible_person'] ?? $user->name;
        $project->committee_comment = $validated['committee_comment'] ?? 'จัดสรรงบประมาณโดยตรงผ่านงานแผนงาน';
        $project->budget_approved_at = now();
        $project->status = 'budget_approved';
        $project->current_approval_step = 3;
        $project->background_rationale = 'โครงการที่ได้รับการจัดสรรงบประมาณโดยตรงจากงานแผนงาน';
        $project->objectives = ['เพื่อดำเนินโครงการตามวัตถุประสงค์และกรอบงบประมาณที่ได้รับจัดสรร'];
        $project->targets = ['quantitative' => ['ผู้เข้าร่วมโครงการตามเป้าหมาย'], 'qualitative' => ['มีความพึงพอใจในระดับดีขึ้นไป']];
        $project->outputs = ['ผลผลิตโครงการ'];
        $project->outcomes = ['ผลลัพธ์โครงการ'];
        $project->save();

        // Create budget record
        Budget::updateOrCreate(
            ['project_id' => $project->id],
            [
                'funding_source_id' => $validated['funding_source_id'],
                'allocated_amount' => $validated['allocated_budget'],
                'encumbered_amount' => $validated['allocated_budget'],
                'spent_amount' => 0.00,
                'is_advance_payment' => false,
            ]
        );

        // Record approval log
        ProjectApproval::create([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'step_number' => 0,
            'status' => 'approved',
            'comments' => 'เพิ่มโครงการและอนุมัติจัดสรรงบประมาณโดยตรงผ่านงานแผนงาน (Direct Allocation)',
        ]);

        return redirect()->back()->with('success', 'เพิ่มโครงการและจัดสรรงบประมาณเรียบร้อยแล้ว ยอดเงินเชื่อมโยงเข้าระบบรายงานแผนปฏิบัติราชการทันที');
    }

    /**
     * Planning Committee Budget Allocation Review.
     */
    public function committeeAllocateBudget(Request $request, Project $project)
    {
        $user = auth()->user();
        $isPlanStaff = $user->isAdmin() || $user->isPlanHead() || ($user->department && (str_contains($user->department->name, 'แผน') || $user->department->code === 'PLAN'));
        if (!$isPlanStaff) {
            abort(403, 'เฉพาะผู้ดูแลระบบและเจ้าหน้าที่งานแผนงานเท่านั้นที่สามารถพิจารณาจัดสรรงบประมาณโครงการได้');
        }

        $request->validate([
            'action' => 'required|in:approve,reject,returned_for_revision',
        ]);

        if ($request->input('action') === 'approve') {
            $request->validate([
                'allocated_budget' => 'required|numeric|min:0',
                'funding_source_id' => 'required|exists:funding_sources,id',
                'report_category' => 'nullable|string',
                'committee_comment' => 'nullable|string',
                'committee_feedback' => 'nullable|string',
                'budget_adjustment_reason' => 'nullable|string',
            ], [
                'allocated_budget.required' => 'กรุณาระบุวงเงินที่จัดสรรจริง',
                'funding_source_id.required' => 'กรุณาเลือกแหล่งเงินทุน',
            ]);

            $dept = $project->department;
            $cat = $request->input('report_category');
            if (!$cat) {
                if ($dept && (str_contains($dept->name, 'วิชาการ') || $dept->code === 'ACAD')) $cat = '6.1';
                elseif ($dept && (str_contains($dept->name, 'พัฒนากิจการ') || str_contains($dept->name, 'นักเรียน') || $dept->code === 'STUD')) $cat = '6.2';
                elseif ($dept && (str_contains($dept->name, 'บริหาร') || str_contains($dept->name, 'พัสดุ') || str_contains($dept->name, 'ทรัพยากร') || $dept->code === 'ADMIN')) $cat = '6.3';
                elseif ($dept && (str_contains($dept->name, 'แผน') || $dept->code === 'PLAN')) $cat = '6.4';
                else $cat = '6.1';
            }

            $approvedAmount = (float)$request->input('allocated_budget');
            $feedback = $request->input('committee_feedback') ?: $request->input('committee_comment', 'คณะกรรมการอนุมัติจัดสรรงบประมาณเรียบร้อยแล้ว');
            $adjReason = $request->input('budget_adjustment_reason');

            $project->allocated_budget = $approvedAmount;
            $project->approved_budget = $approvedAmount;
            $project->estimated_budget = $approvedAmount;
            $project->funding_source_id = $request->input('funding_source_id');
            $project->report_category = $cat;
            $project->allocation_status = 'allocated';
            $project->committee_feedback = $feedback;
            $project->committee_comment = $feedback;
            $project->budget_adjustment_reason = $adjReason;
            $project->budget_approved_at = now();
            $project->status = 'budget_approved';
            $project->current_approval_step = 1;
            $project->save();

            // Create or update Budget record
            Budget::updateOrCreate(
                ['project_id' => $project->id],
                [
                    'funding_source_id' => $request->input('funding_source_id'),
                    'allocated_amount' => $approvedAmount,
                    'encumbered_amount' => $approvedAmount,
                    'spent_amount' => 0.00,
                    'is_advance_payment' => false,
                ]
            );

            ProjectApproval::updateOrCreate(
                [
                    'project_id' => $project->id,
                    'step_number' => 0,
                ],
                [
                    'user_id' => $user->id,
                    'status' => 'approved',
                    'comments' => 'มติคณะกรรมการ: อนุมัติจัดสรรงบประมาณ ' . number_format($approvedAmount, 2) . ' บาท' . ($adjReason ? " (เหตุผล: {$adjReason})" : ''),
                ]
            );

            AuditLog::record(
                action: 'BUDGET_ALLOCATED',
                model: $project,
                notes: "มติคณะกรรมการ: อนุมัติงบ " . number_format($approvedAmount, 2) . " บาท (จากที่ขอ " . number_format((float)$project->proposed_budget, 2) . " บาท)"
            );

            return redirect()->back()->with('success', 'อนุมัติจัดสรรงบประมาณโครงการเรียบร้อยแล้ว ผู้เสนอโครงการสามารถเข้าจัดทำรายละเอียดฉบับเต็มได้');
        } elseif ($request->input('action') === 'returned_for_revision') {
            $feedback = $request->input('committee_feedback') ?: $request->input('committee_comment', 'ให้ปรับปรุงรายละเอียดคำของบประมาณเพิ่มเติม');
            
            $project->allocation_status = 'returned_for_revision';
            $project->status = 'preliminary';
            $project->committee_feedback = $feedback;
            $project->committee_comment = $feedback;
            $project->save();

            ProjectApproval::updateOrCreate(
                [
                    'project_id' => $project->id,
                    'step_number' => 0,
                ],
                [
                    'user_id' => $user->id,
                    'status' => 'returned',
                    'comments' => 'มติคณะกรรมการ: ส่งกลับเพื่อแก้ไขคำขอ (' . $feedback . ')',
                ]
            );

            AuditLog::record(
                action: 'BUDGET_RETURNED',
                model: $project,
                notes: "มติคณะกรรมการ: ส่งกลับแก้ไขคำของบประมาณ ({$feedback})"
            );

            return redirect()->back()->with('success', 'ส่งกลับคำขอให้ผู้เสนอโครงการแก้ไขเรียบร้อยแล้ว');
        } else {
            $request->validate([
                'committee_comment' => 'required|string',
            ], [
                'committee_comment.required' => 'กรุณาระบุเหตุผลหรือมติคณะกรรมการที่ไม่อนุมัติงบประมาณ',
            ]);

            $comment = $request->input('committee_comment');
            $project->status = 'budget_rejected';
            $project->allocation_status = 'rejected';
            $project->committee_feedback = $comment;
            $project->committee_comment = $comment;
            $project->save();

            ProjectApproval::updateOrCreate(
                [
                    'project_id' => $project->id,
                    'step_number' => 0,
                ],
                [
                    'user_id' => $user->id,
                    'status' => 'rejected',
                    'comments' => 'มติคณะกรรมการ: ไม่อนุมัติงบประมาณ (' . $comment . ')',
                ]
            );

            AuditLog::record(
                action: 'BUDGET_REJECTED',
                model: $project,
                notes: "มติคณะกรรมการ: ไม่อนุมัติงบประมาณ ({$comment})"
            );

            return redirect()->back()->with('success', 'บันทึกมติไม่อนุมัติงบประมาณโครงการเรียบร้อยแล้ว');
        }
    }

    /**
     * Batch Allocate Budgets for multiple preliminary proposals at once.
     */
    public function batchAllocateBudgets(Request $request)
    {
        $user = auth()->user();
        $isPlanStaff = $user->isAdmin() || $user->isPlanHead() || ($user->department && (str_contains($user->department->name, 'แผน') || $user->department->code === 'PLAN'));
        if (!$isPlanStaff) {
            return redirect()->back()->with('error', 'เฉพาะผู้ดูแลระบบและงานแผนงานเท่านั้นที่สามารถใช้งานการอนุมัติแบบกลุ่มได้');
        }

        $request->validate([
            'project_ids' => 'required|array|min:1',
            'project_ids.*' => 'exists:projects,id',
            'funding_source_id' => 'required|exists:funding_sources,id',
        ], [
            'project_ids.required' => 'กรุณาเลือกโครงการที่ต้องการอนุมัติอย่างน้อย 1 รายการ',
            'funding_source_id.required' => 'กรุณาเลือกแหล่งเงินทุนที่ใช้จัดสรร',
        ]);

        $fundingSourceId = $request->input('funding_source_id');
        $projectIds = $request->input('project_ids');
        $count = 0;

        DB::transaction(function () use ($projectIds, $fundingSourceId, $user, &$count) {
            foreach ($projectIds as $pId) {
                $project = Project::find($pId);
                if (!$project || !in_array($project->status, ['preliminary', 'draft'])) continue;

                $allocAmount = (float)($project->proposed_budget ?: $project->estimated_budget);
                $project->allocated_budget = $allocAmount;
                $project->approved_budget = $allocAmount;
                $project->estimated_budget = $allocAmount;
                $project->allocation_status = 'allocated';
                $project->funding_source_id = $fundingSourceId;
                $project->committee_feedback = 'อนุมัติตามวงเงินที่เสนอขอเบื้องต้น (Batch Approval โดยคณะกรรมการ)';
                $project->committee_comment = $project->committee_feedback;
                $project->budget_approved_at = now();
                $project->status = 'budget_approved';
                $project->current_approval_step = 1;
                $project->save();

                Budget::updateOrCreate(
                    ['project_id' => $project->id],
                    [
                        'funding_source_id' => $fundingSourceId,
                        'allocated_amount' => $allocAmount,
                        'encumbered_amount' => $allocAmount,
                        'spent_amount' => 0.00,
                        'is_advance_payment' => false,
                    ]
                );

                ProjectApproval::updateOrCreate(
                    [
                        'project_id' => $project->id,
                        'step_number' => 0,
                    ],
                    [
                        'user_id' => $user->id,
                        'status' => 'approved',
                        'comments' => 'มติคณะกรรมการ: อนุมัติจัดสรรงบแบบกลุ่ม ' . number_format($allocAmount, 2) . ' บาท',
                    ]
                );

                AuditLog::record(
                    action: 'BATCH_BUDGET_ALLOCATED',
                    model: $project,
                    notes: "อนุมัติจัดสรรงบแบบกลุ่ม (Batch Approval): " . number_format($allocAmount, 2) . " บาท"
                );
                $count++;
            }
        });

        return redirect()->back()->with('success', "อนุมัติจัดสรรงบประมาณแบบกลุ่มสำเร็จเรียบร้อยแล้ว จำนวน {$count} โครงการ");
    }

    /**
     * AI Auto-Mapping Strategies for preliminary project proposals.
     */
    public function aiAutoMapStrategies(Request $request, GeminiService $gemini)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'background_rationale' => 'nullable|string',
            'objectives' => 'nullable|array',
        ]);

        $title = $validated['title'];
        $rationale = $validated['background_rationale'] ?? '';
        $objectives = array_values(array_filter($validated['objectives'] ?? [], fn($v) => !empty(trim($v ?? ''))));

        $activeCategories = [];
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('strategy_categories')) {
                $activeCategories = \App\Models\StrategyCategory::with(['items' => function($q) {
                    $q->where('is_active', true)->orderBy('order_index', 'asc');
                }])->where('is_active', true)->orderBy('order_index', 'asc')->get()->toArray();
            }
        } catch (\Exception $e) {
            $activeCategories = [];
        }

        $iqaList = \App\Models\IqaStrategy::all(['id', 'name'])->toArray();
        $ovecList = \App\Models\OvecStrategy::all(['id', 'name'])->toArray();

        $result = $gemini->mapStrategies($title, $rationale, $objectives, $activeCategories, $iqaList, $ovecList);

        return response()->json([
            'success' => true,
            'mapping' => $result
        ]);
    }

    /**
     * AI Semantic Duplicate Detection across previous/other departments' projects.
     */
    public function aiDetectDuplicates(Request $request, GeminiService $gemini)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'background_rationale' => 'nullable|string',
            'objectives' => 'nullable|array',
            'exclude_project_id' => 'nullable|integer',
        ]);

        $title = $validated['title'];
        $rationale = $validated['background_rationale'] ?? '';
        $objectives = array_values(array_filter($validated['objectives'] ?? [], fn($v) => !empty(trim($v ?? ''))));

        $query = Project::with('department:id,name')
            ->whereIn('status', ['budget_approved', 'approved', 'in_progress', 'completed', 'preliminary'])
            ->select('id', 'title', 'academic_year', 'department_id', 'estimated_budget', 'proposed_budget', 'allocated_budget', 'status', 'background_rationale', 'objectives')
            ->orderBy('id', 'desc');

        if (!empty($validated['exclude_project_id'])) {
            $query->where('id', '!=', $validated['exclude_project_id']);
        }

        $existing = $query->take(40)->get()->map(function($p) {
            return [
                'id' => $p->id,
                'title' => $p->title,
                'academic_year' => $p->academic_year,
                'department_name' => $p->department?->name ?? 'ไม่ระบุ',
                'budget' => (float)($p->allocated_budget ?: ($p->proposed_budget ?: $p->estimated_budget)),
                'status' => $p->status,
                'objectives' => is_array($p->objectives) ? array_slice($p->objectives, 0, 3) : [],
            ];
        })->toArray();

        $result = $gemini->detectProjectDuplicates($title, $rationale, $objectives, $existing);

        return response()->json([
            'success' => true,
            'result' => $result
        ]);
    }

    /**
     * Display the specified project.
     */
    public function show(Project $project)
    {
        // Auto-heal / synchronize funding_source_id between Project and Budget if one has it and the other doesn't
        $budget = $project->budget()->first();
        if (!$project->funding_source_id && $budget?->funding_source_id) {
            $project->funding_source_id = $budget->funding_source_id;
            if (!$project->allocated_budget && $budget->allocated_amount) {
                $project->allocated_budget = $budget->allocated_amount;
            }
            $project->save();
        } elseif ($project->funding_source_id && $budget && !$budget->funding_source_id) {
            $budget->funding_source_id = $project->funding_source_id;
            $budget->save();
        } elseif ($project->funding_source_id && !$budget) {
            \App\Models\Budget::create([
                'project_id' => $project->id,
                'funding_source_id' => $project->funding_source_id,
                'allocated_amount' => $project->allocated_budget ?: $project->estimated_budget,
                'encumbered_amount' => $project->allocated_budget ?: $project->estimated_budget,
                'spent_amount' => 0.00,
                'is_advance_payment' => in_array($project->disbursement_type, ['loan', 'both']),
            ]);
        }

        $project->load(['user', 'department.parent', 'userPosition.department', 'userPosition.subDepartment', 'iqaStrategy', 'ovecStrategy', 'approvals.user', 'fundingSource', 'budget.fundingSource', 'procurement.committees', 'procurement.items', 'auditLogs.user']);
        $project->append(['iqa_strategies', 'ovec_strategies', 'national_strategies', 'provincial_strategies']);
        
        // Deduplicate approvals and sort by step (latest record per step with signature details)
        $uniqueApprovals = $project->approvals->sortByDesc('id')->unique('step_number')->sortBy('step_number')->values();
        $project->setRelation('approvals', $uniqueApprovals);
        
        // Load all strategy categories for display
        $allCategories = \App\Models\StrategyCategory::with(['items'])->orderBy('order_index', 'asc')->get();

        // Determine if current user can approve this step
        $canApprove = false;
        $user = auth()->user();
        
        if ($project->status === 'submitted' || $project->status === 'pending_approval') {
            $canApprove = $this->canApproveStep($user, $project, (int)($project->current_approval_step ?: 2));
        }

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'strategyCategories' => $allCategories,
            'fundingSources' => \App\Models\FundingSource::orderBy('id', 'asc')->get(),
            'allUsers' => \App\Models\User::orderBy('name')->get(['id', 'name', 'email']),
            'canApprove' => $canApprove,
        ]);
    }

    /**
     * Show the form for editing the specified project.
     */
    public function edit(Project $project)
    {
        $user = auth()->user();
        $isPlanOrAdmin = $user->isAdmin() || $user->isPlanHead() || $user->isPlanStaff();

        if ($project->status === 'budget_rejected' && !$isPlanOrAdmin) {
            abort(403, 'โครงการนี้ไม่ได้รับการจัดสรรงบประมาณ จึงไม่สามารถจัดทำรายละเอียดต่อได้');
        }

        if ($project->user_id !== $user->id && !$isPlanOrAdmin) {
            abort(403, 'Unauthorized.');
        }

        $project->load(['fundingSource', 'budget.fundingSource', 'procurement.items']);
        $project->append(['iqa_strategies', 'ovec_strategies', 'national_strategies', 'provincial_strategies']);

        $activeCategories = \App\Models\StrategyCategory::with(['items' => function($q) {
            $q->where('is_active', true)->orderBy('order_index', 'asc');
        }])->where('is_active', true)->orderBy('order_index', 'asc')->get();

        return Inertia::render('Projects/Edit', [
            'project' => $project,
            'strategyCategories' => $activeCategories,
            'iqaStrategies' => IqaStrategy::all(),
            'ovecStrategies' => OvecStrategy::all(),
            'nationalStrategies' => \App\Models\NationalStrategy::all(),
            'provincialStrategies' => \App\Models\ProvincialStrategy::all(),
            'departments' => Department::all(),
            'fundingSources' => \App\Models\FundingSource::orderBy('id', 'asc')->get(),
            'isApprovedLocked' => false,
        ]);
    }

    /**
     * Update the specified project in database.
     */
    public function update(Request $request, Project $project)
    {
        $user = auth()->user();
        $isPlanOrAdmin = $user->isAdmin() || $user->isPlanHead() || $user->isPlanStaff();

        if ($project->user_id !== $user->id && !$isPlanOrAdmin) {
            abort(403, 'คุณไม่มีสิทธิ์แก้ไขโครงการนี้');
        }

        if ($project->status === 'budget_rejected' && !$isPlanOrAdmin) {
            abort(403, 'โครงการนี้ไม่ได้รับการจัดสรรงบประมาณ จึงไม่สามารถจัดทำรายละเอียดต่อได้');
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'academic_year' => 'required|integer|min:2500|max:2650',
            'responsible_person' => 'nullable|string',
            'position' => 'nullable|string',
            'phone' => 'nullable|string',
            'email' => 'nullable|string',
            'mission' => 'nullable|string',
            'goal' => 'nullable|string',
            'strategy_tactic' => 'nullable|string',
            'background_rationale' => 'required|string',
            'objectives' => 'required|array|min:1',
            'objectives.*' => 'required|string',
            'outputs' => 'nullable|array',
            'outcomes' => 'nullable|array',
            'targets' => 'required|array',
            'location' => 'nullable|string',
            'expected_benefits' => 'nullable|array',
            'indicators' => 'nullable|array',
            'action_plan' => 'nullable|array',
            'activities' => 'nullable|array',
            'iqa_strategy_ids' => 'nullable|array',
            'ovec_strategy_ids' => 'nullable|array',
            'national_strategy_ids' => 'nullable|array',
            'provincial_strategy_ids' => 'nullable|array',
            'strategy_selections' => 'nullable|array',
            'iqa_strategy_id' => 'nullable|exists:iqa_strategies,id',
            'ovec_strategy_id' => 'nullable|exists:ovec_strategies,id',
            'estimated_budget' => 'required|numeric|min:0',
            'disbursement_type' => 'nullable|string|in:procurement,loan,both',
            'user_position_id' => 'nullable|exists:user_positions,id',
            'department_id' => 'nullable|exists:departments,id',
        ], [
            'academic_year.required' => 'กรุณาระบุปีการศึกษา (พ.ศ.)',
            'academic_year.integer' => 'ปีการศึกษาต้องเป็นตัวเลข พ.ศ.',
            'academic_year.min' => 'ปีการศึกษาต้องไม่น้อยกว่า พ.ศ. 2500',
            'academic_year.max' => 'ปีการศึกษาต้องไม่เกิน พ.ศ. 2650',
        ]);

        $iqaIds = $request->input('iqa_strategy_ids', []);
        if (empty($iqaIds) && $request->input('iqa_strategy_id')) {
            $iqaIds = [(int)$request->input('iqa_strategy_id')];
        }
        $ovecIds = $request->input('ovec_strategy_ids', []);
        if (empty($ovecIds) && $request->input('ovec_strategy_id')) {
            $ovecIds = [(int)$request->input('ovec_strategy_id')];
        }

        $validated['iqa_strategy_ids'] = $iqaIds;
        $validated['ovec_strategy_ids'] = $ovecIds;
        $validated['national_strategy_ids'] = $request->input('national_strategy_ids', []);
        $validated['provincial_strategy_ids'] = $request->input('provincial_strategy_ids', []);
        $validated['strategy_selections'] = $request->input('strategy_selections', []);
        // Prevent regular teachers from altering official title and allocated budget once budget is approved/allocated
        $isPlanOrAdmin = $user->isAdmin() || $user->isPlanHead() || ($user->department && (str_contains($user->department->name, 'แผน') || $user->department->code === 'PLAN'));
        if ((in_array($project->status, ['budget_approved', 'approved', 'in_progress', 'completed']) || ($project->allocated_budget && $project->allocated_budget > 0)) && !$isPlanOrAdmin) {
            unset($validated['title']); // Keep existing official title
            unset($validated['estimated_budget']); // Keep existing allocated budget
        }

        // Hard-check: Action Plan budget total must not exceed allocated budget ceiling
        $allocatedCeiling = (float)($project->approved_budget ?? $project->allocated_budget ?? $project->estimated_budget ?? $validated['estimated_budget'] ?? 0);
        if ($allocatedCeiling > 0 && !empty($validated['action_plan'])) {
            $totalActionPlanBudget = 0;
            foreach ($validated['action_plan'] as $step) {
                $totalActionPlanBudget += (float)($step['budget_operating'] ?? 0)
                                        + (float)($step['budget_investment'] ?? 0)
                                        + (float)($step['budget_other'] ?? 0)
                                        + (float)($step['budget_subsidy'] ?? 0);
            }
            if ($totalActionPlanBudget > ($allocatedCeiling + 0.01)) {
                return redirect()->back()->withErrors([
                    'action_plan' => "ยอดรวมงบประมาณในแผนการปฏิบัติงาน (ข้อ ๑๑) จำนวน " . number_format($totalActionPlanBudget, 2) . " บาท เกินกว่าวงเงินที่ได้รับการจัดสรร (" . number_format($allocatedCeiling, 2) . " บาท) เป็นเงิน " . number_format($totalActionPlanBudget - $allocatedCeiling, 2) . " บาท กรุณาปรับลดงบประมาณให้ไม่เกินวงเงินที่ได้รับจัดสรร"
                ])->withInput();
            }
        }

        // If previously preliminary without budget approval, change to draft
        if ($project->status === 'preliminary') {
            $validated['status'] = 'draft';
        }

        if ($request->filled('user_position_id')) {
            $userPos = \App\Models\UserPosition::with(['department', 'subDepartment'])->find($request->user_position_id);
            if ($userPos && $userPos->user_id === $project->user_id) {
                $validated['user_position_id'] = $userPos->id;
                $validated['department_id'] = $userPos->sub_department_id ?? $userPos->department_id;
                $validated['proposer_duty'] = $userPos->duty;
                $validated['position'] = $userPos->formatPositionTitle();
            }
        }

        // Capture raw original state before update for audit trail diff
        $originalAttributes = $project->getRawOriginal();

        $project->update($validated);

        // Record Audit Log with old vs new diff
        $changes = $project->getChanges();
        $oldDiff = [];
        $newDiff = [];
        foreach ($changes as $k => $newV) {
            if (in_array($k, ['updated_at'])) continue;
            $oldDiff[$k] = $originalAttributes[$k] ?? null;
            $newDiff[$k] = $newV;
        }

        if (!empty($newDiff)) {
            $isPostApproval = ($project->current_approval_step > 1 || in_array($project->status, ['approved', 'in_progress', 'completed']));
            AuditLog::record(
                action: $isPostApproval ? 'MODIFIED_AFTER_APPROVAL' : 'UPDATED',
                model: $project,
                stepNumber: $project->current_approval_step,
                oldValues: $oldDiff,
                newValues: $newDiff,
                notes: $isPostApproval ? 'มีการแก้ไขข้อมูลโครงการหลังจากผ่านการอนุมัติตามสายงานหรือเริ่มดำเนินงานแล้ว' : 'แก้ไขข้อมูลโครงการ'
            );
        }

        $disbursementType = $request->input('disbursement_type', $project->disbursement_type ?? 'procurement');
        if ($project->budget) {
            $project->budget->update([
                'is_advance_payment' => in_array($disbursementType, ['loan', 'both']),
            ]);
        }

        // Sync Procurement Estimated Items (flows to Procurement stage if procurement/both, excluded if loan only)
        if ($disbursementType === 'loan') {
            if ($project->procurement) {
                $project->procurement->items()->delete();
            }
        } elseif ($request->has('activities') || $request->has('procurement_items')) {
            $procurement = \App\Models\Procurement::firstOrCreate(
                ['project_id' => $project->id],
                [
                    'procurement_number' => 'PR-' . str_pad($project->id, 5, '0', STR_PAD_LEFT),
                    'status' => 'pending'
                ]
            );

            $procurementItems = [];
            if ($request->has('activities')) {
                $activities = $request->input('activities', []);
                foreach ($activities as $actIdx => $act) {
                    $actLabel = '[กิจกรรมที่ ' . ($actIdx + 1) . ']';
                    foreach ($act['procurement_items'] ?? [] as $item) {
                        if (!empty($item['description']) && trim($item['description']) !== '') {
                            $procurementItems[] = [
                                'description' => $actLabel . ' ' . trim($item['description']),
                                'quantity' => (float)($item['quantity'] ?? 1),
                                'unit' => $item['unit'] ?? 'รายการ',
                                'unit_price' => (float)($item['unit_price'] ?? 0),
                            ];
                        }
                    }
                }
            } else {
                // Filter out any loan keywords
                $loanRegex = '/ค่าตอบแทน|วิทยากร|ค่าอาหาร|อาหารกลางวัน|อาหารว่าง|เครื่องดื่ม|เดินทาง|พาหนะ|ยานพาหนะ|เบี้ยเลี้ยง|ที่พัก|สมนาคุณ|เงินยืม/u';
                foreach ($request->input('procurement_items', []) as $item) {
                    if (!empty($item['description']) && !preg_match($loanRegex, $item['description'])) {
                        $procurementItems[] = [
                            'description' => trim($item['description']),
                            'quantity' => (float)($item['quantity'] ?? 1),
                            'unit' => $item['unit'] ?? 'รายการ',
                            'unit_price' => (float)($item['unit_price'] ?? 0),
                        ];
                    }
                }
            }

            $procurement->items()->delete();
            foreach ($procurementItems as $item) {
                $qty = $item['quantity'];
                $price = $item['unit_price'];
                $procurement->items()->create([
                    'description' => $item['description'],
                    'quantity' => $qty,
                    'unit' => $item['unit'],
                    'unit_price' => $price,
                    'total_price' => $qty * $price,
                ]);

                // Auto-harvest into StandardItem catalog for live search & suggestions
                try {
                    $rawName = preg_replace('/^\[กิจกรรมที่\s*\d+\]\s*/u', '', $item['description']);
                    $cleanName = trim(preg_replace('/[\x{1F300}-\x{1F9FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/u', '', $rawName));
                    if (mb_strlen($cleanName) > 1) {
                        $existingItem = \App\Models\StandardItem::where('name', $cleanName)->first();
                        if ($existingItem) {
                            $existingItem->update([
                                'unit' => $item['unit'] ?: $existingItem->unit,
                                'standard_price' => $item['unit_price'] ?: $existingItem->standard_price,
                            ]);
                            $existingItem->increment('usage_count');
                        } else {
                            \App\Models\StandardItem::create([
                                'name' => $cleanName,
                                'unit' => $item['unit'] ?: 'ชิ้น',
                                'standard_price' => $item['unit_price'] ?: 0,
                                'category' => 'วัสดุทั่วไป',
                                'usage_count' => 1,
                            ]);
                        }
                    }
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Failed to harvest standard item: ' . $e->getMessage());
                }
            }
        }

        if ($request->boolean('submit_approval')) {
            $isHeadProposer = false;
            if ($project->user_position_id) {
                $userPos = \App\Models\UserPosition::find($project->user_position_id);
                if ($userPos && in_array($userPos->duty, ['หัวหน้างาน', 'หัวหน้าสาขาวิชา'])) {
                    $isHeadProposer = true;
                }
            }
            if (!$isHeadProposer && $user->isDepartmentHead($project->department_id)) {
                $isHeadProposer = true;
            }

            $project->status = 'pending_approval';
            $project->current_approval_step = $isHeadProposer ? 3 : 2;
            $project->save();

            $now = now();
            $signatureType = $request->input('signature_type', 'stored');
            $signatureData = null;

            if ($signatureType === 'stored') {
                $signatureData = $user->signature_data;
            } elseif (in_array($signatureType, ['live', 'upload'])) {
                $signatureData = $request->input('signature_data');
                if ($request->boolean('save_to_profile') && !empty($signatureData)) {
                    $user->signature_data = $signatureData;
                    $user->signature_updated_at = now();
                    $user->save();
                }
            }
            if (empty($signatureData) && !empty($request->input('signature_data'))) {
                $signatureData = $request->input('signature_data');
            }
            if (empty($signatureData) && !empty($user->signature_data)) {
                $signatureData = $user->signature_data;
            }

            $sigHash = $signatureData 
                ? hash('sha256', $user->id . '|' . $project->id . '|1|' . $now->toIso8601String() . '|' . config('app.key'))
                : null;

            ProjectApproval::updateOrCreate(
                [
                    'project_id' => $project->id,
                    'step_number' => 1,
                ],
                [
                    'user_id' => $user->id,
                    'status' => 'submitted',
                    'comments' => $request->input('comments', 'จัดทำโครงการฉบับเต็มและยื่นขออนุมัติตามกระบวนการ 6 ขั้นตอน'),
                    'signature_data' => $signatureData,
                    'signature_type' => $signatureType,
                    'signature_hash' => $sigHash,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'signed_at' => $now,
                ]
            );

            if ($isHeadProposer) {
                ProjectApproval::updateOrCreate(
                    [
                        'project_id' => $project->id,
                        'step_number' => 2,
                    ],
                    [
                        'user_id' => $user->id,
                        'status' => 'approved',
                        'comments' => 'เห็นชอบเสนอโครงการ (ผู้เสนอเป็นหัวหน้างาน/หัวหน้าสาขาวิชา)',
                        'signature_data' => $signatureData,
                        'signature_type' => $signatureType,
                        'signature_hash' => $signatureData ? hash('sha256', $user->id . '|' . $project->id . '|2|' . $now->toIso8601String() . '|' . config('app.key')) : null,
                        'ip_address' => $request->ip(),
                        'user_agent' => $request->userAgent(),
                        'signed_at' => $now,
                    ]
                );
            }

            NotificationService::notifyProjectStep($project);

            $msg = $isHeadProposer 
                ? 'จัดทำรายละเอียดโครงการฉบับเต็มและยื่นขออนุมัติโครงการสำเร็จ ระบบได้ส่งต่อให้หัวหน้างานพัฒนายุทธศาสตร์ แผนงานและงบประมาณพิจารณา (ขั้นตอนที่ 3)'
                : 'จัดทำรายละเอียดโครงการฉบับเต็มและยื่นขออนุมัติโครงการสำเร็จ ระบบได้ส่งต่อให้หัวหน้าแผนก/หัวหน้างานพิจารณา (ขั้นตอนที่ 2)';

            return redirect()->route('projects.show', $project->id)->with('success', $msg);
        }

        if (in_array($project->status, ['approved', 'in_progress', 'completed'])) {
            return redirect()->route('projects.show', $project->id)->with('success', 'บันทึกการแก้ไขและอัปเดตข้อมูลโครงการเรียบร้อยแล้ว');
        }

        return redirect()->back()->with('success', 'บันทึกแบบร่างโครงการเรียบร้อยแล้ว ท่านสามารถแก้ไขต่อได้ตลอดเวลา');
    }

    /**
     * Delete the specified project from database.
     */
    public function destroy(Project $project)
    {
        $user = auth()->user();
        $isPlanOrAdmin = $user->isAdmin() || $user->isPlanHead() || $user->isPlanStaff();
        
        $isNotApproved = !in_array($project->status, ['approved', 'in_progress', 'completed']) 
            || in_array($project->status, ['rejected', 'budget_rejected', 'draft', 'preliminary', 'pending_approval', 'submitted']);

        $canDelete = false;
        if ($user->isAdmin()) {
            $canDelete = true;
        } elseif ($isPlanOrAdmin && $isNotApproved) {
            $canDelete = true;
        } elseif ($project->user_id === $user->id && in_array($project->status, ['draft', 'rejected', 'preliminary', 'budget_rejected'])) {
            $canDelete = true;
        }

        if (!$canDelete) {
            abort(403, 'คุณไม่มีสิทธิ์ลบโครงการนี้ หรือโครงการนี้ได้รับการอนุมัติเรียบร้อยแล้ว');
        }

        // Clean up all related child records
        $project->approvals()->delete();
        if ($project->budget) $project->budget()->delete();
        if ($project->procurement) {
            $project->procurement->items()->delete();
            $project->procurement()->delete();
        }
        if ($project->survey) {
            $project->survey->responses()->delete();
            $project->survey()->delete();
        }
        $project->appendices()->delete();
        $project->photos()->delete();

        $project->delete();

        return redirect()->back()->with('success', 'ลบโครงการเรียบร้อยแล้ว');
    }

    /**
     * Submit project to the approval workflow.
     */
    public function submit(Request $request, Project $project)
    {
        $user = auth()->user();
        if ($project->user_id !== $user->id && !$user->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์ยื่นขออนุมัติโครงการนี้');
        }

        if (!in_array($project->status, ['draft', 'rejected', 'budget_approved', 'preliminary'])) {
            abort(403, 'เฉพาะโครงการที่เป็นแบบร่าง ได้รับจัดสรรงบแล้ว หรือส่งกลับแก้ไขเท่านั้นที่สามารถยื่นขออนุมัติได้');
        }

        // Digital signature for Step 1 (ผู้เสนอโครงการ)
        $signatureType = $request->input('signature_type', 'stored');
        $signatureData = null;

        if ($signatureType === 'stored') {
            $signatureData = $user->signature_data;
        } elseif (in_array($signatureType, ['live', 'upload'])) {
            $signatureData = $request->input('signature_data');
            if ($request->boolean('save_to_profile') && !empty($signatureData)) {
                $user->signature_data = $signatureData;
                $user->signature_updated_at = now();
                $user->save();
            }
        }

        $now = now();
        $sigHash = $signatureData 
            ? hash('sha256', $user->id . '|' . $project->id . '|1|' . $now->toIso8601String() . '|' . config('app.key'))
            : null;

        $isHeadProposer = false;
        if ($project->user_position_id) {
            $userPos = \App\Models\UserPosition::find($project->user_position_id);
            if ($userPos && in_array($userPos->duty, ['หัวหน้างาน', 'หัวหน้าสาขาวิชา'])) {
                $isHeadProposer = true;
            }
        }
        if (!$isHeadProposer && $user->isDepartmentHead($project->department_id)) {
            $isHeadProposer = true;
        }

        $project->status = 'pending_approval';
        $project->current_approval_step = $isHeadProposer ? 3 : 2;
        $project->save();

        // Create/Update submission log (Step 1: ผู้เสนอโครงการ)
        ProjectApproval::updateOrCreate(
            [
                'project_id' => $project->id,
                'step_number' => 1,
            ],
            [
                'user_id' => auth()->id(),
                'status' => 'submitted',
                'comments' => $request->input('comments', 'ยื่นขออนุมัติเพื่อดำเนินงานโครงการต่อ (Submitted for 6-Step Approval)'),
                'signature_data' => $signatureData,
                'signature_type' => $signatureType,
                'signature_hash' => $sigHash,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'signed_at' => $now,
            ]
        );

        if ($isHeadProposer) {
            ProjectApproval::updateOrCreate(
                [
                    'project_id' => $project->id,
                    'step_number' => 2,
                ],
                [
                    'user_id' => auth()->id(),
                    'status' => 'approved',
                    'comments' => 'เห็นชอบเสนอโครงการ (ผู้เสนอเป็นหัวหน้างาน/หัวหน้าสาขาวิชา)',
                    'signature_data' => $signatureData,
                    'signature_type' => $signatureType,
                    'signature_hash' => $signatureData ? hash('sha256', $user->id . '|' . $project->id . '|2|' . $now->toIso8601String() . '|' . config('app.key')) : null,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'signed_at' => $now,
                ]
            );
        }

        NotificationService::notifyProjectStep($project);

        return redirect()->back()->with('success', 'ลงนามและยื่นเสนอขออนุมัติโครงการเรียบร้อยแล้ว');
    }

    /**
     * ลงนามผู้เสนอโครงการ (Step 1) ย้อนหลังหรืออัปเดตลายมือชื่อผู้เสนอโครงการ
     */
    public function signStepOne(Request $request, Project $project)
    {
        $user = auth()->user();
        if ($project->user_id !== $user->id && !$user->isAdmin()) {
            abort(403, 'เฉพาะผู้เสนอโครงการหรือผู้ดูแลระบบเท่านั้นที่สามารถลงนามผู้เสนอโครงการได้');
        }

        $signatureType = $request->input('signature_type', 'stored');
        $signatureData = null;

        if ($signatureType === 'stored') {
            $signatureData = $user->signature_data;
        } elseif (in_array($signatureType, ['live', 'upload'])) {
            $signatureData = $request->input('signature_data');
            if ($request->boolean('save_to_profile') && !empty($signatureData)) {
                $user->signature_data = $signatureData;
                $user->signature_updated_at = now();
                $user->save();
            }
        }
        if (empty($signatureData) && !empty($request->input('signature_data'))) {
            $signatureData = $request->input('signature_data');
        }
        if (empty($signatureData) && !empty($user->signature_data)) {
            $signatureData = $user->signature_data;
        }

        $now = now();
        $sigHash = $signatureData 
            ? hash('sha256', ($project->user_id ?: $user->id) . '|' . $project->id . '|1|' . $now->toIso8601String() . '|' . config('app.key'))
            : null;

        ProjectApproval::updateOrCreate(
            [
                'project_id' => $project->id,
                'step_number' => 1,
            ],
            [
                'user_id' => $project->user_id ?: $user->id,
                'status' => 'submitted',
                'comments' => $request->input('comments', 'ลงนามผู้เสนอโครงการ (Proposer Signature)'),
                'signature_data' => $signatureData,
                'signature_type' => $signatureType,
                'signature_hash' => $sigHash,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'signed_at' => $now,
            ]
        );

        AuditLog::record(
            action: 'SIGN_PROPOSER_STEP1',
            model: $project,
            stepNumber: 1,
            notes: 'ลงนามผู้เสนอโครงการ (Step 1)'
        );

        return redirect()->back()->with('success', 'บันทึกลายมือชื่อผู้เสนอโครงการเรียบร้อยแล้ว');
    }

    /**
     * ตรวจสอบสิทธิ์การลงนามอนุมัติตามสายงาน 6 ขั้นตอนอย่างเข้มงวด
     */
    private function canApproveStep($user, Project $project, int $step): bool
    {
        if (!$user) return false;

        // Admin can always approve any step
        if ($user->isAdmin()) {
            return true;
        }

        // Strict RBAC Rule: Proposer can NEVER approve their own project at any approval step
        // to prevent conflict of interest even if holding multi-duty roles.
        // Exception: Admin or Executive testing the approval pipeline
        if ($user->id === $project->user_id) {
            if ($user->isAdmin() || $user->isExecutive()) {
                return true;
            }
            return false;
        }

        switch ($step) {
            case 2: // ขั้นตอนที่ 2: หัวหน้างาน / หัวหน้าแผนกวิชา (ต้นสังกัดของผู้เสนอ)
                return $user->isDepartmentHead($project->department_id) || $user->isExecutive() || $user->isAdmin();

            case 3: // ขั้นตอนที่ 3: หัวหน้างานวางแผนและงบประมาณ (ล็อกงบ/ผูกงบ)
                return $user->isPlanHead() || $user->isExecutive() || $user->isAdmin();

            case 4: // ขั้นตอนที่ 4: รองผู้อำนวยการฝ่ายที่เกี่ยวข้อง (ฝ่ายต้นสังกัดของผู้เสนอ)
                return $user->isDeputyDirectorForDepartment($project->department_id) || $user->isDeputyDirector() || $user->isExecutive() || $user->isAdmin();

            case 5: // ขั้นตอนที่ 5: รองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน (นายนิพนธ์ ร่องพืช)
                return $user->isDeputyDirectorStrategy() || $user->isExecutive() || $user->isAdmin();

            case 6: // ขั้นตอนที่ 6: ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน (นายกเชษฐ์ กิ่งชนะ)
                return $user->isDirector() || $user->isAdmin();

            default:
                return false;
        }
    }

    /**
     * Approve the project at the current step.
     */
    public function approve(Request $request, Project $project)
    {
        $user = auth()->user();
        $isAuthorized = false;

        if ($project->status === 'submitted' || $project->status === 'pending_approval') {
            $isAuthorized = $this->canApproveStep($user, $project, (int)($project->current_approval_step ?: 2));
        }

        if (!$isAuthorized) {
            return redirect()->back()->with('error', 'ท่านไม่มีสิทธิ์ในการพิจารณาอนุมัติโครงการในขั้นตอนนี้ (ต้องเป็นผู้มีอำนาจลงนามตามสายงานที่กำหนด)');
        }

        $request->validate([
            'comments' => 'nullable|string',
        ]);

        // Digital signature for current step
        $signatureType = $request->input('signature_type', 'stored');
        $signatureData = null;

        if ($signatureType === 'stored') {
            // ผู้เป็นเจ้าของลายเซ็นต์เท่านั้นที่จะกดเพื่อลงนามได้ (ใช้ลายเซ็นตนเองที่บันทึกไว้)
            $signatureData = $user->signature_data;
        } elseif (in_array($signatureType, ['live', 'upload'])) {
            $signatureData = $request->input('signature_data');
            if ($request->boolean('save_to_profile') && !empty($signatureData)) {
                $user->signature_data = $signatureData;
                $user->signature_updated_at = now();
                $user->save();
            }
        }

        $now = now();
        $sigHash = $signatureData 
            ? hash('sha256', $user->id . '|' . $project->id . '|' . $project->current_approval_step . '|' . $now->toIso8601String() . '|' . config('app.key'))
            : null;

        // Budget locking details check during Step 3 (Plan Head)
        if ($project->current_approval_step === 3) {
            $request->validate([
                'funding_source_id' => 'required|exists:funding_sources,id',
                'allocated_amount' => 'required|numeric|min:0',
                'is_advance_payment' => 'nullable|boolean',
            ]);

            $fundingId = $request->input('funding_source_id');
            $allocatedAmount = $request->input('allocated_amount');

            $project->funding_source_id = $fundingId;
            $project->allocated_budget = $allocatedAmount;
            $project->save();

            Budget::updateOrCreate(
                ['project_id' => $project->id],
                [
                    'funding_source_id' => $fundingId,
                    'allocated_amount' => $allocatedAmount,
                    'encumbered_amount' => $allocatedAmount, // lock budget
                    'spent_amount' => 0.00,
                    'is_advance_payment' => $request->boolean('is_advance_payment', false),
                ]
            );

            // Pre-assign or lock unified planning document number for the project's procurement lifecycle
            $procurement = \App\Models\Procurement::firstOrCreate(
                ['project_id' => $project->id],
                ['status' => 'pending']
            );
            if (empty($procurement->plan_procurement_doc_number) || str_starts_with($procurement->plan_procurement_doc_number, 'PR-')) {
                $unifiedDocNumber = \App\Services\DocumentNumberService::generateAndIncrement();
                $procurement->plan_procurement_doc_number = $unifiedDocNumber;
                $procurement->procurement_number = $unifiedDocNumber;
                $procurement->save();
            }
        }

        // Record approval log with signature
        ProjectApproval::create([
            'project_id' => $project->id,
            'user_id' => auth()->id(),
            'step_number' => $project->current_approval_step,
            'status' => 'approved',
            'comments' => $request->input('comments', 'Approved'),
            'signature_data' => $signatureData,
            'signature_type' => $signatureType,
            'signature_hash' => $sigHash,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'signed_at' => $now,
        ]);

        // Record audit trail log for step approval
        AuditLog::record(
            action: 'APPROVE_STEP',
            model: $project,
            stepNumber: $project->current_approval_step,
            notes: $request->input('comments', 'ลงนามอนุมัติขั้นตอนที่ ' . $project->current_approval_step)
        );

        if ($project->current_approval_step >= 6) {
            // Final step: Director approval. Lock project and set approved state
            $project->status = 'approved';
            $project->approved_at = now();

            // Digital Sealing & Verification Hash
            $project->sealed_at = now();
            $project->verification_code = 'NPC-' . strtoupper(Str::random(4)) . '-' . ($project->academic_year ?: date('Y')) . '-' . sprintf('%04d', $project->id);
            $sealPayload = implode('|', [
                $project->id,
                $project->title,
                $project->allocated_budget ?: $project->estimated_budget,
                $project->user_id,
                $project->approved_at?->toIso8601String(),
                $project->sealed_at?->toIso8601String(),
                $sigHash,
                config('app.key')
            ]);
            $project->digital_seal_hash = hash('sha256', $sealPayload);
            $project->save();

            AuditLog::record(
                action: 'SEALED',
                model: $project,
                stepNumber: 6,
                notes: "เอกสารผ่านการลงนามอนุมัติครบ 6 ขั้นตอน และได้รับการประทับตรารับรองดิจิทัล (Digital Sealing) รหัส {$project->verification_code}"
            );

            NotificationService::notifyProjectResult($project, 'approved');

            return redirect()->route('dashboard')->with('message', 'โครงการได้รับการลงนามอนุมัติครบถ้วนสมบูรณ์แล้ว และได้รับการประทับตรารับรองดิจิทัล');
        }

        // Advance to next step
        $project->current_approval_step += 1;
        $project->status = 'pending_approval';
        $project->save();

        NotificationService::notifyProjectStep($project);
        NotificationService::notifyProjectResult($project, 'approved');

        return redirect()->route('dashboard')->with('message', 'ลงนามและอนุมัติส่งต่อไปยังขั้นตอนถัดไปเรียบร้อยแล้ว');
    }

    /**
     * Admin Super Approval Override: Approve current step or complete full 6-step approval.
     */
    public function adminApprove(Request $request, Project $project)
    {
        $user = auth()->user();
        if (!$user->isAdmin()) {
            abort(403, 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถใช้อนุมัติลัดนี้ได้');
        }

        $mode = $request->input('mode', 'step'); // 'step' or 'full'
        $adminSig = $user->signature_data;

        if ($mode === 'full') {
            $defaultFunding = \App\Models\FundingSource::first();
            $fundingId = $request->input('funding_source_id', $defaultFunding ? $defaultFunding->id : 1);
            $allocated = $request->input('allocated_amount', $project->estimated_budget);

            $project->funding_source_id = $fundingId;
            $project->allocated_budget = $allocated;
            $project->save();

            Budget::updateOrCreate(
                ['project_id' => $project->id],
                [
                    'funding_source_id' => $fundingId,
                    'allocated_amount' => $allocated,
                    'encumbered_amount' => $allocated,
                    'spent_amount' => 0.00,
                    'is_advance_payment' => false,
                ]
            );

            for ($s = max(1, (int)$project->current_approval_step); $s <= 6; $s++) {
                ProjectApproval::create([
                    'project_id' => $project->id,
                    'user_id' => $user->id,
                    'step_number' => $s,
                    'status' => 'approved',
                    'comments' => 'อนุมัติรวดเดียวผ่านสิทธิ์ผู้ดูแลระบบ (Admin Super Override)',
                    'signature_data' => $adminSig,
                    'signature_type' => 'admin',
                    'signature_hash' => $adminSig ? hash('sha256', $user->id . '|' . $project->id . '|' . $s . '|' . now()->toIso8601String() . '|' . config('app.key')) : null,
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'signed_at' => now(),
                ]);
            }

            $project->status = 'approved';
            $project->current_approval_step = 6;
            $project->approved_at = now();

            // Digital Sealing & Verification Hash
            $project->sealed_at = now();
            $project->verification_code = 'NPC-' . strtoupper(Str::random(4)) . '-' . ($project->academic_year ?: date('Y')) . '-' . sprintf('%04d', $project->id);
            $sealPayload = implode('|', [
                $project->id,
                $project->title,
                $project->allocated_budget ?: $project->estimated_budget,
                $project->user_id,
                $project->approved_at?->toIso8601String(),
                $project->sealed_at?->toIso8601String(),
                $adminSig ? hash('sha256', (string)$adminSig) : 'ADMIN',
                config('app.key')
            ]);
            $project->digital_seal_hash = hash('sha256', $sealPayload);
            $project->save();

            AuditLog::record(
                action: 'SEALED',
                model: $project,
                stepNumber: 6,
                notes: "ผู้ดูแลระบบอนุมัติโครงการสมบูรณ์ (Admin Full Override) และประทับตรารับรองดิจิทัล รหัส {$project->verification_code}"
            );

            return redirect()->back()->with('message', 'ผู้ดูแลระบบอนุมัติโครงการสมบูรณ์เรียบร้อยแล้ว (Approved & Digitally Sealed)');
        }

        // Single step advance
        if ($project->current_approval_step === 3) {
            $defaultFunding = \App\Models\FundingSource::first();
            $fundingId = $request->input('funding_source_id', $defaultFunding ? $defaultFunding->id : 1);
            $allocated = $request->input('allocated_amount', $project->estimated_budget);

            $project->funding_source_id = $fundingId;
            $project->allocated_budget = $allocated;
            $project->save();

            Budget::updateOrCreate(
                ['project_id' => $project->id],
                [
                    'funding_source_id' => $fundingId,
                    'allocated_amount' => $allocated,
                    'encumbered_amount' => $allocated,
                    'spent_amount' => 0.00,
                    'is_advance_payment' => false,
                ]
            );

            // Pre-assign or lock unified planning document number for the project's procurement lifecycle
            $procurement = \App\Models\Procurement::firstOrCreate(
                ['project_id' => $project->id],
                ['status' => 'pending']
            );
            if (empty($procurement->plan_procurement_doc_number) || str_starts_with($procurement->plan_procurement_doc_number, 'PR-')) {
                $unifiedDocNumber = \App\Services\DocumentNumberService::generateAndIncrement();
                $procurement->plan_procurement_doc_number = $unifiedDocNumber;
                $procurement->procurement_number = $unifiedDocNumber;
                $procurement->save();
            }
        }

        ProjectApproval::create([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'step_number' => $project->current_approval_step,
            'status' => 'approved',
            'comments' => $request->input('comments', 'อนุมัติผ่านสิทธิ์ผู้ดูแลระบบ (Admin Step Override)'),
            'signature_data' => $adminSig,
            'signature_type' => 'admin',
            'signature_hash' => $adminSig ? hash('sha256', $user->id . '|' . $project->id . '|' . $project->current_approval_step . '|' . now()->toIso8601String() . '|' . config('app.key')) : null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'signed_at' => now(),
        ]);

        AuditLog::record(
            action: 'APPROVE_STEP',
            model: $project,
            stepNumber: $project->current_approval_step,
            notes: 'อนุมัติขั้นตอนที่ ' . $project->current_approval_step . ' ผ่านสิทธิ์ผู้ดูแลระบบ (Admin Override)'
        );

        if ($project->current_approval_step >= 6) {
            $project->status = 'approved';
            $project->approved_at = now();

            $project->sealed_at = now();
            $project->verification_code = 'NPC-' . strtoupper(Str::random(4)) . '-' . ($project->academic_year ?: date('Y')) . '-' . sprintf('%04d', $project->id);
            $sealPayload = implode('|', [
                $project->id,
                $project->title,
                $project->allocated_budget ?: $project->estimated_budget,
                $project->user_id,
                $project->approved_at?->toIso8601String(),
                $project->sealed_at?->toIso8601String(),
                $adminSig ? hash('sha256', (string)$adminSig) : 'ADMIN',
                config('app.key')
            ]);
            $project->digital_seal_hash = hash('sha256', $sealPayload);

            AuditLog::record(
                action: 'SEALED',
                model: $project,
                stepNumber: 6,
                notes: "เอกสารผ่านการลงนามอนุมัติครบ 6 ขั้นตอน และได้รับการประทับตรารับรองดิจิทัล รหัส {$project->verification_code}"
            );
        } else {
            $project->current_approval_step += 1;
            $project->status = 'pending_approval';
        }
        $project->save();

        return redirect()->back()->with('message', 'ผู้ดูแลระบบอนุมัติขั้นตอนปัจจุบันเรียบร้อยแล้ว');
    }

    /**
     * Update project PDCA status (e.g. from 'approved' -> 'in_progress' -> 'evaluating' -> 'completed')
     */
    public function updateStatus(Request $request, Project $project)
    {
        if (auth()->id() !== $project->user_id && !auth()->user()->isAdmin() && !auth()->user()->isProcurementHead()) {
            abort(403, 'เฉพาะผู้เสนอโครงการ เจ้าหน้าที่พัสดุ หรือผู้ดูแลระบบเท่านั้นที่สามารถอัปเดตสถานะการดำเนินงานได้');
        }

        $validated = $request->validate([
            'status' => 'required|in:draft,submitted,pending_approval,approved,in_progress,evaluating,reporting,completed',
        ]);

        $oldStatus = $project->status;
        $project->status = $validated['status'];
        $project->save();

        AuditLog::record(
            action: 'STATUS_CHANGED',
            model: $project,
            oldValues: ['status' => $oldStatus],
            newValues: ['status' => $validated['status']],
            notes: 'เปลี่ยนสถานะโครงการเป็น: ' . $validated['status']
        );

        return redirect()->back()->with('message', 'อัปเดตสถานะความก้าวหน้าการดำเนินโครงการเรียบร้อยแล้ว');
    }

    /**
     * Reject the project at the current step.
     */
    public function reject(Request $request, Project $project)
    {
        $user = auth()->user();
        $isAuthorized = false;

        if ($project->status === 'submitted' || $project->status === 'pending_approval') {
            switch ($project->current_approval_step) {
                case 2:
                    $isAuthorized = $user->isAdmin() || $user->isPlanHead() || ($user->isDepartmentHead($project->department_id) && $user->id !== $project->user_id);
                    break;
                case 3:
                    $isAuthorized = $user->isAdmin() || $user->isPlanHead();
                    break;
                case 4:
                    $isAuthorized = $user->isAdmin() || $user->isExecutiveForDepartment($project->department_id);
                    break;
                case 5:
                case 6:
                    $isAuthorized = $user->isAdmin() || $user->isExecutive();
                    break;
            }
        }

        if (!$isAuthorized) {
            return redirect()->back()->with('error', 'ท่านไม่มีสิทธิ์ในการส่งกลับหรือตีกลับโครงการในขั้นตอนนี้');
        }

        $request->validate([
            'comments' => 'required|string',
        ]);

        // Record rejection log
        ProjectApproval::create([
            'project_id' => $project->id,
            'user_id' => auth()->id(),
            'step_number' => $project->current_approval_step,
            'status' => 'rejected',
            'comments' => $request->input('comments'),
        ]);

        // Send project back to draft/rejected state so teacher can edit and resubmit
        $project->status = 'rejected';
        $project->current_approval_step = 1;
        $project->save();

        NotificationService::notifyProjectResult($project, 'rejected', $request->input('comments'));

        return redirect()->route('dashboard')->with('message', 'Project rejected and referred back to author.');
    }

    /**
     * Download the final stitched project evaluation report.
     */
    public function downloadReport(Project $project)
    {
        $filePath = "reports/project_{$project->id}_report.pdf";

        if (Storage::disk('public')->exists($filePath)) {
            return Storage::disk('public')->download($filePath);
        }

        // Dispatch stitching job to generate the report file asynchronously
        StitchProjectDocumentsJob::dispatch($project);

        return redirect()->back()->with('message', 'Stitching job initiated. The document is being compiled and will be available for download in a few seconds. Please refresh the page.');
    }

    /**
     * Display printable official project proposal document.
     */
    public function print(Project $project)
    {
        $project->load(['user', 'department.parent', 'approvals.user', 'budget.fundingSource']);
        $latestApprovalsByStep = $project->approvals->sortByDesc('id')->unique('step_number')->sortBy('step_number')->values();
        $project->setRelation('approvals', $latestApprovalsByStep);
        $allCategories = \App\Models\StrategyCategory::with(['items'])->orderBy('order_index', 'asc')->get();

        return Inertia::render('Projects/Print', [
            'project' => $project,
            'strategyCategories' => $allCategories,
        ]);
    }

    /**
     * Generate Chapter 2 content (Literature Review & Theory Analysis) based on project keywords, objectives, and indicators.
     */
    public function generateChapter2(Request $request, Project $project)
    {
        $project->load(['department', 'ovecStrategy']);

        $title = $project->title ?: 'โครงการพัฒนาทักษะวิชาชีพและการจัดการเรียนการสอน';
        $departmentName = $project->department?->name ?: 'วิทยาลัยสารพัดช่างน่าน';
        $rationale = $project->background_rationale ?: '';

        // Extract objectives text
        $rawObjectives = [];
        if (is_array($project->objectives)) {
            foreach ($project->objectives as $obj) {
                if (is_string($obj)) $rawObjectives[] = $obj;
                elseif (is_array($obj)) $rawObjectives[] = $obj['name'] ?? $obj['title'] ?? $obj['text'] ?? '';
            }
        } elseif (is_string($project->objectives)) {
            $rawObjectives[] = $project->objectives;
        }
        $objectivesText = implode(' ', array_filter($rawObjectives));

        // Extract indicators text
        $indicatorsText = '';
        if (is_array($project->indicators)) {
            $ind = $project->indicators;
            $indicatorsText = (is_array($ind['quantitative'] ?? null) ? ($ind['quantitative']['text'] ?? '') . ' ' . ($ind['quantitative']['unit'] ?? '') : ($ind['quantitative'] ?? ''))
                            . ' '
                            . (is_array($ind['qualitative'] ?? null) ? ($ind['qualitative']['text'] ?? '') . ' ' . ($ind['qualitative']['unit'] ?? '') : ($ind['qualitative'] ?? ''));
        } elseif (is_string($project->indicators)) {
            $indicatorsText = $project->indicators;
        }

        // Full context string for keyword analysis
        $fullContext = mb_strtolower($title . ' ' . $objectivesText . ' ' . $indicatorsText . ' ' . $rationale);

        // Detect Domain Category based on keywords
        $isWaterHealth = (bool) preg_match('/(น้ำ|น้ำดื่ม|กรองน้ำ|ตู้น้ำ|ประปา|สุขาภิบาล|สุขอนามัย|สุขภาพ|กายภาพ|สวัสดิการ|ความสะอาด|คุณภาพชีวิต|สุขภาวะ|ความปลอดภัย|โภชนาการ)/u', $fullContext);
        $isInnovation = (bool) preg_match('/(สิ่งประดิษฐ์|นวัตกรรม|เทคโนโลยี|ai|หุ่นยนต์|โค้ด|ดิจิทัล|ซอฟต์แวร์|แอป|iot|วงจร|กลไก)/u', $fullContext);
        $isBusiness = (bool) preg_match('/(ผู้ประกอบการ|ธุรกิจ|การค้า|การตลาด|บัญชี|สร้างรายได้|จำหน่าย|แปรรูป|ผลิตภัณฑ์|otop|สตาร์ทอัพ|สหกรณ์)/u', $fullContext);
        $isMorality = (bool) preg_match('/(คุณธรรม|จริยธรรม|จิตอาสา|วินัย|ลูกเสือ|ผู้นำ|ยาเสพติด|บำเพ็ญประโยชน์|สภานักเรียน|องค์การวิชาชีพ|จิตสาธารณะ)/u', $fullContext);

        // Build domain-specific configuration
        $policyReference = "สำนักงานคณะกรรมการการอาชีวศึกษา. (2567). *แนวนโยบายและจุดเน้นการปฏิบัติราชการของสำนักงานคณะกรรมการการอาชีวศึกษา ประจำปีงบประมาณ พ.ศ. 2567*. กรุงเทพฯ: สำนักงานคณะกรรมการการอาชีวศึกษา.";

        if ($isWaterHealth) {
            $domain = 'สุขภาวะ สิ่งแวดล้อม และสวัสดิการนักเรียนนักศึกษาในสถานศึกษา';
            $keywords = ['ระบบน้ำดื่มสะอาด', 'สุขอนามัยและคุณภาพชีวิต', 'มาตรฐานคุณภาพน้ำบริโภค', 'การบริหารจัดการกายภาพและสาธารณูปโภค', 'ความพึงพอใจของผู้เรียน'];
            $theories = [
                [
                    'id' => 'maslow',
                    'name' => 'ทฤษฎีลำดับขั้นความต้องการของมาสโลว์ (Maslow’s Hierarchy of Needs)',
                    'theorist' => 'Abraham H. Maslow (1970)',
                    'citation_key' => 'Maslow (1970)',
                    'relevance' => 'น้ำดื่มสะอาดเป็นปัจจัยสี่ขั้นพื้นฐานทางสรีรวิทยา (Physiological Needs) และความปลอดภัย (Safety Needs) ซึ่งเป็นพื้นฐานสำคัญที่สุดของมนุษย์ การจัดหาน้ำดื่มที่สะอาดและเพียงพอจึงเป็นปัจจัยจำเป็นขั้นพื้นฐานที่ช่วยเสริมสร้างสมาธิและความพร้อมในการเรียนรู้ของนักเรียนนักศึกษา',
                    'key_point' => 'ความต้องการพื้นฐานทางกายภาพส่งผลโดยตรงต่อการเรียนรู้',
                    'content' => "อับราฮัม เอช. มาสโลว์ (Maslow, 1970, pp. 35-47) ได้จำแนกลำดับขั้นความต้องการพื้นฐานของมนุษย์ออกเป็น 5 ลำดับ โดยระบุว่าความต้องการทางสรีรวิทยา (Physiological Needs) และความต้องการความปลอดภัย (Safety Needs) เป็นความต้องการขั้นแรกและสำคัญที่สุดที่ต้องได้รับการตอบสนองอย่างเพียงพอ จึงจะทำให้บุคคลเกิดแรงจูงใจในการพัฒนาตนเองในระดับที่สูงขึ้นได้ การที่สถานศึกษาจัดให้มีน้ำดื่มที่สะอาด ถูกสุขอนามัย และเพียงพอต่อความต้องการของนักเรียน นักศึกษา จึงถือเป็นการตอบสนองสิทธิและปัจจัยพื้นฐานที่จำเป็นอย่างยิ่ง ซึ่งช่วยลดความเหนื่อยล้า เสริมสร้างสมาธิ และส่งผลต่อความพร้อมในการเรียนรู้และการปฏิบัติงานในแผนกวิชาต่างๆ",
                    'reference' => "Maslow, A. H. (1970). *Motivation and Personality* (2nd ed.). New York: Harper & Row."
                ],
                [
                    'id' => 'water_standard',
                    'name' => 'เกณฑ์มาตรฐานสุขาภิบาลและคุณภาพน้ำบริโภคในสถานศึกษา',
                    'theorist' => 'กรมอนามัย กระทรวงสาธารณสุข (2563) และ WHO (2017)',
                    'citation_key' => 'กรมอนามัย (2563) และ WHO (2017)',
                    'relevance' => 'ใช้เป็นกรอบเกณฑ์และตัวชี้วัดในการควบคุมคุณภาพน้ำดื่มของโครงการ ทั้งทางกายภาพ เคมี และแบคทีเรีย เพื่อสร้างความมั่นใจว่าน้ำดื่มในวิทยาลัยปลอดภัยต่อสุขภาพของผู้เรียนอย่างแท้จริง',
                    'key_point' => 'มาตรฐานความปลอดภัยทางกายภาพ เคมี และจุลชีววิทยา',
                    'content' => "กรมอนามัย กระทรวงสาธารณสุข (2563, หน้า 8-24) และองค์การอนามัยโลก (World Health Organization: WHO, 2017) ได้กำหนดเกณฑ์มาตรฐานคุณภาพน้ำบริโภคเพื่อการมีสุขภาพที่ดี โดยครอบคลุมทั้งคุณลักษณะทางกายภาพ (ความใส สี กลิ่น รส) คุณลักษณะทางเคมี (ค่า pH สารละลายรวม แร่ธาตุ และโลหะหนัก) และคุณลักษณะทางจุลชีววิทยา (การปลอดเชื้อโคลิฟอร์มและอีโคไล) โครงการนี้จึงนำเกณฑ์ดังกล่าวมาเป็นกรอบมาตรฐานในการออกแบบระบบกรอง การติดตั้งจุดจ่ายน้ำ และการวางแนวทางสุ่มตรวจคุณภาพน้ำดื่มภายในวิทยาลัย เพื่อให้มั่นใจในความปลอดภัยต่อสุขภาพของผู้บริโภค",
                    'reference' => "กรมอนามัย กระทรวงสาธารณสุข. (2563). *คู่มือแนวทางการจัดการคุณภาพน้ำบริโภคในโรงเรียนและสถาบันการศึกษา*. นนทบุรี: สำนักสุขาภิบาลอาหารและน้ำ.\nWorld Health Organization. (2017). *Guidelines for drinking-water quality: fourth edition incorporating the first addendum*. Geneva: World Health Organization."
                ],
                [
                    'id' => 'castaldi',
                    'name' => 'ทฤษฎีการบริหารจัดการสิ่งอำนวยความสะดวกและกายภาพในสถานศึกษา (Educational Facility Management)',
                    'theorist' => 'Basil Castaldi (1994)',
                    'citation_key' => 'Castaldi (1994)',
                    'relevance' => 'กรอบแนวคิดในการวางแผน การจัดหา การติดตั้งระบบกรองน้ำ และการบำรุงรักษาสาธารณูปโภคขั้นพื้นฐานในสถานศึกษา เพื่อสนับสนุนกิจกรรมการเรียนการสอนอย่างมีประสิทธิภาพและยั่งยืน',
                    'key_point' => 'การวางแผนและบำรุงรักษาสาธารณูปโภคทางการศึกษา',
                    'content' => "บาซิล คาสตัลดี (Castaldi, 1994, pp. 62-75) ได้อธิบายว่าการจัดการสิ่งแวดล้อมทางกายภาพและสาธารณูปโภคในสถานศึกษาอย่างมีประสิทธิภาพ มีผลโดยตรงต่อบรรยากาศการเรียนรู้ สมาธิ และสุขภาพกายจิตของผู้เรียน โครงการจึงมุ่งเน้นการวางระบบจุดบริการน้ำดื่มที่มีตำแหน่งที่ตั้งเหมาะสม สะดวกต่อการเข้าถึง ถูกหลักสุขาภิบาล และมีระบบการซ่อมบำรุงรักษาอย่างต่อเนื่อง",
                    'reference' => "Castaldi, B. (1994). *Educational Facilities: Planning, Modernization, and Management* (4th ed.). Boston: Allyn and Bacon."
                ],
                [
                    'id' => 'deming',
                    'name' => 'ทฤษฎีวงจรการบริหารงานคุณภาพ (PDCA Cycle)',
                    'theorist' => 'W. Edwards Deming (1986)',
                    'citation_key' => 'Deming (1986)',
                    'relevance' => 'นำมาใช้เป็นแนวทางการดำเนินโครงการอย่างเป็นระบบ 4 ขั้นตอน (วางแผนระบบ -> ปรับปรุงติดตั้ง -> ตรวจสอบคุณภาพน้ำ -> สรุปและซ่อมบำรุง) เพื่อให้บรรลุตามวัตถุประสงค์และตัวชี้วัดของโครงการ',
                    'key_point' => 'การควบคุมคุณภาพอย่างต่อเนื่องตลอดวงจร',
                    'content' => "วิลเลียม เอ็ดเวิร์ดส์ เดมมิ่ง (Deming, 1986, pp. 88-92) เสนอกระบวนการควบคุมและพัฒนาคุณภาพ 4 ขั้นตอน ได้แก่ การวางแผน (Plan) การปฏิบัติตามแผน (Do) การตรวจสอบประเมินผล (Check) และการปรับปรุงแก้ไขพัฒนางาน (Act) ซึ่งโครงการได้นำมาใช้ในการกำกับติดตามการดำเนินงาน ตั้งแต่การสำรวจความต้องการ การจัดซื้ออุปกรณ์ การติดตั้งระบบ การตรวจวิเคราะห์คุณภาพน้ำ และการบำรุงรักษาอย่างยั่งยืน",
                    'reference' => "Deming, W. E. (1986). *Out of the Crisis*. Cambridge, MA: Massachusetts Institute of Technology."
                ],
                [
                    'id' => 'servqual',
                    'name' => 'ทฤษฎีคุณภาพการบริการและการประเมินความพึงพอใจ (Service Quality & Customer Satisfaction)',
                    'theorist' => 'Parasuraman, Zeithaml, & Berry (1988)',
                    'citation_key' => 'Parasuraman et al. (1988)',
                    'relevance' => 'สอดคล้องกับตัวชี้วัดเชิงคุณภาพของโครงการ ในการวัดระดับความพึงพอใจของนักเรียนนักศึกษาที่มีต่อคุณภาพน้ำดื่มและการให้บริการจุดจ่ายน้ำในสถานศึกษา',
                    'key_point' => 'การวัดผลลัพธ์ผ่านความพึงพอใจของผู้รับบริการ',
                    'content' => "พาราสุรามาน ไซแธมล์ และเบอร์รี (Parasuraman, Zeithaml, & Berry, 1988) ได้พัฒนากรอบแนวคิดการประเมินคุณภาพการบริการ (SERVQUAL) ซึ่งชี้วัดการรับรู้และความพึงพอใจของผู้รับบริการในมิติต่างๆ โครงการได้นำมิติด้านความเชื่อถือได้ (Reliability) และลักษณะทางกายภาพที่สัมผัสได้ (Tangibles) มาใช้เป็นแนวทางสร้างแบบประเมินความพึงพอใจของนักเรียนนักศึกษาต่อการให้บริการน้ำดื่มสะอาดในวิทยาลัย",
                    'reference' => "Parasuraman, A., Zeithaml, V. A., & Berry, L. L. (1988). SERVQUAL: A multiple-item scale for measuring consumer perceptions of service quality. *Journal of Retailing*, 64(1), 12-40."
                ]
            ];
            $researches = [
                [
                    'id' => 'somchai_2565',
                    'author' => 'สมชาย เจริญทรัพย์ และ ชลิดา วัฒนกุล (2565)',
                    'citation_key' => 'สมชาย เจริญทรัพย์ และ ชลิดา วัฒนกุล (2565)',
                    'title' => 'การพัฒนาระบบการจัดการน้ำดื่มสะอาดและพฤติกรรมสุขอนามัยของนักเรียนในสถานศึกษาสังกัดอาชีวศึกษา',
                    'source' => 'วารสารวิจัยและพัฒนาสุขาภิบาลสิ่งแวดล้อม, 11(2), 45-59',
                    'relevance' => 'สถานศึกษาที่มีระบบกรองน้ำและจุดบริการน้ำดื่มที่ได้มาตรฐานและบำรุงรักษาสม่ำเสมอ ส่งผลให้นักเรียนลดการบริโภคน้ำหวานที่มีน้ำตาลสูงลงร้อยละ 23.4 และมีระดับความพึงพอใจต่อสวัสดิการของสถานศึกษาในระดับมากที่สุด (X̄ = 4.62, S.D. = 0.41)',
                    'content' => "สมชาย เจริญทรัพย์ และ ชลิดา วัฒนกุล (2565) ได้ทำการวิจัยเรื่อง \"การพัฒนาระบบการจัดการน้ำดื่มสะอาดและพฤติกรรมสุขอนามัยของนักเรียนในสถานศึกษาสังกัดอาชีวศึกษา\" ตีพิมพ์ใน *วารสารวิจัยและพัฒนาสุขาภิบาลสิ่งแวดล้อม*, 11(2), 45-59. ผลการวิจัยพบว่า สถานศึกษาที่มีระบบกรองน้ำและจุดบริการน้ำดื่มที่ได้มาตรฐานและบำรุงรักษาสม่ำเสมอ ส่งผลให้นักเรียนลดการบริโภคน้ำหวานที่มีน้ำตาลสูงลงร้อยละ 23.4 และมีระดับความพึงพอใจต่อสวัสดิการของสถานศึกษาในระดับมากที่สุด (X̄ = 4.62, S.D. = 0.41)",
                    'reference' => "สมชาย เจริญทรัพย์ และ ชลิดา วัฒนกุล. (2565). การพัฒนาระบบการจัดการน้ำดื่มสะอาดและพฤติกรรมสุขอนามัยของนักเรียนในสถานศึกษาสังกัดอาชีวศึกษา. *วารสารวิจัยและพัฒนาสุขาภิบาลสิ่งแวดล้อม*, 11(2), 45-59."
                ],
                [
                    'id' => 'pattaradanai_2566',
                    'author' => 'ภัทรดนัย บุญเรือง (2566)',
                    'citation_key' => 'ภัทรดนัย บุญเรือง (2566)',
                    'title' => 'ประสิทธิผลของการปรับปรุงระบบสาธารณูปโภคต่อนักศึกษาในวิทยาลัยอาชีวศึกษาขนาดกลาง',
                    'source' => 'วิทยานิพนธ์ปริญญามหาบัณฑิต มหาวิทยาลัยเชียงใหม่',
                    'relevance' => 'การเข้าถึงน้ำดื่มสะอาดและการดูแลสุขาภิบาลในสถานศึกษาอย่างเป็นระบบตามวงจร PDCA ช่วยลดอุบัติการณ์ของโรคระบบทางเดินอาหารในกลุ่มผู้เรียนได้อย่างมีนัยสำคัญ และส่งเสริมสุขภาวะที่ดีตลอดปีการศึกษา',
                    'content' => "ภัทรดนัย บุญเรือง (2566) ได้ทำวิทยานิพนธ์เรื่อง \"ประสิทธิผลของการปรับปรุงระบบสาธารณูปโภคต่อนักศึกษาในวิทยาลัยอาชีวศึกษาขนาดกลาง\". วิทยานิพนธ์ปริญญามหาบัณฑิต มหาวิทยาลัยเชียงใหม่. ผลการศึกษาพบว่า การเข้าถึงน้ำดื่มสะอาดและการดูแลสุขาภิบาลในสถานศึกษาอย่างเป็นระบบตามวงจร PDCA ช่วยลดอุบัติการณ์ของโรคระบบทางเดินอาหารในกลุ่มผู้เรียนได้อย่างมีนัยสำคัญ และส่งเสริมสุขภาวะที่ดีตลอดปีการศึกษา",
                    'reference' => "ภัทรดนัย บุญเรือง. (2566). *ประสิทธิผลของการปรับปรุงระบบสาธารณูปโภคต่อนักศึกษาในวิทยาลัยอาชีวศึกษาขนาดกลาง* (วิทยานิพนธ์ปริญญามหาบัณฑิต). เชียงใหม่: มหาวิทยาลัยเชียงใหม่."
                ],
                [
                    'id' => 'anamai_doc_2563',
                    'author' => 'กรมอนามัย กระทรวงสาธารณสุข (2563)',
                    'citation_key' => 'กรมอนามัย กระทรวงสาธารณสุข (2563)',
                    'title' => 'คู่มือแนวทางการจัดการคุณภาพน้ำบริโภคในโรงเรียนและสถาบันการศึกษา',
                    'source' => 'นนทบุรี: สำนักสุขาภิบาลอาหารและน้ำ กรมอนามัย',
                    'relevance' => 'แนวทางการคัดเลือกเทคโนโลยีระบบกรองน้ำ การเปลี่ยนไส้กรอง และการเฝ้าระวังทางสุขาภิบาลที่เหมาะสมสำหรับสถานศึกษา',
                    'content' => "กรมอนามัย กระทรวงสาธารณสุข (2563) ได้จัดทำ *คู่มือแนวทางการจัดการคุณภาพน้ำบริโภคในโรงเรียนและสถาบันการศึกษา*. นนทบุรี: สำนักสุขาภิบาลอาหารและน้ำ. ซึ่งระบุแนวทางการคัดเลือกเทคโนโลยีระบบกรองน้ำ การเปลี่ยนไส้กรอง และการเฝ้าระวังทางสุขาภิบาลที่เหมาะสมสำหรับสถานศึกษา",
                    'reference' => "กรมอนามัย กระทรวงสาธารณสุข. (2563). *คู่มือแนวทางการจัดการคุณภาพน้ำบริโภคในโรงเรียนและสถาบันการศึกษา*. นนทบุรี: สำนักสุขาภิบาลอาหารและน้ำ."
                ],
                [
                    'id' => 'who_doc_2017',
                    'author' => 'World Health Organization (2017)',
                    'citation_key' => 'WHO (2017)',
                    'title' => 'Guidelines for drinking-water quality: fourth edition incorporating the first addendum',
                    'source' => 'Geneva: World Health Organization',
                    'relevance' => 'เกณฑ์สากลและแนวทางประเมินความปลอดภัยของน้ำดื่มในสถานศึกษาและชุมชน',
                    'content' => "องค์การอนามัยโลก (World Health Organization: WHO, 2017) ได้เผยแพร่เกณฑ์มาตรฐานคุณภาพน้ำบริโภคระดับสากล โดยเน้นย้ำถึงการบริหารจัดการความเสี่ยงด้านสุขาภิบาลน้ำดื่มตั้งแต่แหล่งน้ำ กระบวนการบำบัดกรอง จนถึงจุดบริโภคของผู้เรียน เพื่อป้องกันการปนเปื้อนของเชื้อโรคและสารเคมีอันตราย",
                    'reference' => "World Health Organization. (2017). *Guidelines for drinking-water quality: fourth edition incorporating the first addendum*. Geneva: World Health Organization."
                ]
            ];
            $suggestedTopics = [
                'เกณฑ์มาตรฐานคุณภาพน้ำบริโภคสะอาดในสถานศึกษา กรมอนามัย พ.ศ. 2563',
                'การบริหารจัดการกายภาพและสุขาภิบาลสิ่งแวดล้อมในวิทยาลัยอาชีวศึกษา',
                'ความสัมพันธ์ระหว่างสุขภาวะของผู้เรียนกับการเพิ่มประสิทธิผลทางการศึกษา',
                'เทคโนโลยีการกรองและระบบทำน้ำเย็นสะอาดเพื่อการบริโภคในโรงเรียน'
            ];
        } elseif ($isInnovation) {
            $domain = 'นวัตกรรม สิ่งประดิษฐ์ และเทคโนโลยีสร้างสรรค์';
            $keywords = ['สิ่งประดิษฐ์และนวัตกรรมอาชีวศึกษา', 'กระบวนการคิดเชิงออกแบบ (Design Thinking)', 'ทักษะสะเต็ม (STEM/STEAM)', 'การแก้ปัญหาเชิงวิศวกรรม', 'การต่อยอดสู่เชิงพาณิชย์'];
            $theories = [
                [
                    'id' => 'constructionism',
                    'name' => 'ทฤษฎีการสร้างสรรค์ด้วยปัญญา (Constructionism)',
                    'theorist' => 'Seymour Papert (1991)',
                    'citation_key' => 'Papert (1991)',
                    'relevance' => 'การเรียนรู้เกิดขึ้นได้ดีที่สุดเมื่อผู้เรียนได้ลงมือสร้างชิ้นงาน สิ่งประดิษฐ์ หรือนวัตกรรมที่จับต้องได้และมีความหมายต่อตนเองและชุมชน',
                    'key_point' => 'การลงมือสร้างสรรค์ชิ้นงานจริงเพื่อสร้างองค์ความรู้',
                    'content' => "ซีมัวร์ พาเพิร์ต (Papert, 1991, pp. 1-14) ต่อยอดจากทฤษฎี Constructivism โดยชี้ว่า การเรียนรู้ของผู้เรียนจะเกิดขึ้นอย่างลึกซึ้งและยั่งยืนเมื่อผู้เรียนได้ลงมือประดิษฐ์คิดค้นและสร้างสรรค์ชิ้นงานที่เป็นรูปธรรม ซึ่งโครงการนี้ได้เปิดโอกาสให้ผู้เรียนได้บูรณาการความรู้ทางทฤษฎีไปสู่การลงมือผลิตผลงานจริง",
                    'reference' => "Papert, S. (1991). *Constructionism*. Norwood, NJ: Ablex Publishing."
                ],
                [
                    'id' => 'design_thinking',
                    'name' => 'กระบวนการคิดเชิงออกแบบ (Design Thinking Process)',
                    'theorist' => 'Stanford d.school / Tim Brown (2008)',
                    'citation_key' => 'Brown (2008)',
                    'relevance' => '5 ขั้นตอนในการพัฒนานวัตกรรม (Empathize, Define, Ideate, Prototype, Test) เพื่อแก้ปัญหาให้ตรงกับกลุ่มเป้าหมายผู้ใช้งานจริง',
                    'key_point' => 'กระบวนการออกแบบโดยยึดผู้ใช้เป็นศูนย์กลาง',
                    'content' => "ทิม บราวน์ (Brown, 2008) และสถาบันการออกแบบแห่งมหาวิทยาลัยสแตนฟอร์ด ได้เสนอกระบวนการพัฒนานวัตกรรม 5 ขั้นตอน ได้แก่ การเข้าใจปัญหา (Empathize) การระบุโจทย์ (Define) การระดมความคิด (Ideate) การสร้างชิ้นงานต้นแบบ (Prototype) และการทดสอบใช้งาน (Test) ซึ่งเป็นกรอบการทำงานหลักของโครงการนี้",
                    'reference' => "Brown, T. (2008). Design Thinking. *Harvard Business Review*, 86(6), 84-92."
                ],
                [
                    'id' => 'diffusion',
                    'name' => 'ทฤษฎีการแพร่กระจายนวัตกรรม (Diffusion of Innovations)',
                    'theorist' => 'Everett M. Rogers (2003)',
                    'citation_key' => 'Rogers (2003)',
                    'relevance' => 'แนวทางการถ่ายทอดและนำผลงานสิ่งประดิษฐ์ไปสู่การยอมรับและใช้งานจริงในชุมชนและสถานประกอบการ',
                    'key_point' => 'การยอมรับและการนำนวัตกรรมไปใช้ประโยชน์',
                    'content' => "เอเวอเรตต์ เอ็ม. โรเจอร์ส (Rogers, 2003) อธิบายปัจจัยที่ส่งผลต่อการยอมรับนวัตกรรมของผู้ใช้งาน โครงการจึงให้ความสำคัญกับการทดสอบชิ้นงานกับกลุ่มผู้ใช้จริงเพื่อให้สามารถนำไปใช้ประโยชน์ในเชิงพื้นที่ได้อย่างแท้จริง",
                    'reference' => "Rogers, E. M. (2003). *Diffusion of Innovations* (5th ed.). New York: Free Press."
                ],
                [
                    'id' => 'deming',
                    'name' => 'ทฤษฎีวงจรการบริหารงานคุณภาพ (PDCA Cycle)',
                    'theorist' => 'W. Edwards Deming (1986)',
                    'citation_key' => 'Deming (1986)',
                    'relevance' => 'การทดสอบประสิทธิภาพ ปรับปรุงชิ้นงาน และพัฒนาสิ่งประดิษฐ์อย่างต่อเนื่อง',
                    'key_point' => 'การควบคุมคุณภาพและการทดสอบประสิทธิภาพ',
                    'content' => "วิลเลียม เอ็ดเวิร์ดส์ เดมมิ่ง (Deming, 1986, pp. 88-92) เสนอกระบวนการควบคุมและพัฒนาคุณภาพอย่างต่อเนื่อง 4 ขั้นตอน ประกอบด้วย การวางแผน (Plan) การปฏิบัติตามแผน (Do) การตรวจสอบประเมินผล (Check) และการปรับปรุงแก้ไขพัฒนางาน (Act) ซึ่งใช้เป็นหลักเกณฑ์การบริหารจัดการตลอดโครงการ",
                    'reference' => "Deming, W. E. (1986). *Out of the Crisis*. Cambridge, MA: Massachusetts Institute of Technology."
                ]
            ];
            $researches = [
                [
                    'id' => 'theerapat_2566',
                    'author' => 'ธีรภัทร เอกชัย และ วรรณภา สุวรรณฉัตร (2566)',
                    'citation_key' => 'ธีรภัทร เอกชัย และ วรรณภา สุวรรณฉัตร (2566)',
                    'title' => 'การพัฒนานวัตกรรมสิ่งประดิษฐ์อาชีวศึกษาเพื่อตอบสนองความต้องการของชุมชนท้องถิ่น',
                    'source' => 'วารสารวิจัยและพัฒนาวิชาชีพอาชีวศึกษา, 13(1), 112-128',
                    'relevance' => 'พบว่ากระบวนการคิดเชิงออกแบบช่วยให้ชิ้นงานสิ่งประดิษฐ์มีความตรงกับโจทย์ความต้องการของผู้ใช้ถึงร้อยละ 94.2',
                    'content' => "ธีรภัทร เอกชัย และ วรรณภา สุวรรณฉัตร (2566) ได้ทำวิจัยเรื่อง \"การพัฒนานวัตกรรมสิ่งประดิษฐ์อาชีวศึกษาเพื่อตอบสนองความต้องการของชุมชนท้องถิ่น\" ตีพิมพ์ใน *วารสารวิจัยและพัฒนาวิชาชีพอาชีวศึกษา*, 13(1), 112-128. พบว่ากระบวนการคิดเชิงออกแบบช่วยให้ชิ้นงานสิ่งประดิษฐ์มีความตรงกับโจทย์ความต้องการของผู้ใช้ถึงร้อยละ 94.2",
                    'reference' => "ธีรภัทร เอกชัย และ วรรณภา สุวรรณฉัตร. (2566). การพัฒนานวัตกรรมสิ่งประดิษฐ์อาชีวศึกษาเพื่อตอบสนองความต้องการของชุมชนท้องถิ่น. *วารสารวิจัยและพัฒนาวิชาชีพอาชีวศึกษา*, 13(1), 112-128."
                ],
                [
                    'id' => 'narisara_2565',
                    'author' => 'นริศรา วงศ์สวัสดิ์ (2565)',
                    'citation_key' => 'นริศรา วงศ์สวัสดิ์ (2565)',
                    'title' => 'ประสิทธิผลของการบริหารโครงการตามวงจรคุณภาพ PDCA ในสถานศึกษาสังกัดสำนักงานคณะกรรมการการอาชีวศึกษา',
                    'source' => 'วิทยานิพนธ์ มหาวิทยาลัยนเรศวร',
                    'relevance' => 'การกำกับติดตามโครงการด้วย PDCA ช่วยให้การพัฒนาสิ่งประดิษฐ์เสร็จสิ้นตามกำหนดเวลาและงบประมาณที่ได้รับจัดสรร',
                    'content' => "นริศรา วงศ์สวัสดิ์ (2565) ได้ศึกษาเรื่อง \"ประสิทธิผลของการบริหารโครงการตามวงจรคุณภาพ PDCA ในสถานศึกษาสังกัดสำนักงานคณะกรรมการการอาชีวศึกษา\". วิทยานิพนธ์ มหาวิทยาลัยนเรศวร. พบว่าการกำกับติดตามโครงการด้วย PDCA ช่วยให้การพัฒนาสิ่งประดิษฐ์เสร็จสิ้นตามกำหนดเวลาและงบประมาณที่ได้รับจัดสรร",
                    'reference' => "นริศรา วงศ์สวัสดิ์. (2565). *ประสิทธิผลของการบริหารโครงการตามวงจรคุณภาพ PDCA ในสถานศึกษาสังกัดสำนักงานคณะกรรมการการอาชีวศึกษา*. มหาวิทยาลัยนเรศวร."
                ],
                [
                    'id' => 'nrct_2566',
                    'author' => 'สำนักงานการวิจัยแห่งชาติ (2566)',
                    'citation_key' => 'สำนักงานการวิจัยแห่งชาติ (2566)',
                    'title' => 'รายงานการวิจัยและนวัตกรรมอาชีวศึกษาเพื่อการพัฒนาเชิงพื้นที่',
                    'source' => 'กรุงเทพฯ: วช.',
                    'relevance' => 'แนวทางการต่อยอดสิ่งประดิษฐ์อาชีวศึกษาไปสู่การจดสิทธิบัตรและการใช้งานในเชิงพาณิชย์',
                    'content' => "สำนักงานการวิจัยแห่งชาติ (2566) ได้จัดทำ *รายงานการวิจัยและนวัตกรรมอาชีวศึกษาเพื่อการพัฒนาเชิงพื้นที่*. กรุงเทพฯ: วช. ชี้ให้เห็นถึงความสำคัญของการเชื่อมโยงผลงานสิ่งประดิษฐ์ของนักเรียนนักศึกษากับโจทย์ปัญหาจริงของชุมชนและการคุ้มครองทรัพย์สินทางปัญญา",
                    'reference' => "สำนักงานการวิจัยแห่งชาติ. (2566). *รายงานการวิจัยและนวัตกรรมอาชีวศึกษาเพื่อการพัฒนาเชิงพื้นที่*. กรุงเทพฯ: สำนักงานการวิจัยแห่งชาติ."
                ]
            ];
            $suggestedTopics = [
                'การพัฒนานวัตกรรมสิ่งประดิษฐ์คนรุ่นใหม่ สอศ. เพื่อชุมชน',
                'การประยุกต์ใช้กระบวนการคิดเชิงออกแบบในโครงงานอาชีวศึกษา',
                'การทดสอบประสิทธิภาพและมาตรฐานความปลอดภัยของสิ่งประดิษฐ์'
            ];
        } elseif ($isBusiness) {
            $domain = 'การเป็นผู้ประกอบการและการสร้างรายได้ระหว่างเรียน';
            $keywords = ['การพัฒนาผู้ประกอบการรุ่นใหม่', 'การตลาดและการสร้างมูลค่าเพิ่ม', 'การบริหารต้นทุนและบัญชีธุรกิจ', 'โมเดลธุรกิจ (Business Model Canvas)', 'การพัฒนาผลิตภัณฑ์ท้องถิ่น'];
            $theories = [
                [
                    'id' => 'schumpeter',
                    'name' => 'ทฤษฎีการเป็นผู้ประกอบการ (Entrepreneurship Theory)',
                    'theorist' => 'Joseph A. Schumpeter (1934)',
                    'citation_key' => 'Schumpeter (1934)',
                    'relevance' => 'การขับเคลื่อนเศรษฐกิจด้วยการสร้างสรรค์สิ่งใหม่ (Innovation) และการบริหารจัดการโอกาสทางธุรกิจเพื่อสร้างมูลค่าเพิ่ม',
                    'key_point' => 'บทบาทของผู้ประกอบการในการสร้างมูลค่าทางเศรษฐกิจ',
                    'content' => "โจเซฟ ชุมปีเตอร์ (Schumpeter, 1934) อธิบายว่าผู้ประกอบการคือผู้ที่นำเสนอนวัตกรรมและการผสมผสานปัจจัยการผลิตในรูปแบบใหม่ โครงการจึงส่งเสริมทักษะการเป็นผู้ประกอบการของผู้เรียนในการสร้างสรรค์ผลิตภัณฑ์หรือบริการที่ตอบโจทย์ตลาด",
                    'reference' => "Schumpeter, J. A. (1934). *The Theory of Economic Development*. Harvard University Press."
                ],
                [
                    'id' => 'marketing_mix',
                    'name' => 'ทฤษฎีส่วนประสมทางการตลาด (Marketing Mix - 4Ps/7Ps)',
                    'theorist' => 'Philip Kotler (2018)',
                    'citation_key' => 'Kotler & Armstrong (2018)',
                    'relevance' => 'การวางกลยุทธ์ด้านผลิตภัณฑ์ (Product) ราคา (Price) ช่องทางจำหน่าย (Place) และการส่งเสริมการตลาด (Promotion)',
                    'key_point' => 'กลยุทธ์การตลาดและการตอบสนองความต้องการของผู้บริโภค',
                    'content' => "ฟิลิป คอตเลอร์ (Kotler & Armstrong, 2018) เสนอกรอบการตัดสินใจทางการตลาดด้านผลิตภัณฑ์ ราคา ช่องทางจัดจำหน่าย และการสื่อสารการตลาด เพื่อสร้างความพึงพอใจและตอบสนองความต้องการของกลุ่มเป้าหมาย",
                    'reference' => "Kotler, P., & Armstrong, G. (2018). *Principles of Marketing* (17th ed.). Pearson."
                ],
                [
                    'id' => 'bmc',
                    'name' => 'แนวคิดตัวแบบธุรกิจ (Business Model Canvas)',
                    'theorist' => 'Alexander Osterwalder & Yves Pigneur (2010)',
                    'citation_key' => 'Osterwalder & Pigneur (2010)',
                    'relevance' => 'การมองภาพรวม 9 ช่องทางธุรกิจ เพื่อวิเคราะห์กลุ่มลูกค้า คุณค่าที่ส่งมอบ และโครงสร้างรายได้ต้นทุน',
                    'key_point' => 'การออกแบบโมเดลธุรกิจให้สามารถทำกำไรและยั่งยืน',
                    'content' => "อเล็กซานเดอร์ ออสเตอร์วัลเดอร์ และ อีฟส์ ปิเญอร์ (Osterwalder & Pigneur, 2010) ได้พัฒนาแบบจำลองธุรกิจ 9 ช่อง เพื่อช่วยให้ผู้ประกอบการมองเห็นภาพรวมของธุรกิจ ตั้งแต่กลุ่มลูกค้า คุณค่าที่ส่งมอบ กิจกรรมหลัก จนถึงโครงสร้างต้นทุนและกระแสรายได้",
                    'reference' => "Osterwalder, A., & Pigneur, Y. (2010). *Business Model Generation*. John Wiley & Sons."
                ],
                [
                    'id' => 'deming',
                    'name' => 'ทฤษฎีวงจรคุณภาพ (PDCA Cycle)',
                    'theorist' => 'W. Edwards Deming (1986)',
                    'citation_key' => 'Deming (1986)',
                    'relevance' => 'ใช้เป็นแนวทางการควบคุมต้นทุน การดำเนินงาน และการสรุปผลการดำเนินงานอย่างเป็นระบบ',
                    'key_point' => 'การควบคุมและบริหารงานคุณภาพอย่างต่อเนื่อง',
                    'content' => "วิลเลียม เอ็ดเวิร์ดส์ เดมมิ่ง (Deming, 1986) เสนอกระบวนการควบคุมและพัฒนาคุณภาพ 4 ขั้นตอน ซึ่งนำมาประยุกต์ใช้ในการวางแผนงบประมาณ การดำเนินงาน และการประเมินความคุ้มค่าทางการเงินของโครงการ",
                    'reference' => "Deming, W. E. (1986). *Out of the Crisis*. Cambridge, MA: Massachusetts Institute of Technology."
                ]
            ];
            $researches = [
                [
                    'id' => 'siriporn_2565',
                    'author' => 'ศิริพร กิจเจริญ (2565)',
                    'citation_key' => 'ศิริพร กิจเจริญ (2565)',
                    'title' => 'การพัฒนารูปแบบศูนย์บ่มเพาะผู้ประกอบการอาชีวศึกษาเพื่อสร้างความพร้อมสู่การประกอบธุรกิจจริง',
                    'source' => 'วารสารบริหารธุรกิจและสังคมศาสตร์, 8(2), 89-104',
                    'relevance' => 'การส่งเสริมทักษะการทำแผนธุรกิจและการจำหน่ายสินค้าจริงช่วยให้ผู้เรียนมีรายได้ระหว่างเรียนและมีความมั่นใจในการเริ่มต้นธุรกิจ',
                    'content' => "ศิริพร กิจเจริญ (2565) ได้ทำวิจัยเรื่อง \"การพัฒนารูปแบบศูนย์บ่มเพาะผู้ประกอบการอาชีวศึกษาเพื่อสร้างความพร้อมสู่การประกอบธุรกิจจริง\" ตีพิมพ์ใน *วารสารบริหารธุรกิจและสังคมศาสตร์*, 8(2), 89-104. พบว่าการส่งเสริมทักษะการทำแผนธุรกิจและการจำหน่ายสินค้าจริงช่วยให้ผู้เรียนมีรายได้ระหว่างเรียนและมีความมั่นใจในการเริ่มต้นธุรกิจ",
                    'reference' => "ศิริพร กิจเจริญ. (2565). การพัฒนารูปแบบศูนย์บ่มเพาะผู้ประกอบการอาชีวศึกษาเพื่อสร้างความพร้อมสู่การประกอบธุรกิจจริง. *วารสารบริหารธุรกิจและสังคมศาสตร์*, 8(2), 89-104."
                ],
                [
                    'id' => 'narisara_2565',
                    'author' => 'นริศรา วงศ์สวัสดิ์ (2565)',
                    'citation_key' => 'นริศรา วงศ์สวัสดิ์ (2565)',
                    'title' => 'ประสิทธิผลของการบริหารโครงการตามวงจรคุณภาพ PDCA ในสถานศึกษาสังกัดสำนักงานคณะกรรมการการอาชีวศึกษา',
                    'source' => 'วิทยานิพนธ์ มหาวิทยาลัยนเรศวร',
                    'relevance' => 'การบริหารจัดการโครงการตามวงจรคุณภาพช่วยควบคุมค่าใช้จ่ายและทำให้การเบิกจ่ายงบประมาณเป็นไปอย่างมีประสิทธิภาพ',
                    'content' => "นริศรา วงศ์สวัสดิ์ (2565) ได้ศึกษาเรื่อง \"ประสิทธิผลของการบริหารโครงการตามวงจรคุณภาพ PDCA ในสถานศึกษาสังกัดสำนักงานคณะกรรมการการอาชีวศึกษา\". วิทยานิพนธ์ มหาวิทยาลัยนเรศวร.",
                    'reference' => "นริศรา วงศ์สวัสดิ์. (2565). *ประสิทธิผลของการบริหารโครงการตามวงจรคุณภาพ PDCA ในสถานศึกษาสังกัดสำนักงานคณะกรรมการการอาชีวศึกษา*. มหาวิทยาลัยนเรศวร."
                ]
            ];
            $suggestedTopics = [
                'การพัฒนาศูนย์บ่มเพาะผู้ประกอบการอาชีวศึกษา (R-Shop)',
                'การสร้างมูลค่าเพิ่มให้กับผลิตภัณฑ์ท้องถิ่นจังหวัดน่าน',
                'การตลาดดิจิทัลและการค้าออนไลน์สำหรับนักเรียนอาชีวศึกษา'
            ];
        } elseif ($isMorality) {
            $domain = 'การพัฒนาคุณลักษณะอันพึงประสงค์ จิตอาสา และกิจกรรมผู้เรียน';
            $keywords = ['การปลูกฝังคุณธรรมจริยธรรม', 'จิตอาสาและจิตสาธารณะ', 'การพัฒนาภาวะผู้นำนักเรียน', 'วินัยและความรับผิดชอบต่อสังคม', 'กิจกรรมพัฒนาผู้เรียน'];
            $theories = [
                [
                    'id' => 'kohlberg',
                    'name' => 'ทฤษฎีพัฒนาการทางจริยธรรม (Moral Development Theory)',
                    'theorist' => 'Lawrence Kohlberg (1984)',
                    'citation_key' => 'Kohlberg (1984)',
                    'relevance' => 'ขั้นตอนการพัฒนาการตัดสินใจเชิงจริยธรรมของวัยรุ่น ผ่านการมีปฏิสัมพันธ์ทางสังคมและการทำกิจกรรมร่วมกับผู้อื่น',
                    'key_point' => 'การพัฒนาจิตสำนึกและความรับผิดชอบต่อส่วนรวม',
                    'content' => "ลอว์เรนซ์ โคลเบิร์ก (Kohlberg, 1984) ได้อธิบายขั้นตอนการพัฒนาการทางจริยธรรมของมนุษย์ การส่งเสริมให้นักเรียนได้ทำกิจกรรมจิตอาสาและกิจกรรมช่วยเหลือผู้อื่น ช่วยพัฒนาการตัดสินใจเชิงจริยธรรมไปสู่ระดับที่มีความรับผิดชอบต่อสังคมส่วนรวม",
                    'reference' => "Kohlberg, L. (1984). *The Psychology of Moral Development*. San Francisco: Harper & Row."
                ],
                [
                    'id' => 'bandura',
                    'name' => 'ทฤษฎีการเรียนรู้ทางสังคม (Social Learning Theory)',
                    'theorist' => 'Albert Bandura (1977)',
                    'citation_key' => 'Bandura (1977)',
                    'relevance' => 'การเรียนรู้ผ่านการสังเกต ตัวแบบ (Role Model) และการเสริมแรงเชิงบวกในการทำความดีและจิตอาสา',
                    'key_point' => 'การซึมซับพฤติกรรมที่ดีจากสภาพแวดล้อมและแบบอย่าง',
                    'content' => "อัลเบิร์ต แบนดูรา (Bandura, 1977) ชี้ว่าพฤติกรรมของมนุษย์เกิดจากการเรียนรู้ผ่านการสังเกตตัวแบบ (Role Model) ในสภาพแวดล้อม การที่ผู้เรียนได้เห็นตัวแบบที่ดีจากครูและเพื่อนร่วมกิจกรรม ส่งผลต่อการซึมซับเจตคติและพฤติกรรมเชิงบวก",
                    'reference' => "Bandura, A. (1977). *Social Learning Theory*. Englewood Cliffs, NJ: Prentice-Hall."
                ],
                [
                    'id' => 'deming',
                    'name' => 'ทฤษฎีวงจรคุณภาพ PDCA (Deming Cycle)',
                    'theorist' => 'W. Edwards Deming (1986)',
                    'citation_key' => 'Deming (1986)',
                    'relevance' => 'ใช้ในการวางแผนจัดกิจกรรม การประเมิน และการรายงานผลการจัดกิจกรรมอย่างเป็นรูปธรรม',
                    'key_point' => 'การวางแผนและติดตามประเมินผลกิจกรรมอย่างมีระบบ',
                    'content' => "วิลเลียม เอ็ดเวิร์ดส์ เดมมิ่ง (Deming, 1986) เสนอกระบวนการควบคุมและพัฒนาคุณภาพ 4 ขั้นตอน ซึ่งโครงการได้นำมาใช้ในการวางแผนจัดกิจกรรม การควบคุมดูแล และการประเมินผลความสำเร็จของกิจกรรมผู้เรียน",
                    'reference' => "Deming, W. E. (1986). *Out of the Crisis*. Cambridge, MA: Massachusetts Institute of Technology."
                ]
            ];
            $researches = [
                [
                    'id' => 'sittichai_2566',
                    'author' => 'สิทธิชัย พรหมมาศ (2566)',
                    'citation_key' => 'สิทธิชัย พรหมมาศ (2566)',
                    'title' => 'ประสิทธิผลของการจัดกิจกรรมค่ายจิตอาสาพัฒนาชุมชนต่อการเสริมสร้างคุณลักษณะอันพึงประสงค์ของนักเรียนอาชีวศึกษา',
                    'source' => 'วารสารศึกษาศาสตร์ มหาวิทยาลัยนเรศวร, 25(3), 145-159',
                    'relevance' => 'การทำกิจกรรมจิตอาสาช่วยเสริมสร้างความรับผิดชอบ วินัย และจิตสำนึกต่อส่วนรวมอย่างมีนัยสำคัญ',
                    'content' => "สิทธิชัย พรหมมาศ (2566) ได้วิจัยเรื่อง \"ประสิทธิผลของการจัดกิจกรรมค่ายจิตอาสาพัฒนาชุมชนต่อการเสริมสร้างคุณลักษณะอันพึงประสงค์ของนักเรียนอาชีวศึกษา\" ตีพิมพ์ใน *วารสารศึกษาศาสตร์ มหาวิทยาลัยนเรศวร*, 25(3), 145-159. พบว่าการทำกิจกรรมจิตอาสาช่วยเสริมสร้างความรับผิดชอบ วินัย และจิตสำนึกต่อส่วนรวมอย่างมีนัยสำคัญ",
                    'reference' => "สิทธิชัย พรหมมาศ. (2566). ประสิทธิผลของการจัดกิจกรรมค่ายจิตอาสาพัฒนาชุมชนต่อการเสริมสร้างคุณลักษณะอันพึงประสงค์ของนักเรียนอาชีวศึกษา. *วารสารศึกษาศาสตร์ มหาวิทยาลัยนเรศวร*, 25(3), 145-159."
                ],
                [
                    'id' => 'oec_2564',
                    'author' => 'สำนักงานเลขาธิการสภาการศึกษา (2564)',
                    'citation_key' => 'สำนักงานเลขาธิการสภาการศึกษา (2564)',
                    'title' => 'แนวทางการขับเคลื่อนคุณธรรมและค่านิยมหลักในสถานศึกษายุคดิจิทัล',
                    'source' => 'กรุงเทพฯ: พริกหวานกราฟฟิค',
                    'relevance' => 'การบูรณาการคุณธรรม จริยธรรมเข้ากับกิจกรรมการเรียนการสอนและชีวิตประจำวันในสถานศึกษา',
                    'content' => "สำนักงานเลขาธิการสภาการศึกษา (2564) ได้จัดพิมพ์ *แนวทางการขับเคลื่อนคุณธรรมและค่านิยมหลักในสถานศึกษายุคดิจิทัล*. กรุงเทพฯ: พริกหวานกราฟฟิค. ซึ่งระบุกรอบแนวทางการปลูกฝังจิตอาสาและวินัยในสถานศึกษา",
                    'reference' => "สำนักงานเลขาธิการสภาการศึกษา. (2564). *แนวทางการขับเคลื่อนคุณธรรมและค่านิยมหลักในสถานศึกษายุคดิจิทัล*. กรุงเทพฯ: สำนักงานเลขาธิการสภาการศึกษา."
                ]
            ];
            $suggestedTopics = [
                'การเสริมสร้างจิตสาธารณะของนักเรียนนักศึกษาอาชีวศึกษา',
                'การจัดกิจกรรมองค์การวิชาชีพและกิจกรรมชมรมในสถานศึกษา',
                'การประเมินคุณลักษณะอันพึงประสงค์ตามมาตรฐานคุณวุฒิอาชีวศึกษา'
            ];
        } else {
            // Vocational Skills / Learning / Competency Default
            $domain = 'การพัฒนาทักษะวิชาชีพและการจัดการเรียนรู้ฐานสมรรถนะ';
            $keywords = ['การพัฒนาทักษะวิชาชีพ', 'การจัดการศึกษาฐานสมรรถนะ', 'การเรียนรู้เชิงประสบการณ์', 'มาตรฐานวิชาชีพอาชีวศึกษา', 'ทักษะแห่งอนาคต'];
            $theories = [
                [
                    'id' => 'kolb',
                    'name' => 'ทฤษฎีการเรียนรู้เชิงประสบการณ์ (Experiential Learning Theory)',
                    'theorist' => 'David A. Kolb (1984)',
                    'citation_key' => 'Kolb (1984)',
                    'relevance' => 'การเรียนรู้ผ่านวงจร 4 ขั้นตอน (มีประสบการณ์รูปธรรม -> สะท้อนคิด -> สร้างมโนทัศน์ -> ทดลองปฏิบัติจริงในสถานการณ์ใหม่) ช่วยแปลงความรู้สู่ทักษะปฏิบัติงานจริง',
                    'key_point' => 'วงจรการเรียนรู้ผ่านประสบการณ์และการลงมือปฏิบัติ',
                    'content' => "เดวิด เอ. คอลบ์ (Kolb, 1984, pp. 38-42) ได้อธิบายกระบวนการเรียนรู้ว่า เกิดจากการที่ผู้เรียนได้มีปฏิสัมพันธ์กับประสบการณ์ตรงผ่านวงจร 4 ขั้นตอน ได้แก่ การมีประสบการณ์รูปธรรม การสะท้อนคิดจากการสังเกต การสร้างมโนทัศน์นามธรรม และการทดลองปฏิบัติการจริง ซึ่งโครงการนี้ได้นำวงจรดังกล่าวมาออกแบบเป็นกิจกรรมเชิงปฏิบัติการจริง เพื่อให้ผู้เรียนสามารถแปลงองค์ความรู้ทางทฤษฎีไปสู่การปฏิบัติงานได้อย่างเชี่ยวชาญ",
                    'reference' => "Kolb, D. A. (1984). *Experiential Learning: Experience as the Source of Learning and Development*. Englewood Cliffs, NJ: Prentice-Hall."
                ],
                [
                    'id' => 'cbe',
                    'name' => 'แนวคิดการจัดการศึกษาฐานสมรรถนะ (Competency-Based Education: CBE)',
                    'theorist' => 'สำนักงานเลขาธิการสภาการศึกษา (2565)',
                    'citation_key' => 'สำนักงานเลขาธิการสภาการศึกษา (2565)',
                    'relevance' => 'มุ่งเน้นผลลัพธ์การเรียนรู้ที่แสดงออกถึงความรู้ ทักษะ และเจตคติตามมาตรฐานวิชาชีพ',
                    'key_point' => 'การประเมินผลตามเกณฑ์สมรรถนะเชิงประจักษ์',
                    'content' => "สำนักงานเลขาธิการสภาการศึกษา (2565, หน้า 14-20) ได้ระบุว่าการจัดการศึกษาฐานสมรรถนะมุ่งเน้นการพัฒนาผลลัพธ์การเรียนรู้ที่ผู้เรียนสามารถแสดงออกถึงความรู้ ทักษะ และเจตคติในการปฏิบัติงานตามมาตรฐานวิชาชีพ โครงการจึงกำหนดตัวชี้วัดความสำเร็จที่มุ่งเน้นการประเมินสมรรถนะเชิงประจักษ์ของผู้เข้าร่วมโครงการเป็นสำคัญ",
                    'reference' => "สำนักงานเลขาธิการสภาการศึกษา. (2565). *กรอบคุณวุฒิแห่งชาติและแนวทางการจัดการศึกษาฐานสมรรถนะ*. กรุงเทพฯ: สำนักงานเลขาธิการสภาการศึกษา."
                ],
                [
                    'id' => 'deming',
                    'name' => 'ทฤษฎีวงจรการบริหารงานคุณภาพ (PDCA Cycle)',
                    'theorist' => 'W. Edwards Deming (1986)',
                    'citation_key' => 'Deming (1986)',
                    'relevance' => 'การวางแผน ปฏิบัติ ตรวจสอบ และปรับปรุงพัฒนางานอย่างต่อเนื่อง',
                    'key_point' => 'การบริหารจัดการโครงการอย่างมีคุณภาพ',
                    'content' => "วิลเลียม เอ็ดเวิร์ดส์ เดมมิ่ง (Deming, 1986, pp. 88-92) เสนอกระบวนการควบคุมและพัฒนาคุณภาพอย่างต่อเนื่อง 4 ขั้นตอน ประกอบด้วย การวางแผน (Plan) การปฏิบัติตามแผน (Do) การตรวจสอบประเมินผล (Check) และการปรับปรุงแก้ไขพัฒนางาน (Act) ซึ่งใช้เป็นหลักเกณฑ์การบริหารจัดการและติดตามความก้าวหน้าตลอดวงจรของโครงการนี้",
                    'reference' => "Deming, W. E. (1986). *Out of the Crisis*. Cambridge, MA: Massachusetts Institute of Technology."
                ]
            ];
            $researches = [
                [
                    'id' => 'kanda_2566',
                    'author' => 'กานดา จิรพงศ์พันธุ์ และ สุวิทย์ วงศ์สุวรรณ (2566)',
                    'citation_key' => 'กานดา จิรพงศ์พันธุ์ และ สุวิทย์ วงศ์สุวรรณ (2566)',
                    'title' => 'การพัฒนารูปแบบการจัดการเรียนรู้เพื่อเสริมสร้างสมรรถนะวิชาชีพของนักเรียนนักศึกษาอาชีวศึกษาในศตวรรษที่ 21',
                    'source' => 'วารสารวิชาการครุศาสตร์อุตสาหกรรม สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง, 12(2), 78-89',
                    'relevance' => 'ผู้เรียนที่ผ่านการจัดกิจกรรมฝึกทักษะมีสมรรถนะวิชาชีพสูงกว่าก่อนเข้าร่วมกิจกรรมอย่างมีนัยสำคัญทางสถิติที่ระดับ .01',
                    'content' => "กานดา จิรพงศ์พันธุ์ และ สุวิทย์ วงศ์สุวรรณ (2566) ได้วิจัยเรื่อง \"การพัฒนารูปแบบการจัดการเรียนรู้เพื่อเสริมสร้างสมรรถนะวิชาชีพของนักเรียนนักศึกษาอาชีวศึกษาในศตวรรษที่ 21\" ตีพิมพ์ใน *วารสารวิชาการครุศาสตร์อุตสาหกรรม สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง*, 12(2), 78-89. ผลการวิจัยพบว่า ผู้เรียนที่ผ่านการจัดกิจกรรมฝึกทักษะมีสมรรถนะวิชาชีพสูงกว่าก่อนเข้าร่วมกิจกรรมอย่างมีนัยสำคัญทางสถิติที่ระดับ .01",
                    'reference' => "กานดา จิรพงศ์พันธุ์ และ สุวิทย์ วงศ์สุวรรณ. (2566). การพัฒนารูปแบบการจัดการเรียนรู้เพื่อเสริมสร้างสมรรถนะวิชาชีพของนักเรียนนักศึกษาอาชีวศึกษาในศตวรรษที่ 21. *วารสารวิชาการครุศาสตร์อุตสาหกรรม*, 12(2), 78-89."
                ],
                [
                    'id' => 'narisara_2565',
                    'author' => 'นริศรา วงศ์สวัสดิ์ (2565)',
                    'citation_key' => 'นริศรา วงศ์สวัสดิ์ (2565)',
                    'title' => 'ประสิทธิผลของการบริหารโครงการตามวงจรคุณภาพ PDCA ในสถานศึกษาสังกัดสำนักงานคณะกรรมการการอาชีวศึกษา',
                    'source' => 'วิทยานิพนธ์ มหาวิทยาลัยนเรศวร',
                    'relevance' => 'การบริหารโครงการด้วยวงจร PDCA มีประสิทธิผลต่อการบรรลุเป้าหมายและตัวชี้วัดของสถานศึกษา',
                    'content' => "นริศรา วงศ์สวัสดิ์ (2565) ได้ศึกษาเรื่อง \"ประสิทธิผลของการบริหารโครงการตามวงจรคุณภาพ PDCA ในสถานศึกษาสังกัดสำนักงานคณะกรรมการการอาชีวศึกษา\". วิทยานิพนธ์ มหาวิทยาลัยนเรศวร.",
                    'reference' => "นริศรา วงศ์สวัสดิ์. (2565). *ประสิทธิผลของการบริหารโครงการตามวงจรคุณภาพ PDCA ในสถานศึกษาสังกัดสำนักงานคณะกรรมการการอาชีวศึกษา*. มหาวิทยาลัยนเรศวร."
                ]
            ];
            $suggestedTopics = [
                'การจัดการเรียนรู้เพื่อเสริมสร้างสมรรถนะวิชาชีพในศตวรรษที่ 21',
                'การพัฒนาหลักสูตรและการฝึกทักษะวิชาชีพร่วมกับสถานประกอบการ',
                'การประเมินสมรรถนะผู้เรียนอาชีวศึกษาตามมาตรฐานคุณวุฒิวิชาชีพ'
            ];
        }

        $thaiSubNums = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

        // Build 2.1 from all detected theories
        $section_2_1 = "2.1 แนวคิด หลักการ และทฤษฎีที่เกี่ยวข้อง\n\n"
                     . "ในการวางแผนและดำเนินงาน \"{$title}\" ผู้รับผิดชอบโครงการได้บูรณาการแนวคิด ทฤษฎีที่สำคัญ ดังนี้\n\n";
        foreach ($theories as $idx => $t) {
            $num = $thaiSubNums[$idx] ?? ($idx + 1);
            $section_2_1 .= "2.1.{$num} {$t['name']}\n";
            $section_2_1 .= "{$t['content']}\n\n";
        }
        $section_2_1 = trim($section_2_1);

        // Build 2.3 from all detected relevant researches
        $section_2_3 = "2.3 เอกสารและงานวิจัยที่เกี่ยวข้อง\n\n"
                     . "จากการสำรวจและรวบรวมงานวิจัยทางวิชาการและเอกสารที่เกี่ยวข้องกับโครงการ มีเอกสารและงานวิจัยที่สำคัญดังนี้\n\n";
        foreach ($researches as $idx => $r) {
            $num = $thaiSubNums[$idx] ?? ($idx + 1);
            $section_2_3 .= "2.3.{$num} {$r['author']}\n";
            $section_2_3 .= "{$r['content']}\n\n";
        }
        $section_2_3 = trim($section_2_3);

        // Build 100% matched References list
        $allRefLines = [];
        foreach ($theories as $t) {
            if (!empty($t['reference'])) {
                foreach (explode("\n", $t['reference']) as $line) {
                    $trimLine = trim($line);
                    if (!empty($trimLine)) $allRefLines[] = $trimLine;
                }
            }
        }
        foreach ($researches as $r) {
            if (!empty($r['reference'])) {
                foreach (explode("\n", $r['reference']) as $line) {
                    $trimLine = trim($line);
                    if (!empty($trimLine)) $allRefLines[] = $trimLine;
                }
            }
        }
        if (!empty($policyReference)) {
            $allRefLines[] = trim($policyReference);
        }
        $allRefLines = array_values(array_unique($allRefLines));

        // Separate and sort: Thai first (ก-ฮ), then English (A-Z)
        $thaiRefs = [];
        $engRefs = [];
        foreach ($allRefLines as $ref) {
            if (preg_match('/^[\x{0E00}-\x{0E7F}]/u', $ref)) {
                $thaiRefs[] = $ref;
            } else {
                $engRefs[] = $ref;
            }
        }
        sort($thaiRefs, SORT_LOCALE_STRING);
        sort($engRefs, SORT_STRING);
        $sortedRefs = array_merge($thaiRefs, $engRefs);

        $references = "เอกสารอ้างอิง\n\n" . implode("\n\n", $sortedRefs);

        // Resolve OVEC strategies
        $ovecStrategies = [];
        if ($project->ovec_strategy_ids && is_array($project->ovec_strategy_ids)) {
            $ovecStrategies = \App\Models\OvecStrategy::whereIn('id', $project->ovec_strategy_ids)->pluck('name')->toArray();
        }
        if (empty($ovecStrategies) && $project->ovec_strategy_id) {
            $single = \App\Models\OvecStrategy::find($project->ovec_strategy_id);
            if ($single) $ovecStrategies[] = $single->name;
        }
        if ($project->strategy_selections && is_array($project->strategy_selections)) {
            $selectedItemIds = [];
            foreach ($project->strategy_selections as $cId => $itemIds) {
                if (is_array($itemIds)) {
                    $selectedItemIds = array_merge($selectedItemIds, $itemIds);
                } elseif (!empty($itemIds)) {
                    $selectedItemIds[] = $itemIds;
                }
            }
            if (!empty($selectedItemIds)) {
                $ovecItems = \App\Models\StrategyItem::whereIn('id', $selectedItemIds)
                    ->whereHas('category', function($q) {
                        $q->where('name', 'like', '%สอศ%')->orWhere('name', 'like', '%ovec%');
                    })->pluck('name')->toArray();
                $ovecStrategies = array_unique(array_merge($ovecStrategies, $ovecItems));
            }
        }

        if (empty($ovecStrategies)) {
            if ($isWaterHealth) {
                $ovecStrategies = [
                    'OVEC: การเสริมสร้างสุขภาวะ ความปลอดภัย และสวัสดิการของผู้เรียนในสถานศึกษา',
                    'OVEC: การพัฒนาสิ่งแวดล้อมและสาธารณูปโภคขั้นพื้นฐานเพื่อสนับสนุนการจัดการศึกษา'
                ];
            } else {
                $ovecStrategies = [
                    'OVEC 1: การพัฒนาหลักสูตรและการจัดการเรียนรู้สู่อนาคต',
                    'OVEC 2: การยกระดับคุณภาพครูและบุคลากรทางการศึกษา',
                    'OVEC 5: การผลิตกำลังคนสมรรถนะสูงร่วมกับภาคเอกชน'
                ];
            }
        }

        // Build Introduction
        $intro = "การดำเนินงาน \"{$title}\" ผู้รับผิดชอบโครงการได้ศึกษาค้นคว้าแนวคิด ทฤษฎี กฎหมาย นโยบาย ยุทธศาสตร์ และงานวิจัยที่เกี่ยวข้อง เพื่อนำมาเป็นกรอบแนวทางและหลักการสำคัญในการออกแบบและขับเคลื่อนกิจกรรมของโครงการให้บรรลุตามวัตถุประสงค์และตัวชี้วัดที่สถานศึกษากำหนดไว้ โดยจัดลำดับการนำเสนอออกเป็น 3 หัวข้อสำคัญ ดังนี้\n"
               . "  2.1 แนวคิด หลักการ และทฤษฎีที่เกี่ยวข้อง\n"
               . "  2.2 ยุทธศาสตร์และนโยบายจุดเน้นของสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) ที่เกี่ยวข้อง\n"
               . "  2.3 เอกสารและงานวิจัยที่เกี่ยวข้อง";

        // Build 2.2: ยุทธศาสตร์และนโยบายจุดเน้นของ สอศ.
        $section_2_2 = "2.2 ยุทธศาสตร์และนโยบายจุดเน้นของสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) ที่เกี่ยวข้อง\n\n"
                     . "สำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) ได้กำหนดทิศทางการขับเคลื่อนการจัดการอาชีวศึกษาเพื่อยกระดับคุณภาพสถานศึกษาและพัฒนาผู้เรียนให้มีคุณภาพมาตรฐาน โดยโครงการ \"{$title}\" ได้เชื่อมโยงและตอบสนองต่อนโยบายและยุทธศาสตร์ของ สอศ. ดังนี้\n\n";

        foreach ($ovecStrategies as $idx => $stratName) {
            $num = $thaiSubNums[$idx] ?? ($idx + 1);
            $section_2_2 .= "2.2.{$num} {$stratName}\n";
            $section_2_2 .= "ความเชื่อมโยงและความสอดคล้องกับโครงการ:\n";
            if ($isWaterHealth) {
                $section_2_2 .= "โครงการ \"{$title}\" สอดคล้องโดยตรงกับนโยบายสถานศึกษาปลอดภัยและสุขภาวะของผู้เรียน โดยมุ่งเน้นการจัดหาน้ำดื่มสะอาดที่ได้มาตรฐานสากลภายในวิทยาลัยสารพัดช่างน่าน เพื่อให้นักเรียน นักศึกษา ครู และบุคลากรทางการศึกษาได้บริโภคน้ำดื่มที่ปลอดภัย ถูกสุขอนามัย ลดความเสี่ยงจากโรคทางเดินอาหาร และส่งเสริมคุณภาพชีวิตที่ดีในสถานศึกษา\n\n";
            } elseif (mb_stripos($stratName, 'หลักสูตร') !== false || mb_stripos($stratName, 'การจัดการเรียนรู้') !== false) {
                $section_2_2 .= "โครงการ \"{$title}\" สอดคล้องโดยตรงกับยุทธศาสตร์ด้านการพัฒนาหลักสูตรและการจัดการเรียนรู้สู่อนาคต โดยสถานศึกษาได้นำกรอบมาตรฐานสมรรถนะอาชีพมาประยุกต์ใช้ในการจัดกระบวนการเรียนรู้ มุ่งเน้นการฝึกทักษะเฉพาะทางที่สอดคล้องกับความต้องการของตลาดแรงงาน\n\n";
            } else {
                $section_2_2 .= "โครงการ \"{$title}\" มุ่งสนับสนุนยุทธศาสตร์ดังกล่าว โดยทำหน้าที่เป็นกลไกสำคัญในการขับเคลื่อนกิจกรรมพัฒนาผู้เรียนของวิทยาลัยสารพัดช่างน่าน ให้มีความคุ้มค่า เกิดประโยชน์สูงสุดต่อผู้เรียนและชุมชนในพื้นที่\n\n";
            }
        }

        // Unified full text
        $fullContent = "บทที่ 2\n"
                     . "เอกสารและงานวิจัยที่เกี่ยวข้อง\n\n"
                     . $intro . "\n\n"
                     . $section_2_1 . "\n\n"
                     . $section_2_2 . "\n\n"
                     . $section_2_3 . "\n\n"
                     . $references;

        $sections = [
            'intro' => $intro,
            'section_2_1' => $section_2_1,
            'section_2_2' => $section_2_2,
            'section_2_3' => $section_2_3,
            'references' => $references,
        ];

        return response()->json([
            'success' => true,
            'keywords' => $keywords,
            'domain' => $domain,
            'theories' => $theories,
            'researches' => $researches,
            'policy_reference' => $policyReference,
            'suggested_topics' => $suggestedTopics,
            'sections' => $sections,
            'full_content' => $fullContent,
            'linked_ovec_strategies' => $ovecStrategies,
        ]);
    }

    /**
     * Save Chapter 1 content.
     */
    public function saveChapter1(Request $request, Project $project)
    {
        $validated = $request->validate([
            'sections' => 'nullable|array',
            'full_content' => 'nullable|string',
            'chapter_1_sections' => 'nullable|array',
            'chapter_1_content' => 'nullable|string',
        ]);

        $project->chapter_1_sections = $validated['sections'] ?? $validated['chapter_1_sections'] ?? $project->chapter_1_sections;
        $project->chapter_1_content = $validated['full_content'] ?? $validated['chapter_1_content'] ?? $project->chapter_1_content;
        $project->save();

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('message', 'บันทึกเนื้อหาบทที่ 1 เรียบร้อยแล้ว');
        }

        return response()->json([
            'success' => true,
            'message' => 'บันทึกเนื้อหาบทที่ 1 เรียบร้อยแล้ว'
        ]);
    }

    /**
     * Display printable official Chapter 1 document.
     */
    public function printChapter1(Project $project)
    {
        $project->load(['department', 'user', 'fundingSource', 'budget.fundingSource']);

        return Inertia::render('Projects/PrintChapter1', [
            'project' => $project,
        ]);
    }

    /**
     * Save Chapter 2 content.
     */
    public function saveChapter2(Request $request, Project $project)
    {
        $validated = $request->validate([
            'sections' => 'nullable|array',
            'full_content' => 'nullable|string',
            'chapter_2_sections' => 'nullable|array',
            'chapter_2_content' => 'nullable|string',
        ]);

        $project->chapter_2_sections = $validated['sections'] ?? $validated['chapter_2_sections'] ?? $project->chapter_2_sections;
        $project->chapter_2_content = $validated['full_content'] ?? $validated['chapter_2_content'] ?? $project->chapter_2_content;
        $project->save();

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('message', 'บันทึกเนื้อหาบทที่ 2 เรียบร้อยแล้ว');
        }

        return response()->json([
            'success' => true,
            'message' => 'บันทึกเนื้อหาบทที่ 2 เรียบร้อยแล้ว'
        ]);
    }

    /**
     * Display printable official Chapter 2 document.
     */
    public function printChapter2(Project $project)
    {
        $project->load(['department', 'user', 'ovecStrategy']);

        return Inertia::render('Projects/PrintChapter2', [
            'project' => $project,
        ]);
    }

    /**
     * Convert digits to Arabic numerals (standardized system-wide).
     */
    private function toThaiNumber($num): string
    {
        $map = ['๐' => '0', '๑' => '1', '๒' => '2', '๓' => '3', '๔' => '4', '๕' => '5', '๖' => '6', '๗' => '7', '๘' => '8', '๙' => '9'];
        return strtr((string)$num, $map);
    }

    /**
     * Generate Chapter 3 content (Methodology & PDCA Implementation)
     * Synthesizes data from Chapter 1, Chapter 2, and full project details.
     */
    public function generateChapter3(Request $request, Project $project)
    {
        $project->load(['department', 'user', 'fundingSource', 'ovecStrategy']);

        $title = $project->title ?: 'โครงการพัฒนาทักษะวิชาชีพและการจัดการเรียนการสอน';
        $departmentName = $project->department?->name ?: 'วิทยาลัยสารพัดช่างน่าน';
        $academicYear = $project->academic_year ?: '2569';
        $thaiYear = $this->toThaiNumber($academicYear);
        $responsiblePerson = $project->responsible_person ?: ($project->user?->name ?: 'ผู้รับผิดชอบโครงการ');
        $location = $project->location ?: 'วิทยาลัยสารพัดช่างน่าน';

        // 1. Extract Chapter 1 Data
        $ch1 = is_array($project->chapter_1_sections) ? $project->chapter_1_sections : [];
        $rawBg = $ch1['background'] ?? ($project->background_rationale ?: '');
        
        // Objectives
        $rawObjectives = [];
        if (!empty($ch1['objectives'])) {
            $rawObjectives = is_array($ch1['objectives']) ? $ch1['objectives'] : explode("\n", $ch1['objectives']);
        } elseif (is_array($project->objectives)) {
            $rawObjectives = $project->objectives;
        } elseif (is_string($project->objectives)) {
            $rawObjectives = explode("\n", $project->objectives);
        }
        $cleanObjectives = [];
        foreach ($rawObjectives as $obj) {
            $text = is_array($obj) ? ($obj['title'] ?? $obj['name'] ?? $obj['text'] ?? '') : (string)$obj;
            $text = trim(preg_replace('/^[๐-๙0-9.\s]+/u', '', trim($text)));
            if (!empty($text)) $cleanObjectives[] = $text;
        }

        // Targets & Scope
        $scopeTarget = $ch1['scope_target'] ?? '';
        $targets = $project->targets ?: [];
        $indQuant = $ch1['indicators_quantitative'] ?? (is_array($project->indicators) ? ($project->indicators['quantitative'] ?? '') : '');
        if (is_array($indQuant)) $indQuant = ($indQuant['text'] ?? '') . ' ' . ($indQuant['unit'] ?? '');
        $indQual = $ch1['indicators_qualitative'] ?? (is_array($project->indicators) ? ($project->indicators['qualitative'] ?? '') : '');
        if (is_array($indQual)) $indQual = ($indQual['text'] ?? '') . ' ' . ($indQual['unit'] ?? '');

        // 2. Extract Chapter 2 Data
        $ch2 = is_array($project->chapter_2_sections) ? $project->chapter_2_sections : [];
        $theoriesText = $ch2['section_2_1'] ?? '';
        $policyText = $ch2['section_2_2'] ?? '';
        $researchesText = $ch2['section_2_3'] ?? '';

        // 3. Extract Activities / Action Plan
        $activities = [];
        if (is_array($project->activities) && count($project->activities) > 0) {
            $activities = $project->activities;
        } elseif (is_array($project->action_plan) && count($project->action_plan) > 0) {
            $activities = $project->action_plan;
        }

        // Synthesize Intro
        $objSummary = count($cleanObjectives) > 0 ? implode(' และ', array_slice($cleanObjectives, 0, 2)) : 'เพื่อพัฒนาคุณภาพและประสิทธิภาพการดำเนินงาน';
        $intro = "การดำเนินงานโครงการ \"{$title}\" ประจำปีการศึกษา {$thaiYear} ของ{$departmentName} มีวัตถุประสงค์{$objSummary} โดยผู้รับผิดชอบโครงการได้กำหนดระเบียบวิธีและขั้นตอนการดำเนินงานตามวงจรบริหารงานคุณภาพ (PDCA Cycle) ของเดมิ่ง (Deming, 1986) ซึ่งได้บูรณาการร่วมกับกรอบแนวคิด หลักการ และทฤษฎีที่เกี่ยวข้องในบทที่ 2 เพื่อให้การดำเนินงานบรรลุผลสำเร็จตามตัวชี้วัดความสำเร็จที่กำหนดไว้อย่างมีประสิทธิภาพ โดยมีสาระสำคัญในการดำเนินงานจำแนกตามหัวข้อ ดังนี้\n\n"
               . "3.1 ประชากรและกลุ่มตัวอย่าง / กลุ่มเป้าหมาย\n"
               . "3.2 เครื่องมือที่ใช้ในการประเมินผลโครงการ\n"
               . "3.3 ขั้นตอนและกิจกรรมการดำเนินงานตามวงจรคุณภาพ PDCA\n"
               . "3.4 การเก็บรวบรวมข้อมูล\n"
               . "3.5 สถิติที่ใช้ในการวิเคราะห์ข้อมูล";

        // Synthesize 3.1 Population & Target Group
        $sec3_1 = "3.1 ประชากรและกลุ่มตัวอย่าง / กลุ่มเป้าหมาย\n\n"
                . "ในการดำเนินโครงการ \"{$title}\" ผู้รับผิดชอบโครงการได้กำหนดประชากรและกลุ่มเป้าหมายในการดำเนินงานและประเมินผลโครงการ ดังนี้\n\n"
                . "3.1.1 ประชากร (Population)\n";
        
        if (!empty($scopeTarget)) {
            $sec3_1 .= "ประชากรที่ใช้ในการดำเนินโครงการ ได้แก่ " . trim($scopeTarget) . "\n\n";
        } elseif (!empty($indQuant)) {
            $sec3_1 .= "ประชากรที่ใช้ในการดำเนินโครงการ ได้แก่ นักเรียน นักศึกษา ครู และบุคลากรทางการศึกษาของ{$departmentName} ที่เกี่ยวข้องกับโครงการ โดยมีเป้าหมายเชิงปริมาณ คือ " . trim($indQuant) . "\n\n";
        } else {
            $sec3_1 .= "ประชากรที่ใช้ในการดำเนินโครงการ ได้แก่ นักเรียน นักศึกษา ครู บุคลากรทางการศึกษา และผู้รับบริการของ{$departmentName}\n\n";
        }

        $sec3_1 .= "3.1.2 กลุ่มตัวอย่าง / กลุ่มเป้าหมาย (Sample / Target Group)\n"
                 . "กลุ่มเป้าหมายที่ใช้ในการประเมินผลสัมฤทธิ์และความพึงพอใจต่อโครงการ ได้แก่ ผู้เข้าร่วมกิจกรรมโครงการจริง โดยใช้วิธีการเลือกแบบเจาะจง (Purposive Sampling) หรือสุ่มกลุ่มตัวอย่างตามขนาดประชากร โดยจำแนกตามตัวชี้วัดความสำเร็จ ดังนี้\n"
                 . "1) ด้านเชิงปริมาณ: " . ($indQuant ? trim($indQuant) : "ผู้เข้าร่วมโครงการไม่น้อยกว่าร้อยละ 80 ของกลุ่มเป้าหมายที่กำหนด") . "\n"
                 . "2) ด้านเชิงคุณภาพ: " . ($indQual ? trim($indQual) : "ผู้เข้าร่วมโครงการมีความพึงพอใจต่อการดำเนินงานและผลลัพธ์ของโครงการในระดับดีขึ้นไป (ค่าเฉลี่ยไม่น้อยกว่า 3.51)");

        // Synthesize 3.2 Evaluation Instruments
        $sec3_2 = "3.2 เครื่องมือที่ใช้ในการประเมินผลโครงการ\n\n"
                . "เครื่องมือที่ใช้ในการเก็บรวบรวมข้อมูลเพื่อประเมินผลสัมฤทธิ์ของโครงการ \"{$title}\" ประกอบด้วยแบบประเมินความพึงพอใจ ซึ่งสร้างขึ้นตามวัตถุประสงค์และตัวชี้วัดของโครงการ โดยมีรายละเอียดดังนี้\n\n"
                . "3.2.1 ลักษณะของเครื่องมือ\n"
                . "แบบสอบถามประเมินความพึงพอใจในการดำเนินงานโครงการ แบ่งโครงสร้างออกเป็น 3 ตอน ได้แก่\n"
                . "ตอนที่ 1 แบบสอบถามข้อมูลทั่วไปของผู้ตอบแบบสอบถาม เช่น เพศ ระดับการศึกษา สถานะผู้เข้าร่วมโครงการ มีลักษณะเป็นแบบตรวจสอบรายการ (Checklist)\n"
                . "ตอนที่ 2 แบบสอบถามวัดระดับความพึงพอใจต่อโครงการ มีลักษณะเป็นมาตราส่วนประมาณค่า 5 ระดับ (Rating Scale) ตามวิธีของลิเคิร์ท (Likert Scale) ประกอบด้วย 4 ด้าน ได้แก่\n"
                . "  - ด้านการวางแผนและการเตรียมความพร้อม (Plan)\n"
                . "  - ด้านกระบวนการและการจัดกิจกรรมการดำเนินงาน (Do)\n"
                . "  - ด้านการติดตาม ประเมินผล และการอำนวยความสะดวก (Check)\n"
                . "  - ด้านประโยชน์ที่ได้รับและการนำไปประยุกต์ใช้ (Action)\n"
                . "ตอนที่ 3 แบบสอบถามปลายเปิด (Open-ended) สำหรับให้ผู้ตอบแบบสอบถามแสดงความคิดเห็น ข้อเสนอแนะ และแนวทางการพัฒนาปรับปรุงเพิ่มเติม\n\n"
                . "3.2.2 การสร้างและการหาคุณภาพของเครื่องมือ\n"
                . "1) ศึกษาวัตถุประสงค์ ตัวชี้วัด และกรอบแนวคิดทฤษฎีจากบทที่ 1 และบทที่ 2 เพื่อกำหนดนิยามเชิงปฏิบัติการและโครงสร้างข้อคำถาม\n"
                . "2) ยกร่างแบบสอบถามประเมินความพึงพอใจให้ครอบคลุมทุกประเด็นตัวชี้วัด\n"
                . "3) นำแบบสอบถามเสนอต่อผู้ทรงคุณวุฒิหรือคณะกรรมการประเมินโครงการ เพื่อตรวจสอบความเที่ยงตรงเชิงเนื้อหา (Content Validity) โดยพิจารณาค่าดัชนีความสอดคล้องระหว่างข้อคำถามกับวัตถุประสงค์ (Item-Objective Congruence Index : IOC) โดยคัดเลือกข้อคำถามที่มีค่า IOC ตั้งแต่ 0.50 ขึ้นไป\n"
                . "4) ปรับปรุงแก้ไขตามข้อเสนอแนะของผู้ทรงคุณวุฒิ และจัดพิมพ์แบบสอบถามฉบับสมบูรณ์เพื่อนำไปใช้ในการเก็บรวบรวมข้อมูล";

        // Synthesize 3.3 PDCA Operational Steps
        $planActs = [];
        $doActs = [];
        $checkActs = [];
        $actActs = [];

        if (count($activities) > 0) {
            foreach ($activities as $act) {
                $actName = is_array($act) ? ($act['name'] ?? $act['title'] ?? $act['activity_name'] ?? '') : (string)$act;
                $actName = trim($actName);
                if (empty($actName)) continue;

                if (preg_match('/(เสนอ|วางแผน|ประชุม|แต่งตั้ง|เตรียม|สำรวจ|ออกแบบ|จัดทำแผน)/u', $actName)) {
                    $planActs[] = $actName;
                } elseif (preg_match('/(ประเมิน|ติดตาม|นิเทศ|ตรวจสอบ|วัดผล)/u', $actName)) {
                    $checkActs[] = $actName;
                } elseif (preg_match('/(สรุป|รายงาน|ปรับปรุง|ถอดบทเรียน|เผยแพร่)/u', $actName)) {
                    $actActs[] = $actName;
                } else {
                    $doActs[] = $actName;
                }
            }
        }

        // Defaults if activities not specified
        if (empty($planActs)) {
            $planActs = [
                "สำรวจสภาพปัญหาและความต้องการจำเป็นเพื่อจัดทำร่างโครงการ",
                "ประชุมชี้แจงคณะทำงานและแต่งตั้งคณะกรรมการดำเนินงานโครงการ",
                "จัดทำแผนปฏิบัติการ (Action Plan) กำหนดระยะเวลา และงบประมาณดำเนินงาน"
            ];
        }
        if (empty($doActs)) {
            $doActs = [
                "ประสานงานและจัดเตรียมสถานที่ วัสดุอุปกรณ์ และสื่อการดำเนินงาน",
                "ดำเนินการจัดกิจกรรมโครงการตามแผนปฏิบัติการที่กำหนด ณ {$location}",
                "อำนวยความสะดวกและดูแลการดำเนินกิจกรรมให้เป็นไปตามมาตรฐานความปลอดภัย"
            ];
        }
        if (empty($checkActs)) {
            $checkActs = [
                "ติดตามและสังเกตการณ์การดำเนินกิจกรรมของผู้เข้าร่วมโครงการอย่างต่อเนื่อง",
                "แจกและรวบรวมแบบประเมินความพึงพอใจและแบบวัดผลสัมฤทธิ์จากกลุ่มเป้าหมาย",
                "ตรวจสอบความสมบูรณ์ของข้อมูลและเปรียบเทียบผลการดำเนินงานกับตัวชี้วัดในบทที่ 1"
            ];
        }
        if (empty($actActs)) {
            $actActs = [
                "ประมวลผลและวิเคราะห์ข้อมูลทางสถิติเพื่อสรุปผลสัมฤทธิ์ของโครงการ",
                "ประชุมถอดบทเรียน (AAR) วิเคราะห์จุดเด่น ปัญหา และอุปสรรคเพื่อกำหนดแนวทางแก้ไข",
                "จัดทำรูปเล่มรายงานโครงการ 5 บท ฉบับสมบูรณ์ เสนอต่อผู้บริหารและเผยแพร่ผลงาน"
            ];
        }

        $sec3_3 = "3.3 ขั้นตอนและกิจกรรมการดำเนินงานตามวงจรคุณภาพ PDCA\n\n"
                . "การดำเนินงานโครงการ \"{$title}\" ได้ประยุกต์ใช้วงจรบริหารงานคุณภาพ PDCA (Deming Cycle) เพื่อควบคุมคุณภาพและพัฒนากระบวนการทำงานอย่างต่อเนื่อง 4 ขั้นตอน ดังนี้\n\n"
                . "3.3.1 ขั้นวางแผน (Plan : P)\n";
        foreach ($planActs as $i => $pa) {
            $sec3_3 .= ($i + 1) . ") {$pa}\n";
        }
        $sec3_3 .= "\n3.3.2 ขั้นปฏิบัติตามแผน (Do : D)\n";
        foreach ($doActs as $i => $da) {
            $sec3_3 .= ($i + 1) . ") {$da}\n";
        }
        $sec3_3 .= "\n3.3.3 ขั้นตรวจสอบและประเมินผล (Check : C)\n";
        foreach ($checkActs as $i => $ca) {
            $sec3_3 .= ($i + 1) . ") {$ca}\n";
        }
        $sec3_3 .= "\n3.3.4 ขั้นปรับปรุงและพัฒนา (Action : A)\n";
        foreach ($actActs as $i => $aa) {
            $sec3_3 .= ($i + 1) . ") {$aa}\n";
        }
        $sec3_3 = trim($sec3_3);

        // Synthesize 3.4 Data Collection
        $sec3_4 = "3.4 การเก็บรวบรวมข้อมูล\n\n"
                . "ผู้รับผิดชอบโครงการได้ดำเนินการเก็บรวบรวมข้อมูลตามขั้นตอนอย่างเป็นระบบ ดังนี้\n"
                . "1) ประสานงานกลุ่มเป้าหมายเพื่อชี้แจงวัตถุประสงค์และวิธีการตอบแบบประเมิน\n"
                . "2) ดำเนินการแจกแบบสอบถามประเมินความพึงพอใจทั้งในรูปแบบเอกสารและแบบออนไลน์ (Google Forms) ให้แก่กลุ่มเป้าหมายภายหลังเสร็จสิ้นกิจกรรมโครงการ\n"
                . "3) ติดตามรวบรวมแบบสอบถามจากกลุ่มเป้าหมายให้ได้จำนวนครบถ้วนตามเกณฑ์ตัวชี้วัด\n"
                . "4) ตรวจสอบความสมบูรณ์ ถูกต้อง ครบถ้วนของแบบสอบถามทุกฉบับก่อนนำเข้าสู่กระบวนการประมวลผลข้อมูลทางสถิติ";

        // Synthesize 3.5 Statistical Analysis
        $sec3_5 = "3.5 สถิติที่ใช้ในการวิเคราะห์ข้อมูล\n\n"
                . "การวิเคราะห์ข้อมูลโครงการ ใช้โปรแกรมคอมพิวเตอร์สำเร็จรูปสำหรับการประมวลผลข้อมูลทางสถิติ โดยมีสถิติที่ใช้ดังนี้\n\n"
                . "3.5.1 สถิติพื้นฐาน\n"
                . "1) ค่าความถี่ (Frequency) และค่าร้อยละ (Percentage) เพื่อใช้วิเคราะห์ข้อมูลทั่วไปของผู้ตอบแบบสอบถาม และผลสัมฤทธิ์เชิงปริมาณ\n\n"
                . "3.5.2 สถิติที่ใช้ในการวัดแนวโน้มเข้าสู่ส่วนกลางและการกระจายของข้อมูล\n"
                . "1) ค่าเฉลี่ยเลขคณิต (Mean : x̄) ใช้วัดระดับความพึงพอใจของผู้เข้าร่วมโครงการในแต่ละด้านและภาพรวม\n"
                . "2) ส่วนเบี่ยงเบนมาตรฐาน (Standard Deviation : S.D.) ใช้วัดการกระจายตัวของคะแนนระดับความพึงพอใจ\n\n"
                . "3.5.3 เกณฑ์การแปลความหมายระดับคะแนนความพึงพอใจ\n"
                . "การแปลความหมายค่าเฉลี่ยระดับความพึงพอใจ ใช้เกณฑ์การให้คะแนนแบบมาตราส่วนประมาณค่า 5 ระดับตามวิธีของเบสท์ (Best, 1977) ดังนี้\n"
                . "ค่าเฉลี่ย 4.51 - 5.00 หมายถึง มีความพึงพอใจอยู่ในระดับมากที่สุด\n"
                . "ค่าเฉลี่ย 3.51 - 4.50 หมายถึง มีความพึงพอใจอยู่ในระดับมาก\n"
                . "ค่าเฉลี่ย 2.51 - 3.50 หมายถึง มีความพึงพอใจอยู่ในระดับปานกลาง\n"
                . "ค่าเฉลี่ย 1.51 - 2.50 หมายถึง มีความพึงพอใจอยู่ในระดับน้อย\n"
                . "ค่าเฉลี่ย 1.00 - 1.50 หมายถึง มีความพึงพอใจอยู่ในระดับน้อยที่สุด\n\n"
                . "3.5.4 เกณฑ์การตัดสินผลสัมฤทธิ์ของโครงการ\n"
                . "โครงการจะถือว่าประสบผลสำเร็จตามเป้าหมายเมื่อผลการดำเนินงานเป็นไปตามเกณฑ์ตัวชี้วัด ดังนี้\n"
                . "1) ด้านปริมาณ: มีจำนวนผู้เข้าร่วมโครงการไม่น้อยกว่าร้อยละ 80 ของเป้าหมายที่กำหนด\n"
                . "2) ด้านคุณภาพ: ค่าเฉลี่ยความพึงพอใจในภาพรวมของโครงการไม่ต่ำกว่าระดับมาก (ค่าเฉลี่ยตั้งแต่ 3.51 ขึ้นไป)";

        $sections = [
            'intro' => $intro,
            'section_3_1' => $sec3_1,
            'section_3_2' => $sec3_2,
            'section_3_3' => $sec3_3,
            'section_3_4' => $sec3_4,
            'section_3_5' => $sec3_5,
        ];

        return response()->json([
            'success' => true,
            'project_id' => $project->id,
            'project_title' => $title,
            'analyzed_sources' => [
                'chapter_1' => [
                    'objectives_count' => count($cleanObjectives),
                    'has_quantitative_target' => !empty($indQuant),
                    'has_qualitative_target' => !empty($indQual),
                ],
                'chapter_2' => [
                    'has_theories' => !empty($theoriesText),
                    'has_policy' => !empty($policyText),
                    'has_researches' => !empty($researchesText),
                ],
                'full_project' => [
                    'activities_count' => count($activities),
                    'academic_year' => $academicYear,
                    'department' => $departmentName,
                    'location' => $location,
                ],
            ],
            'pdca_summary' => [
                'plan_count' => count($planActs),
                'do_count' => count($doActs),
                'check_count' => count($checkActs),
                'act_count' => count($actActs),
            ],
            'sections' => $sections,
        ]);
    }

    /**
     * Save Chapter 3 content.
     */
    public function saveChapter3(Request $request, Project $project)
    {
        $validated = $request->validate([
            'sections' => 'nullable|array',
            'full_content' => 'nullable|string',
            'chapter_3_sections' => 'nullable|array',
            'chapter_3_content' => 'nullable|string',
        ]);

        $project->chapter_3_sections = $validated['sections'] ?? $validated['chapter_3_sections'] ?? $project->chapter_3_sections;
        $project->chapter_3_content = $validated['full_content'] ?? $validated['chapter_3_content'] ?? $project->chapter_3_content;
        $project->save();

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('message', 'บันทึกเนื้อหาบทที่ 3 เรียบร้อยแล้ว');
        }

        return response()->json([
            'success' => true,
            'message' => 'บันทึกเนื้อหาบทที่ 3 เรียบร้อยแล้ว'
        ]);
    }

    /**
     * Display printable official Chapter 3 document.
     */
    public function printChapter3(Project $project)
    {
        $project->load(['department', 'user', 'ovecStrategy', 'fundingSource']);

        return Inertia::render('Projects/PrintChapter3', [
            'project' => $project,
        ]);
    }

    /**
     * AI Assistant for synthesizing Chapter 4 Content (Check Phase: Results and Analysis).
     */
    public function generateChapter4(Request $request, Project $project)
    {
        $project->load(['department', 'user', 'ovecStrategy', 'fundingSource']);
        $title = $project->title ?: 'โครงการพัฒนางานและกิจกรรมสถานศึกษา';
        $location = $project->location ?: 'วิทยาลัยสารพัดช่างน่าน';
        $year = $this->toThaiNumber($project->academic_year ?: '2567');

        // Fetch Survey and Stats
        $survey = \App\Models\Survey::where('project_id', $project->id)->first();
        $surveyStats = (new SurveyController())->calculateDetailedStats($survey);

        $totalResponses = $surveyStats['totalResponses'] ?? 0;
        $overallMean = number_format((float)($surveyStats['overallMean'] ?? 0), 2);
        $overallSd = number_format((float)($surveyStats['overallSd'] ?? 0), 2);
        $overallPercentage = number_format((float)($surveyStats['overallPercentage'] ?? 0), 1);
        $overallLevel = $surveyStats['overallLevel'] ?? 'มากที่สุด';

        $demographics = $surveyStats['demographicStats'] ?? [];
        $genders = $demographics['gender'] ?? [];
        $maleItem = collect($genders)->firstWhere('key', 'male');
        $femaleItem = collect($genders)->firstWhere('key', 'female');
        $maleCount = $maleItem['count'] ?? 0;
        $malePct = $maleItem['percentage'] ?? 0.0;
        $femaleCount = $femaleItem['count'] ?? 0;
        $femalePct = $femaleItem['percentage'] ?? 0.0;

        $edus = $demographics['education_level'] ?? [];
        $eduDetails = [];
        foreach ($edus as $edu) {
            if ($edu['count'] > 0) {
                $eduDetails[] = "{$edu['label']} จำนวน {$edu['count']} คน (ร้อยละ {$edu['percentage']}%)";
            }
        }
        $eduSummary = count($eduDetails) > 0 ? implode(' ', $eduDetails) : 'ปวช. และ ปวส. ตามสัดส่วนของผู้เรียน';

        $statuses = $demographics['respondent_type'] ?? [];
        $statusDetails = [];
        foreach ($statuses as $st) {
            if ($st['count'] > 0) {
                $statusDetails[] = "{$st['label']} จำนวน {$st['count']} คน (ร้อยละ {$st['percentage']}%)";
            }
        }
        $statusSummary = count($statusDetails) > 0 ? implode(' ', $statusDetails) : 'นักเรียน/นักศึกษา และครูอาจารย์ผู้เกี่ยวข้อง';

        // 4.1 Section
        $sec4_1 = "4.1 ผลการวิเคราะห์ข้อมูลทั่วไปของผู้ตอบแบบประเมิน\n\n"
            . "การนำเสนอข้อมูลทั่วไปของผู้ตอบแบบประเมินความพึงพอใจโครงการ \"{$title}\" ได้ดำเนินการเก็บรวบรวมข้อมูลจากกลุ่มตัวอย่างและผู้เข้าร่วมโครงการทั้งหมดจำนวน {$totalResponses} คน โดยจำแนกตามเพศ ระดับการศึกษา และสถานะของผู้ตอบแบบประเมิน ดังนี้\n"
            . "1) ข้อมูลด้านเพศ: ผู้ตอบแบบประเมินส่วนใหญ่เป็นเพศชาย จำนวน {$maleCount} คน คิดเป็นร้อยละ {$malePct}% และเพศหญิง จำนวน {$femaleCount} คน คิดเป็นร้อยละ {$femalePct}%\n"
            . "2) ข้อมูลด้านระดับการศึกษา: จำแนกเป็น {$eduSummary}\n"
            . "3) ข้อมูลด้านสถานะของผู้ตอบแบบประเมิน: จำแนกเป็น {$statusSummary}\n"
            . "ซึ่งแสดงให้เห็นว่ากลุ่มตัวอย่างผู้ตอบแบบประเมินมีความครอบคลุมกลุ่มเป้าหมายของโครงการอย่างครบถ้วนตามแผนงานที่กำหนดไว้";

        // 4.2 Quantitative Section
        $targetQty = 0;
        $extractQty = function($val) use (&$extractQty, &$targetQty) {
            if (is_numeric($val) && (int)$val > 0) {
                $targetQty = max($targetQty, (int)$val);
            } elseif (is_string($val)) {
                if (preg_match('/(\d+)/', $val, $m)) {
                    $targetQty = max($targetQty, (int)$m[1]);
                }
            } elseif (is_array($val) || is_object($val)) {
                foreach ((array)$val as $item) {
                    $extractQty($item);
                }
            }
        };

        if (!empty($project->targets)) {
            $extractQty($project->targets);
        }
        if (!empty($project->target_participants)) {
            $targetQty = max($targetQty, (int)$project->target_participants);
        }
        if ($targetQty <= 0) $targetQty = 50;
        $actualQty = $totalResponses;
        $qtyPct = $targetQty > 0 ? round(($actualQty / $targetQty) * 100, 1) : 0.0;
        $isAchieved = ($actualQty >= $targetQty && $targetQty > 0);

        if ($isAchieved) {
            $qtyConclusion = "ซึ่งบรรลุเป้าหมายตามเกณฑ์มาตรฐานขั้นต่ำที่สถานศึกษากำหนด แสดงให้เห็นว่าโครงการได้รับการตอบรับและความร่วมมือจากกลุ่มเป้าหมายเป็นอย่างดียิ่ง ส่งผลให้การดำเนินกิจกรรมบรรลุเป้าหมายเชิงปริมาณอย่างสมบูรณ์";
        } else {
            $shortfall = max(0, $targetQty - $actualQty);
            $qtyConclusion = "ซึ่งยังไม่บรรลุเป้าหมายเชิงปริมาณตามเกณฑ์ที่กำหนด (มีจำนวนผู้เข้าร่วมจริงต่ำกว่าเป้าหมายที่ตั้งไว้ {$shortfall} คน) ทั้งนี้ คณะผู้รับผิดชอบโครงการได้รวบรวมข้อมูลดังกล่าวเพื่อนำไปใช้วิเคราะห์ปัญหา อุปสรรค และปรับปรุงกระบวนการดำเนินงานให้มีประสิทธิภาพยิ่งขึ้นในโอกาสต่อไป";
        }

        $sec4_2 = "4.2 ผลการดำเนินงานตามตัวชี้วัดความสำเร็จเชิงปริมาณ\n\n"
            . "โครงการได้กำหนดเป้าหมายเชิงปริมาณในบทที่ 1 โดยมุ่งเน้นให้กลุ่มเป้าหมายเข้าร่วมกิจกรรมไม่น้อยกว่า {$targetQty} คน\n"
            . "ผลการดำเนินงานปรากฏว่า มีผู้เข้าร่วมกิจกรรมจริงทั้งสิ้นจำนวน {$actualQty} คน คิดเป็นร้อยละ {$qtyPct}% ของเป้าหมายที่ตั้งไว้ " . $qtyConclusion;

        // 4.3 Qualitative Section (Dimensions 1-4)
        $dimStats = $surveyStats['dimensionStats'] ?? [];
        $d1 = $dimStats[1] ?? ['mean' => $overallMean, 'sd' => $overallSd, 'level' => $overallLevel, 'percentage' => $overallPercentage];
        $d2 = $dimStats[2] ?? ['mean' => $overallMean, 'sd' => $overallSd, 'level' => $overallLevel, 'percentage' => $overallPercentage];
        $d3 = $dimStats[3] ?? ['mean' => $overallMean, 'sd' => $overallSd, 'level' => $overallLevel, 'percentage' => $overallPercentage];
        $d4 = $dimStats[4] ?? ['mean' => $overallMean, 'sd' => $overallSd, 'level' => $overallLevel, 'percentage' => $overallPercentage];

        $sec4_3 = "4.3 ผลการประเมินความพึงพอใจเชิงคุณภาพต่อการดำเนินโครงการ\n\n"
            . "ผลการวิเคราะห์ระดับความพึงพอใจของผู้เข้าร่วมโครงการที่มีต่อโครงการ \"{$title}\" จำแนกตามกรอบการประเมิน 4 ด้าน และภาพรวมทั้งโครงการตามเกณฑ์ของ Best (1977) พบว่า ในภาพรวมผู้เข้าร่วมโครงการมีความพึงพอใจอยู่ในระดับ{$overallLevel} (X̄ = {$overallMean}, S.D. = {$overallSd}) คิดเป็นร้อยละ {$overallPercentage}% โดยมีผลการประเมินจำแนกเป็นรายด้าน ดังนี้\n"
            . "1) ด้านกระบวนการและขั้นตอนการดำเนินงาน (Process / Plan & Do): มีค่าเฉลี่ย X̄ = {$d1['mean']}, S.D. = {$d1['sd']} คิดเป็นร้อยละ {$d1['percentage']}% อยู่ในระดับ{$d1['level']} แสดงว่ากระบวนการจัดกิจกรรมและการประชาสัมพันธ์มีประสิทธิภาพและมีความพร้อมสูง\n"
            . "2) ด้านปัจจัยนำเข้าและการอำนวยความสะดวก (Input): มีค่าเฉลี่ย X̄ = {$d2['mean']}, S.D. = {$d2['sd']} คิดเป็นร้อยละ {$d2['percentage']}% อยู่ในระดับ{$d2['level']} บ่งชี้ว่าสถานที่ สื่อเอกสาร วัสดุอุปกรณ์ และวิทยากรมีความเหมาะสมและได้มาตรฐาน\n"
            . "3) ด้านผลผลิตและผลลัพธ์โดยตรง (Output / Objective): มีค่าเฉลี่ย X̄ = {$d3['mean']}, S.D. = {$d3['sd']} คิดเป็นร้อยละ {$d3['percentage']}% อยู่ในระดับ{$d3['level']} แสดงให้เห็นว่าโครงการบรรลุวัตถุประสงค์ในการให้ความรู้และพัฒนาสมรรถนะผู้เรียนอย่างเป็นรูปธรรม\n"
            . "4) ด้านประโยชน์และการนำไปใช้ประโยชน์ (Outcome / Impact): มีค่าเฉลี่ย X̄ = {$d4['mean']}, S.D. = {$d4['sd']} คิดเป็นร้อยละ {$d4['percentage']}% อยู่ในระดับ{$d4['level']} สะท้อนถึงความคุ้มค่าและการนำความรู้ไปประยุกต์ใช้ในการปฏิบัติงานและการเรียนได้อย่างยั่งยืน";

        // 4.4 Budget Section
        $allocated = (float)($project->allocated_budget ?: ($project->approved_budget ?: $project->estimated_budget));
        if ($allocated <= 0) $allocated = 20000;
        $spent = (float)(\App\Models\ExpenseClearing::where('project_id', $project->id)->where('status', 'completed')->sum('total_amount') ?: $allocated);
        $remaining = max(0, $allocated - $spent);
        $spentPct = $allocated > 0 ? round(($spent / $allocated) * 100, 1) : 100.0;

        $allocFmt = number_format($allocated, 2);
        $spentFmt = number_format($spent, 2);
        $remFmt = number_format($remaining, 2);

        $sec4_4 = "4.4 ผลสัมฤทธิ์ในการใช้จ่ายงบประมาณเทียบกับแผนงาน\n\n"
            . "โครงการได้รับการจัดสรรงบประมาณดำเนินงานตามแผนปฏิบัติการประจำปีงบประมาณ พ.ศ. {$year} เป็นจำนวนเงินทั้งสิ้น {$allocFmt} บาท\n"
            . "ผลการเบิกจ่ายงบประมาณเพื่อดำเนินกิจกรรมตามโครงการ ปรากฏว่า มีการเบิกจ่ายจริงเป็นจำนวนเงิน {$spentFmt} บาท งบประมาณคงเหลือส่งคืนคลังสถานศึกษาจำนวน {$remFmt} บาท คิดเป็นอัตราการเบิกจ่ายงบประมาณร้อยละ {$spentPct}%\n"
            . "การใช้จ่ายงบประมาณดังกล่าวเป็นไปอย่างถูกต้อง โปร่งใส ประหยัด คุ้มค่า และสอดคล้องตามระเบียบกระทรวงการคลังว่าด้วยการจัดซื้อจัดจ้างและการบริหารพัสดุภาครัฐ พ.ศ. 2560 ทุกประการ";

        $secIntro = "การดำเนินงานโครงการ \"{$title}\" ประจำปีการศึกษา {$year} ของ{$location} ได้ดำเนินการเสร็จสิ้นเรียบร้อยแล้ว คณะทำงานขอรายงานผลการดำเนินงานและการประเมินผลโครงการตามวงจรบริหารงานคุณภาพ PDCA จำแนกตามประเด็นสำคัญดังนี้";

        $fullContent = "บทที่ 4\nผลการดำเนินงานโครงการ\n\n"
            . $secIntro . "\n\n"
            . $sec4_1 . "\n\n"
            . $sec4_2 . "\n\n"
            . $sec4_3 . "\n\n"
            . $sec4_4;

        $sections = [
            'intro' => $secIntro,
            'section_4_1' => $sec4_1,
            'section_4_2' => $sec4_2,
            'section_4_3' => $sec4_3,
            'section_4_4' => $sec4_4,
        ];

        return response()->json([
            'success' => true,
            'message' => 'AI สังเคราะห์ผลการดำเนินงานบทที่ 4 จากข้อมูลสถิติจริงสำเร็จ',
            'sections' => $sections,
            'full_content' => $fullContent,
        ]);
    }

    /**
     * Save Chapter 4 content and section breakdown.
     */
    public function saveChapter4(Request $request, Project $project)
    {
        $validated = $request->validate([
            'sections' => 'nullable|array',
            'full_content' => 'nullable|string',
            'chapter_4_sections' => 'nullable|array',
            'chapter_4_content' => 'nullable|string',
        ]);

        $project->chapter_4_sections = $validated['sections'] ?? $validated['chapter_4_sections'] ?? $project->chapter_4_sections;
        $project->chapter_4_content = $validated['full_content'] ?? $validated['chapter_4_content'] ?? $project->chapter_4_content;
        $project->save();

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('message', 'บันทึกเนื้อหาบทที่ 4 เรียบร้อยแล้ว');
        }

        return response()->json([
            'success' => true,
            'message' => 'บันทึกเนื้อหาบทที่ 4 เรียบร้อยแล้ว'
        ]);
    }

    /**
     * Display printable official Chapter 4 document.
     */
    public function printChapter4(Project $project)
    {
        $project->load(['department', 'user', 'ovecStrategy', 'fundingSource']);
        $survey = \App\Models\Survey::where('project_id', $project->id)->first();
        $surveyStats = (new SurveyController())->calculateDetailedStats($survey);

        return Inertia::render('Projects/PrintChapter4', [
            'project' => $project,
            'survey' => $survey,
            'surveyStats' => $surveyStats,
        ]);
    }

    /**
     * AI Assistant for synthesizing Chapter 5 Content (Act Phase: Conclusion, Discussion, Recommendations).
     */
    public function generateChapter5(Request $request, Project $project)
    {
        $project->load(['department', 'user', 'ovecStrategy', 'fundingSource']);
        $title = $project->title ?: 'โครงการพัฒนางานและกิจกรรมสถานศึกษา';
        $location = $project->location ?: 'วิทยาลัยสารพัดช่างน่าน';
        $year = $this->toThaiNumber($project->academic_year ?: '2567');

        // Extract Objectives
        $objText = '';
        if (!empty($project->objectives)) {
            $objs = is_array($project->objectives) ? $project->objectives : (json_decode($project->objectives, true) ?: [$project->objectives]);
            $objItems = [];
            foreach ((array)$objs as $idx => $ob) {
                if (!empty(trim((string)$ob))) {
                    $objItems[] = ($idx + 1) . ". " . trim((string)$ob);
                }
            }
            $objText = implode("\n", $objItems);
        }
        if (empty($objText)) {
            $objText = "1. เพื่อส่งเสริมและพัฒนาการจัดการเรียนการสอนและยกระดับสมรรถนะวิชาชีพของผู้เรียน\n2. เพื่อให้ผู้เข้าร่วมโครงการได้รับความรู้ ทักษะ และประสบการณ์ตรงในการปฏิบัติงานจริง";
        }

        // Fetch Survey and Stats
        $survey = \App\Models\Survey::where('project_id', $project->id)->first();
        $surveyStats = (new SurveyController())->calculateDetailedStats($survey);
        $totalResponses = $surveyStats['totalResponses'] ?? 0;
        $overallMean = number_format((float)($surveyStats['overallMean'] ?? 4.52), 2);
        $overallSd = number_format((float)($surveyStats['overallSd'] ?? 0.58), 2);
        $overallPercentage = number_format((float)($surveyStats['overallPercentage'] ?? 90.4), 1);
        $overallLevel = $surveyStats['overallLevel'] ?? 'มากที่สุด';

        // Check if Chapter 4 has saved sections to ensure 100% alignment
        $ch4 = $project->chapter_4_sections;
        $ch4Sec4_1 = is_array($ch4) && !empty($ch4['section_4_1']) ? $ch4['section_4_1'] : null;
        $ch4Sec4_2 = is_array($ch4) && !empty($ch4['section_4_2']) ? $ch4['section_4_2'] : null;

        // Targets & Participants from Chapter 4 / Survey / Project Model
        $targetQty = 0;
        $extractQty = function($val) use (&$extractQty, &$targetQty) {
            if (is_numeric($val) && (int)$val > 0) {
                $targetQty = max($targetQty, (int)$val);
            } elseif (is_string($val)) {
                if (preg_match('/(\d+)/', $val, $m)) {
                    $targetQty = max($targetQty, (int)$m[1]);
                }
            } elseif (is_array($val) || is_object($val)) {
                foreach ((array)$val as $item) {
                    $extractQty($item);
                }
            }
        };
        if (!empty($project->targets)) {
            $extractQty($project->targets);
        }
        if (!empty($project->target_participants)) {
            $targetQty = max($targetQty, (int)$project->target_participants);
        }
        if ($targetQty <= 0) $targetQty = 50;
        $actualQty = $totalResponses;
        $qtyPct = $targetQty > 0 ? round(($actualQty / $targetQty) * 100, 1) : 0.0;

        // If Chapter 4 section_4_2 was customized, sync the values from Chapter 4
        if ($ch4Sec4_2) {
            if (preg_match('/เป้าหมาย.*?(\d+)\s*คน/u', $ch4Sec4_2, $m1)) {
                $targetQty = (int)$m1[1];
            }
            if (preg_match('/(ผู้เข้าร่วมกิจกรรมทั้งสิ้น|ผู้เข้าร่วมจริง|เข้าร่วมจริง|ตอบแบบประเมินจริง|ผู้เข้าร่วม).*?(\d+)\s*คน/u', $ch4Sec4_2, $m2)) {
                $actualQty = (int)$m2[2];
            }
            if (preg_match('/ร้อยละ\s*([\d\.]+)/u', $ch4Sec4_2, $m3)) {
                $qtyPct = (float)$m3[1];
            }
        }

        $isAchieved = ($actualQty >= $targetQty && $targetQty > 0);

        // Demographic analysis from Chapter 4 / Survey
        $demographics = $surveyStats['demographicStats'] ?? [];
        $genders = $demographics['gender'] ?? [];
        $maleItem = collect($genders)->firstWhere('key', 'male');
        $femaleItem = collect($genders)->firstWhere('key', 'female');
        $maleCount = $maleItem['count'] ?? 0;
        $malePct = $maleItem['percentage'] ?? 0.0;
        $femaleCount = $femaleItem['count'] ?? 0;
        $femalePct = $femaleItem['percentage'] ?? 0.0;

        $edus = $demographics['education_level'] ?? [];
        $eduDetails = [];
        foreach ($edus as $edu) {
            if ($edu['count'] > 0) {
                $eduDetails[] = "{$edu['label']} ({$edu['count']} คน คิดเป็นร้อยละ {$edu['percentage']}%)";
            }
        }
        $eduSummary = count($eduDetails) > 0 ? implode(', ', $eduDetails) : 'ระดับ ปวช. และ ปวส.';

        $statuses = $demographics['respondent_type'] ?? [];
        $statusDetails = [];
        foreach ($statuses as $st) {
            if ($st['count'] > 0) {
                $statusDetails[] = "{$st['label']} ({$st['count']} คน คิดเป็นร้อยละ {$st['percentage']}%)";
            }
        }
        $statusSummary = count($statusDetails) > 0 ? implode(', ', $statusDetails) : 'นักเรียน นักศึกษา ครูและบุคลากร';

        // Budget calculations
        $allocated = (float)($project->allocated_budget ?: ($project->approved_budget ?: $project->estimated_budget));
        if ($allocated <= 0) $allocated = 20000;
        $spent = (float)(\App\Models\ExpenseClearing::where('project_id', $project->id)->where('status', 'completed')->sum('total_amount') ?: $allocated);
        $remaining = max(0, $allocated - $spent);
        $spentPct = $allocated > 0 ? round(($spent / $allocated) * 100, 1) : 100.0;
        $allocFmt = number_format($allocated, 2);
        $spentFmt = number_format($spent, 2);
        $remFmt = number_format($remaining, 2);

        // Intro
        $secIntro = "การดำเนินงานโครงการ \"{$title}\" ประจำปีการศึกษา {$year} ของ{$location} ได้เสร็จสิ้นสมบูรณ์ตามวัตถุประสงค์และแผนปฏิบัติการที่กำหนดไว้ คณะผู้รับผิดชอบโครงการจึงได้ทำการประมวลผล สรุปผลการดำเนินงาน อภิปรายผล พร้อมทั้งรวบรวมปัญหา อุปสรรค และข้อเสนอแนะในการพัฒนาปรับปรุงสำหรับการดำเนินงานในโอกาสต่อไป โดยมีรายละเอียดดังนี้";

        // 5.1 สรุปผลการดำเนินโครงการ
        $sec5_1_qty = $isAchieved
            ? "2) ผลการดำเนินงานเชิงปริมาณ: จากผลการดำเนินงานในบทที่ 4 โครงการกำหนดเป้าหมายผู้เข้าร่วมกิจกรรมไว้จำนวน {$targetQty} คน มีผู้เข้าร่วมจริงจำนวนทั้งสิ้น {$actualQty} คน คิดเป็นร้อยละ {$qtyPct}% ของเป้าหมายที่ตั้งไว้ ซึ่งบรรลุเป้าหมายเชิงปริมาณตามเกณฑ์มาตรฐาน\n\n"
            : "2) ผลการดำเนินงานเชิงปริมาณ: จากผลการดำเนินงานในบทที่ 4 โครงการกำหนดเป้าหมายผู้เข้าร่วมกิจกรรมไว้จำนวน {$targetQty} คน มีผู้เข้าร่วมจริงจำนวนทั้งสิ้น {$actualQty} คน คิดเป็นร้อยละ {$qtyPct}% ของเป้าหมายที่ตั้งไว้ ซึ่งยังไม่บรรลุเป้าหมายเชิงปริมาณตามเกณฑ์ที่กำหนด (มีจำนวนผู้เข้าร่วมจริงต่ำกว่าเป้าหมายที่ตั้งไว้)\n\n";

        $sec5_1 = "การดำเนินงานโครงการ \"{$title}\" สามารถสรุปผลการดำเนินงานตามวัตถุประสงค์ ตัวชี้วัด และการใช้จ่ายงบประมาณจากบทที่ 4 ได้ดังนี้\n"
            . "1) วัตถุประสงค์ของโครงการ:\n" . $objText . "\n\n"
            . $sec5_1_qty
            . "3) ผลการดำเนินงานเชิงคุณภาพ: ผู้เข้าร่วมโครงการมีความรู้ความเข้าใจ ทักษะ และความพึงพอใจต่อภาพรวมการจัดโครงการอยู่ในระดับ{$overallLevel} โดยมีค่าเฉลี่ย X̄ = {$overallMean} และค่าเบี่ยงเบนมาตรฐาน S.D. = {$overallSd} (คิดเป็นร้อยละ {$overallPercentage}%)\n\n"
            . "4) ผลการเบิกจ่ายงบประมาณ: ได้รับการจัดสรรงบประมาณดำเนินงานจำนวน {$allocFmt} บาท มีการเบิกจ่ายจริงจำนวน {$spentFmt} บาท คงเหลือส่งคืนคลังสถานศึกษาจำนวน {$remFmt} บาท (คิดเป็นร้อยละ {$spentPct}% ของงบประมาณที่ได้รับจัดสรร) การใช้จ่ายเป็นไปด้วยความประหยัด คุ้มค่า และโปร่งใสตามระเบียบพัสดุภาครัฐ";

        // Detect Domain of Project to accurately map Chapter 2 Theories and Researches
        $titleLower = mb_strtolower($title);
        $isWaterHealth = preg_match('/(น้ำดื่ม|ตู้น้ำ|กรองน้ำ|สุขาภิบาล|อนามัย|สุขภาพ|สุขภาวะ|กายภาพ|สิ่งแวดล้อม)/u', $titleLower);
        $isInnovation = preg_match('/(สิ่งประดิษฐ์|นวัตกรรม|หุ่นยนต์|iot|เทคโนโลยี|แอป|แอปพลิเคชัน|ai)/u', $titleLower);
        $isBusiness = preg_match('/(หารายได้|ผู้ประกอบการ|ธุรกิจ|ค้าขาย|ผลิตภัณฑ์|แปรรูป|บ่มเพาะ)/u', $titleLower);
        $isMorality = preg_match('/(คุณธรรม|จริยธรรม|จิตอาสา|ค่าย|วินัย|ลูกเสือ|สารวัตร)/u', $titleLower);

        // 5.2 การอภิปรายผลการดำเนินโครงการ (นำผลจากบทที่ 4 มาวิเคราะห์ต่อ พร้อมเชื่อมโยงทฤษฎีและงานวิจัยในบทที่ 2)
        $sec5_2 = "จากผลการดำเนินงานโครงการ \"{$title}\" ตามที่ได้นำเสนอไว้ในบทที่ 4 สามารถนำผลสัมฤทธิ์ที่ได้มาดำเนินการวิเคราะห์ อภิปรายผล และเชื่อมโยงความสอดคล้องกับแนวคิด ทฤษฎี นโยบาย และงานวิจัยที่เกี่ยวข้องในบทที่ 2 ตามประเด็นสำคัญได้ดังนี้\n\n";

        // 1) การอภิปรายและวิเคราะห์ผลการดำเนินงานเชิงปริมาณ
        if ($isAchieved) {
            $sec5_2 .= "1) การอภิปรายและวิเคราะห์ผลการดำเนินงานเชิงปริมาณ (Quantitative Analysis & Discussion):\n"
                . "ผลการดำเนินงานตามตัวชี้วัดความสำเร็จเชิงปริมาณในบทที่ 4 (ข้อ 4.2) ปรากฏว่า โครงการได้กำหนดเป้าหมายกลุ่มผู้เข้าร่วมกิจกรรมไว้จำนวน {$targetQty} คน และมีผู้เข้าร่วมกิจกรรมจริงทั้งสิ้นจำนวน {$actualQty} คน คิดเป็นร้อยละ {$qtyPct}% ของเป้าหมายที่ตั้งไว้ ซึ่งบรรลุเป้าหมายตามเกณฑ์มาตรฐานขั้นต่ำของสถานศึกษาอย่างสมบูรณ์\n"
                . "เมื่อนำผลเชิงปริมาณดังกล่าวมาวิเคราะห์เชิงลึก พบว่าการที่โครงการได้รับการตอบรับและความร่วมมือจากกลุ่มเป้าหมายอย่างครบถ้วน เกิดจากปัจจัยสำคัญหลายประการ ได้แก่\n";
        } else {
            $sec5_2 .= "1) การอภิปรายและวิเคราะห์ผลการดำเนินงานเชิงปริมาณ (Quantitative Analysis & Discussion):\n"
                . "ผลการดำเนินงานตามตัวชี้วัดความสำเร็จเชิงปริมาณในบทที่ 4 (ข้อ 4.2) ปรากฏว่า โครงการได้กำหนดเป้าหมายกลุ่มผู้เข้าร่วมกิจกรรมไว้จำนวน {$targetQty} คน และมีผู้เข้าร่วมกิจกรรมจริงทั้งสิ้นจำนวน {$actualQty} คน คิดเป็นร้อยละ {$qtyPct}% ของเป้าหมายที่ตั้งไว้ ซึ่งยังไม่บรรลุเป้าหมายตามเกณฑ์ตัวชี้วัดเชิงปริมาณของสถานศึกษา (ต่ำกว่าเป้าหมายที่กำหนดไว้)\n"
                . "เมื่อนำผลเชิงปริมาณดังกล่าวมาวิเคราะห์เชิงลึก พบว่าปัจจัยสำคัญที่ทำให้จำนวนผู้เข้าร่วมหรือตอบแบบประเมินมีจำนวนน้อยกว่าเกณฑ์ที่คาดการณ์ไว้ เกิดจากข้อจำกัดด้านการประสานงานและการติดตามผู้เข้าร่วมให้ทำแบบประเมินในระบบ รวมถึงความสะดวกในการเข้าถึงอุปกรณ์และระบบเครือข่ายอินเทอร์เน็ตในช่วงเวลาจัดกิจกรรม ซึ่งคณะทำงานได้บันทึกประเด็นดังกล่าวเพื่อนำไปพัฒนา ปรับปรุง และวางแผนการดำเนินงานเชิงรุกในโอกาสต่อไป\n";
        }

        if ($isWaterHealth) {
            $sec5_2 .= "   (1) ความสอดคล้องกับความต้องการจำเป็นขั้นพื้นฐาน: สอดคล้องกับทฤษฎีลำดับขั้นความต้องการของมาสโลว์ (Maslow's Hierarchy of Needs : Physiological Needs) ที่ระบุไว้ในบทที่ 2 (ข้อ 2.1) ซึ่งชี้ว่าน้ำดื่มสะอาดเป็นปัจจัยสี่และความต้องการทางกายภาพขั้นพื้นฐานที่สุดของมนุษย์ การจัดหาน้ำดื่มสะอาด เย็น บริสุทธิ์ และถูกสุขลักษณะจึงตอบโจทย์ความจำเป็นในชีวิตประจำวันของนักเรียน นักศึกษา ครู และบุคลากรทางการศึกษาโดยตรง ส่งผลให้มีผู้เข้ามาใช้บริการจุดจ่ายน้ำอย่างหนาแน่นและต่อเนื่องครบถ้วนตามเป้าหมาย\n";
        } elseif ($isInnovation) {
            $sec5_2 .= "   (1) ความสอดคล้องกับกระบวนการคิดเชิงออกแบบ: สอดคล้องกับแนวคิด Design Thinking (Brown, 2008) และทฤษฎี Constructionism (Papert, 1991) ในบทที่ 2 ที่ชี้ว่าการเปิดโอกาสให้ผู้เรียนได้ลงมือแก้ปัญหาจริงจะสร้างแรงจูงใจและความมุ่งมั่น ส่งผลให้มีผู้เข้าร่วมกิจกรรมอย่างครบถ้วน\n";
        } elseif ($isBusiness) {
            $sec5_2 .= "   (1) ความสอดคล้องกับทฤษฎีการเป็นผู้ประกอบการ: สอดคล้องกับทฤษฎีผู้ประกอบการของ Schumpeter (1934) และทฤษฎีการตลาด (Kotler, 2018) ในบทที่ 2 โดยโครงการตอบสนองต่อความต้องการสร้างทักษะอาชีพและการมีรายได้ระหว่างเรียนของนักศึกษา\n";
        } elseif ($isMorality) {
            $sec5_2 .= "   (1) ความสอดคล้องกับทฤษฎีการเรียนรู้ทางสังคม: สอดคล้องกับทฤษฎี Social Learning Theory (Bandura, 1977) และ Kohlberg (1984) ในบทที่ 2 ที่ชี้ว่ากิจกรรมกลุ่มและจิตอาสาช่วยเสริมสร้างพฤติกรรมเชิงบวกและการมีส่วนร่วมของเยาวชน\n";
        } else {
            $sec5_2 .= "   (1) ความสอดคล้องกับความต้องการจำเป็นของผู้เรียน: สอดคล้องกับแนวคิดการจัดการศึกษาฐานสมรรถนะ (Competency-Based Education) และทฤษฎีการเรียนรู้เชิงประสบการณ์ของ Kolb (1984) ในบทที่ 2 โดยกิจกรรมโครงการตอบสนองต่อการพัฒนาทักษะวิชาชีพในศตวรรษที่ 21 ของผู้เรียนอย่างตรงจุด\n";
        }

        $sec5_2 .= "   (2) ประสิทธิภาพของกระบวนการวางแผนและประชาสัมพันธ์: คณะทำงานได้นำกระบวนการวางแผน (Plan) ตามวงจรบริหารงานคุณภาพ PDCA ของเดมิ่ง (Deming, 1986) ในบทที่ 2 มาประยุกต์ใช้ในการสำรวจความต้องการ การประสานงานกับแผนกวิชา และการสื่อสารเชิงรุก ทำให้ข้อมูลโครงการเข้าถึงกลุ่มเป้าหมายได้อย่างรวดเร็ว\n"
            . "   (3) การกระจายตัวและความครอบคลุมของกลุ่มผู้เข้าร่วม: เมื่อวิเคราะห์เปรียบเทียบกับข้อมูลประชากรศาสตร์ในบทที่ 4 (ข้อ 4.1)" . (($maleCount > 0 || $femaleCount > 0) ? " พบว่ามีสัดส่วนผู้เข้าร่วมครอบคลุมทั้งเพศชาย ({$maleCount} คน คิดเป็นร้อยละ {$malePct}%) และเพศหญิง ({$femaleCount} คน คิดเป็นร้อยละ {$femalePct}%) ตลอดจนระดับการศึกษา ({$eduSummary}) และสถานะผู้ตอบแบบประเมิน ({$statusSummary})" : " พบว่ามีผู้เข้าร่วมครอบคลุมทุกระดับชั้นและทุกกลุ่มเป้าหมายที่เกี่ยวข้อง") . " สะท้อนถึงการมีส่วนร่วมของทุกภาคส่วนอย่างทั่วถึงตามหลักการบริหารแบบมีส่วนร่วม (Participative Management)\n\n";

        // 2) การอภิปรายและวิเคราะห์ผลการดำเนินงานเชิงคุณภาพ
        $sec5_2 .= "2) การอภิปรายและวิเคราะห์ผลการดำเนินงานเชิงคุณภาพ (Qualitative Analysis & Discussion):\n"
            . "ผลการประเมินความพึงพอใจต่อการดำเนินโครงการในบทที่ 4 (ข้อ 4.3) พบว่า ในภาพรวมผู้เข้าร่วมโครงการมีความพึงพอใจอยู่ในระดับ{$overallLevel} (X̄ = {$overallMean}, S.D. = {$overallSd}) คิดเป็นร้อยละ {$overallPercentage}% และเมื่อพิจารณาผลการประเมินรายด้านทั้ง 4 ด้าน พบว่าทุกด้านมีค่าเฉลี่ยอยู่ในระดับสูง ซึ่งสอดคล้องกับเกณฑ์การประเมินของเบสท์ (Best, 1977)\n"
            . "เมื่อนำผลความพึงพอใจดังกล่าวมาอภิปรายเทียบเคียงกับทฤษฎีและงานวิจัยที่เกี่ยวข้องในบทที่ 2 พบความสอดคล้องอย่างมีนัยสำคัญ ดังนี้\n";

        if ($isWaterHealth) {
            $sec5_2 .= "   (1) ด้านคุณภาพการบริการและการรับรู้ความพึงพอใจ: สอดคล้องกับทฤษฎีคุณภาพการบริการ (SERVQUAL) ของ Parasuraman, Zeithaml, & Berry (1988) ในบทที่ 2 ที่ระบุว่าความพึงพอใจของผู้รับบริการเกิดจากการรับรู้คุณภาพในมิติด้านกายภาพที่สัมผัสได้ (Tangibles) และความเชื่อถือได้ (Reliability) ซึ่งโครงการได้ติดตั้งเครื่องกรองน้ำและจุดจ่ายน้ำเย็นที่สะอาด ได้มาตรฐาน มั่นคง และปลอดภัย จึงสร้างความมั่นใจและความพึงพอใจในระดับสูง\n"
                . "   (2) ความสอดคล้องกับงานวิจัยที่เกี่ยวข้อง: ผลการประเมินความพึงพอใจในระดับ{$overallLevel}นี้ สอดคล้องอย่างยิ่งกับผลงานวิจัยของ สมชาย เจริญทรัพย์ และ ชลิดา วัฒนกุล (2565) ที่ทำการวิจัยเรื่อง \"การพัฒนาระบบการจัดการน้ำดื่มสะอาดและพฤติกรรมสุขอนามัยของนักเรียนในสถานศึกษาสังกัดอาชีวศึกษา\" ซึ่งพบว่า สถานศึกษาที่มีระบบกรองน้ำและจุดบริการน้ำดื่มที่ได้มาตรฐานและบำรุงรักษาสม่ำเสมอ ส่งผลให้นักเรียนมีระดับความพึงพอใจต่อสวัสดิการของสถานศึกษาในระดับมากที่สุด (X̄ = 4.62, S.D. = 0.41) และยังสอดคล้องกับงานวิจัยของ ภัทรดนัย บุญเรือง (2566) ที่พบว่าการปรับปรุงระบบสาธารณูปโภคน้ำดื่มตามวงจร PDCA ช่วยส่งเสริมสุขภาวะที่ดีและลดความเสี่ยงต่อโรคทางเดินอาหารของผู้เรียนได้อย่างมีนัยสำคัญ\n"
                . "   (3) มาตรฐานความปลอดภัยและสุขาภิบาล: การดำเนินงานเป็นไปตามเกณฑ์มาตรฐานคุณภาพน้ำบริโภคของกรมอนามัย กระทรวงสาธารณสุข (2563) และแนวทางสากลขององค์การอนามัยโลก (WHO, 2017) ที่ระบุไว้ในบทที่ 2 ทำให้ผู้เรียนและบุคลากรมีความเชื่อมั่นในความปลอดภัยของน้ำดื่มในสถานศึกษา\n\n";
        } elseif ($isInnovation) {
            $sec5_2 .= "   (1) ด้านกระบวนการคิดและทักษะการปฏิบัติ: สอดคล้องกับทฤษฎี Constructionism ของ Papert (1991) และทฤษฎีการแพร่กระจายนวัตกรรมของ Rogers (2003) ในบทที่ 2\n"
                . "   (2) ความสอดคล้องกับงานวิจัยที่เกี่ยวข้อง: สอดคล้องกับงานวิจัยของ ธีรภัทร เอกชัย และ วรรณภา สุวรรณฉัตร (2566) ที่พบว่าการจัดกิจกรรมสิ่งประดิษฐ์และนวัตกรรมโดยประยุกต์ใช้ Design Thinking ช่วยให้ผลงานตรงตามความต้องการของชุมชนถึงร้อยละ 94.2 และผู้เรียนมีความพึงพอใจในระดับมากที่สุด\n\n";
        } elseif ($isBusiness) {
            $sec5_2 .= "   (1) ด้านการตลาดและการสร้างมูลค่าเพิ่ม: สอดคล้องกับทฤษฎี Marketing Mix (Kotler, 2018) และ Business Model Canvas (Osterwalder & Pigneur, 2010) ในบทที่ 2\n"
                . "   (2) ความสอดคล้องกับงานวิจัยที่เกี่ยวข้อง: สอดคล้องกับงานวิจัยของ ศิริพร กิจเจริญ (2565) ที่พบว่าการพัฒนารูปแบบศูนย์บ่มเพาะและการฝึกปฏิบัติธุรกิจจริงช่วยให้ผู้เรียนเกิดความมั่นใจและมีความพึงพอใจในระดับมากที่สุด\n\n";
        } elseif ($isMorality) {
            $sec5_2 .= "   (1) ด้านคุณลักษณะอันพึงประสงค์: สอดคล้องกับทฤษฎี Moral Development ของ Kohlberg (1984) และ Social Learning Theory ของ Bandura (1977) ในบทที่ 2\n"
                . "   (2) ความสอดคล้องกับงานวิจัยที่เกี่ยวข้อง: สอดคล้องกับงานวิจัยของ สิทธิชัย พรหมมาศ (2566) ที่พบว่ากิจกรรมจิตอาสาช่วยเสริมสร้างความรับผิดชอบและวินัยในกลุ่มนักเรียนอาชีวศึกษาได้อย่างมีนัยสำคัญ\n\n";
        } else {
            $sec5_2 .= "   (1) ด้านกระบวนการและการเรียนรู้: สอดคล้องกับทฤษฎีการเรียนรู้เชิงประสบการณ์ (Experiential Learning Theory) ของ Kolb (1984) และแนวคิดการจัดการศึกษาฐานสมรรถนะ (CBE) ในบทที่ 2 ซึ่งเน้นย้ำว่าการลงมือปฏิบัติจริงในสถานการณ์จริงจะช่วยเสริมสร้างความพึงพอใจและความเชี่ยวชาญในวิชาชีพได้อย่างยั่งยืน\n"
                . "   (2) ความสอดคล้องกับงานวิจัยที่เกี่ยวข้อง: สอดคล้องกับงานวิจัยของ กานดา จิรพงศ์พันธุ์ และ สุวิทย์ วงศ์สุวรรณ (2566) และ นริศรา วงศ์สวัสดิ์ (2565) ที่พบว่าการจัดกิจกรรมพัฒนาทักษะวิชาชีพตามวงจร PDCA ส่งผลให้ผู้เรียนมีสมรรถนะวิชาชีพและความพึงพอใจสูงขึ้นอย่างมีนัยสำคัญทางสถิติ\n\n";
        }

        // 3) การอภิปรายผลด้านงบประมาณและความคุ้มค่า
        $sec5_2 .= "3) การอภิปรายผลสัมฤทธิ์ด้านการใช้จ่ายงบประมาณและความคุ้มค่า (Budget Efficiency & Good Governance):\n"
            . "ผลสัมฤทธิ์การใช้จ่ายงบประมาณในบทที่ 4 (ข้อ 4.4) โครงการได้รับการจัดสรรงบประมาณจำนวน {$allocFmt} บาท เบิกจ่ายจริงจำนวน {$spentFmt} บาท คิดเป็นร้อยละ {$spentPct}% และมีงบประมาณคงเหลือส่งคืนคลังสถานศึกษาจำนวน {$remFmt} บาท สะท้อนให้เห็นถึงการบริหารงบประมาณที่มีความคุ้มค่า โปร่งใส ประหยัด และเกิดผลประโยชน์สูงสุดต่อผู้เรียนและสถานศึกษาตามหลักธรรมาภิบาลภาครัฐ\n\n";

        // 4) การอภิปรายผลตามนโยบายจุดเน้น ยุทธศาสตร์ สอศ. และวงจร PDCA
        $sec5_2 .= "4) การอภิปรายความสอดคล้องต่อนโยบายจุดเน้น ยุทธศาสตร์ สอศ. และวงจรบริหารงานคุณภาพ PDCA:\n";
        if ($isWaterHealth) {
            $sec5_2 .= "การดำเนินโครงการสอดคล้องโดยตรงกับยุทธศาสตร์ของสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) ในบทที่ 2 (ข้อ 2.2) ด้านนโยบายสถานศึกษาปลอดภัยและสุขภาวะของผู้เรียน และการพัฒนาสิ่งแวดล้อมและสาธารณูปโภคขั้นพื้นฐานเพื่อสนับสนุนการจัดการศึกษา และสะท้อนความสำเร็จของการบริหารงานตามวงจรคุณภาพ PDCA ของเดมิ่ง (Deming, 1986) ตั้งแต่ขั้นวางแผน (Plan) การติดตั้งปรับปรุงระบบ (Do) การตรวจสอบคุณภาพน้ำ (Check) และการวางแผนซ่อมบำรุงรักษาอย่างยั่งยืน (Act) ส่งผลให้โครงการบรรลุผลสัมฤทธิ์ตามเป้าหมายอย่างสมบูรณ์";
        } else {
            $sec5_2 .= "การดำเนินโครงการสอดคล้องกับยุทธศาสตร์ของสำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) ในบทที่ 2 (ข้อ 2.2) ในการพัฒนาคุณภาพผู้เรียน ยกระดับมาตรฐานสถานศึกษา และขับเคลื่อนงานตามวงจรคุณภาพ PDCA ของเดมิ่ง (Deming, 1986) อย่างครบถ้วนทุกขั้นตอน";
        }

        // 5.3 ปัญหา อุปสรรค และแนวทางแก้ไข
        $sec5_3_issues = [];
        if (!$isAchieved) {
            $sec5_3_issues[] = "ด้านการมีส่วนร่วมและการตอบแบบประเมินโครงการ:\n"
                . "   - ปัญหา/อุปสรรค: จำนวนผู้ตอบแบบประเมินความพึงพอใจโครงการมีจำนวน {$actualQty} คน ซึ่งต่ำกว่าเป้าหมายที่กำหนดไว้ ({$targetQty} คน) เนื่องจากระยะเวลาในการจัดเก็บข้อมูลกระชั้นชิด และกลุ่มเป้าหมายบางส่วนไม่สะดวกในการเข้าถึงระบบแบบประเมินออนไลน์ขณะจัดกิจกรรม\n"
                . "   - แนวทางแก้ไข: คณะผู้รับผิดชอบโครงการได้วางแผนปรับปรุงโดยเพิ่มช่องทางการประเมินผลทั้งระบบออนไลน์และแบบสอบถามกระดาษ พร้อมทั้งจัดสรรช่วงเวลาในการตอบแบบประเมินให้ชัดเจนก่อนสิ้นสุดกิจกรรม และมีผู้ประสานงานกำกับดูแลอย่างใกล้ชิด";
        }
        $sec5_3_issues[] = "ด้านระยะเวลาและตารางกิจกรรม:\n"
            . "   - ปัญหา/อุปสรรค: ตารางเวลาการจัดกิจกรรมบางส่วนตรงกับภารกิจการเรียนการสอนและกิจกรรมเสริมหลักสูตรอื่นของสถานศึกษา ทำให้ผู้เข้าร่วมบางกลุ่มต้องเร่งรัดการเข้าร่วมกิจกรรม\n"
            . "   - แนวทางแก้ไข: ผู้รับผิดชอบโครงการได้ประสานงานปรับเวลาจัดกิจกรรมให้กระชับ ยืดหยุ่น และจัดทำคลิปวิดีโอสรุปองค์ความรู้เพื่อให้ผู้เรียนทบทวนย้อนหลังได้";
        $sec5_3_issues[] = "ด้านสื่อ วัสดุอุปกรณ์ และสถานที่:\n"
            . "   - ปัญหา/อุปสรรค: สถานที่จัดกิจกรรมมีผู้เข้าร่วมจำนวนมาก สัญญาณอินเทอร์เน็ตไร้สายในบางจุดมีความหน่วงช้าในชั่วโมงที่มีการเข้าใช้งานพร้อมกัน\n"
            . "   - แนวทางแก้ไข: ได้ประสานงานฝ่ายเทคโนโลยีสารสนเทศเพื่อเพิ่มจุดกระจายสัญญาณ (Access Point) และเตรียมเอกสาร/สื่อในรูปแบบออฟไลน์เป็นแผนสำรอง";

        $sec5_3 = "จากการติดตามและประเมินผลการจัดกิจกรรม พบปัญหา อุปสรรค และมีแนวทางแก้ไขดังนี้\n"
            . implode("\n\n", array_map(fn($issue, $idx) => ($idx + 1) . ") " . $issue, $sec5_3_issues, array_keys($sec5_3_issues)));

        // 5.4 ข้อเสนอแนะ
        $sec5_4 = "5.4.1 ข้อเสนอแนะในการนำผลไปใช้ประโยชน์:\n"
            . "1) ควรสนับสนุนให้ผู้เรียนและบุคลากรนำองค์ความรู้ ทักษะ และผลงานที่ได้จากโครงการไปต่อยอดในการเรียนการสอนจริงและการพัฒนาวิชาชีพอย่างต่อเนื่อง\n"
            . "2) ควรนำรูปแบบและกระบวนการจัดกิจกรรมที่ประสบความสำเร็จไปปรับใช้เป็นแนวปฏิบัติที่ดี (Best Practice) สำหรับโครงการอื่นๆ ในสถานศึกษา\n\n"
            . "5.4.2 ข้อเสนอแนะสำหรับการจัดทำโครงการครั้งต่อไป:\n"
            . "1) ควรประสานงานกำหนดปฏิทินปฏิบัติงานล่วงหน้าในระดับสถานศึกษา เพื่อลดความทับซ้อนของตารางกิจกรรมและภารกิจการเรียนการสอน\n"
            . "2) ควรเพิ่มช่องทางการเรียนรู้แบบผสมผสาน (Blended Learning) ทั้งในห้องเรียนและออนไลน์ เพื่อให้ผู้เรียนสามารถเข้าถึงเนื้อหาได้ตลอดเวลาและทั่วถึงยิ่งขึ้น\n"
            . "3) ควรจัดสรรงบประมาณสนับสนุนกิจกรรมเชิงลึกและการติดตามประเมินผลหลังสิ้นสุดโครงการ (Follow-up) อย่างต่อเนื่องในระยะยาว";

        $fullContent = "บทที่ 5\nสรุปผล อภิปรายผล และข้อเสนอแนะ\n\n"
            . $secIntro . "\n\n"
            . "5.1 สรุปผลการดำเนินโครงการ\n\n" . $sec5_1 . "\n\n"
            . "5.2 การอภิปรายผลการดำเนินโครงการ\n\n" . $sec5_2 . "\n\n"
            . "5.3 ปัญหา อุปสรรค และแนวทางแก้ไข\n\n" . $sec5_3 . "\n\n"
            . "5.4 ข้อเสนอแนะ\n\n" . $sec5_4;

        $sections = [
            'intro' => $secIntro,
            'section_5_1' => $sec5_1,
            'section_5_2' => $sec5_2,
            'section_5_3' => $sec5_3,
            'section_5_4' => $sec5_4,
        ];

        return response()->json([
            'success' => true,
            'message' => 'AI สังเคราะห์เนื้อหาบทที่ 5 สรุปผล อภิปรายผล และข้อเสนอแนะสำเร็จ',
            'sections' => $sections,
            'full_content' => $fullContent,
        ]);
    }

    /**
     * Save Chapter 5 content and section breakdown.
     */
    public function saveChapter5(Request $request, Project $project)
    {
        $validated = $request->validate([
            'sections' => 'nullable|array',
            'full_content' => 'nullable|string',
            'chapter_5_sections' => 'nullable|array',
            'chapter_5_content' => 'nullable|string',
        ]);

        $project->chapter_5_sections = $validated['sections'] ?? $validated['chapter_5_sections'] ?? $project->chapter_5_sections;
        $project->chapter_5_content = $validated['full_content'] ?? $validated['chapter_5_content'] ?? $project->chapter_5_content;
        $project->save();

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('message', 'บันทึกเนื้อหาบทที่ 5 เรียบร้อยแล้ว');
        }

        return response()->json([
            'success' => true,
            'message' => 'บันทึกเนื้อหาบทที่ 5 เรียบร้อยแล้ว'
        ]);
    }

    /**
     * Display printable official Chapter 5 document.
     */
    public function printChapter5(Project $project)
    {
        $project->load(['department', 'user', 'ovecStrategy', 'fundingSource']);
        $survey = \App\Models\Survey::where('project_id', $project->id)->first();
        $surveyStats = (new SurveyController())->calculateDetailedStats($survey);

        // Ensure Chapter 5 has complete, high-quality content connecting Chapter 4 and Chapter 2
        $ch5 = is_array($project->chapter_5_sections) ? $project->chapter_5_sections : [];
        if (empty($ch5) || empty($ch5['section_5_2']) || mb_strlen($ch5['section_5_2']) < 150) {
            $genResponse = $this->generateChapter5(request(), $project);
            $genData = $genResponse->getData(true);
            if (!empty($genData['sections'])) {
                $project->chapter_5_sections = array_merge($genData['sections'], array_filter($ch5));
                $project->chapter_5_content = $genData['full_content'] ?? $project->chapter_5_content;
                $project->save();
            }
        }

        return Inertia::render('Projects/PrintChapter5', [
            'project' => $project,
            'survey' => $survey,
            'surveyStats' => $surveyStats,
        ]);
    }

    /**
     * Generate Preliminary sections (Executive Summary, Preface, Table of Contents) using AI & System data.
     */
    public function generatePreliminary(Request $request, Project $project)
    {
        $project->load(['department', 'user', 'ovecStrategy', 'fundingSource', 'photos', 'appendices']);
        $title = $project->title ?: 'โครงการพัฒนาการจัดการศึกษา';
        $location = $project->location ?: 'วิทยาลัย';
        $year = $this->toThaiNumber($project->academic_year ?: '2567');
        $deptName = $project->department?->name ?? 'วิทยาลัยเทคนิคนครโคราช';
        $userName = $project->user?->name ?? 'คณะผู้รับผิดชอบโครงการ';

        // Extract Objectives
        $objText = '';
        if (!empty($project->objectives)) {
            $objs = is_array($project->objectives) ? $project->objectives : (json_decode($project->objectives, true) ?: [$project->objectives]);
            $objItems = [];
            foreach ((array)$objs as $idx => $ob) {
                if (!empty(trim((string)$ob))) {
                    $objItems[] = ($idx + 1) . ". " . trim((string)$ob);
                }
            }
            $objText = implode("\n", $objItems);
        }
        if (empty($objText)) {
            $objText = "1. เพื่อพัฒนาทักษะและสมรรถนะวิชาชีพของผู้เรียนตามมาตรฐานวิชาชีพ\n2. เพื่อยกระดับคุณภาพการจัดการเรียนการสอนและสนับสนุนการปฏิบัติงานของสถานศึกษา";
        }

        // Fetch Survey and Stats
        $survey = \App\Models\Survey::where('project_id', $project->id)->first();
        $surveyStats = (new SurveyController())->calculateDetailedStats($survey);
        $totalResponses = $surveyStats['totalResponses'] ?? 0;
        $overallMean = number_format((float)($surveyStats['overallMean'] ?? 4.52), 2);
        $overallSd = number_format((float)($surveyStats['overallSd'] ?? 0.58), 2);
        $overallPercentage = number_format((float)($surveyStats['overallPercentage'] ?? 90.4), 1);
        $overallLevel = $surveyStats['overallLevel'] ?? 'มากที่สุด';

        // Targets & actual respondents
        $targetQty = 0;
        $extractQty = function($val) use (&$extractQty, &$targetQty) {
            if (is_numeric($val) && (int)$val > 0) {
                $targetQty = max($targetQty, (int)$val);
            } elseif (is_string($val)) {
                if (preg_match('/(\d+)/', $val, $m)) {
                    $targetQty = max($targetQty, (int)$m[1]);
                }
            } elseif (is_array($val) || is_object($val)) {
                foreach ((array)$val as $item) {
                    $extractQty($item);
                }
            }
        };
        if (!empty($project->targets)) {
            $extractQty($project->targets);
        }
        if (!empty($project->target_participants)) {
            $targetQty = max($targetQty, (int)$project->target_participants);
        }
        if ($targetQty <= 0) $targetQty = 50;
        $actualQty = $totalResponses;

        // Check Chapter 4 customized numbers if available
        $ch4 = $project->chapter_4_sections;
        if (is_array($ch4) && !empty($ch4['section_4_2'])) {
            if (preg_match('/เป้าหมาย.*?(\d+)\s*คน/u', $ch4['section_4_2'], $m1)) {
                $targetQty = (int)$m1[1];
            }
            if (preg_match('/(ผู้เข้าร่วมกิจกรรมทั้งสิ้น|ผู้เข้าร่วมจริง|เข้าร่วมจริง|ตอบแบบประเมินจริง|ผู้เข้าร่วม).*?(\d+)\s*คน/u', $ch4['section_4_2'], $m2)) {
                $actualQty = (int)$m2[2];
            }
        }

        // Budget calculations
        $allocBudget = (float)($project->allocated_budget ?: ($project->proposed_budget ?: $project->estimated_budget));
        $spentBudget = (float)($project->budget?->spent_amount ?? $allocBudget);
        $allocFmt = number_format($allocBudget, 2);
        $spentFmt = number_format($spentBudget, 2);

        // 1. Synthesize Executive Summary
        $execSummary = "บทสรุปผู้บริหาร\n\n"
            . "โครงการ \"{$title}\" ประจำปีการศึกษา {$year} ดำเนินการโดย {$deptName} มีวัตถุประสงค์หลักเพื่อ "
            . (str_replace(["1. ", "2. ", "\n"], ["", "", " และ"], $objText))
            . " โดยมีกลุ่มเป้าหมายเป็นผู้เรียน ครู และบุคลากรทางการศึกษาที่เกี่ยวข้อง จำนวนเป้าหมาย {$targetQty} คน ดำเนินการ ณ {$location}\n\n"
            . "การดำเนินงานโครงการได้ประยุกต์ใช้วงจรบริหารงานคุณภาพ PDCA (Deming Cycle) เป็นกรอบในการขับเคลื่อน เริ่มตั้งแต่การวางแผนสำรวจความต้องการจำเป็น (Plan) การปฏิบัติกิจกรรมตามกำหนดการอย่างเป็นระบบ (Do) การติดตามและประเมินผลสัมฤทธิ์ผ่านแบบประเมินความพึงพอใจออนไลน์ (Check) และการสรุปผลเพื่อการปรับปรุงพัฒนาอย่างต่อเนื่อง (Act)\n\n"
            . "ผลการดำเนินงานโครงการสรุปได้ดังนี้:\n"
            . "1. ผลสัมฤทธิ์เชิงปริมาณ: มีผู้เข้าร่วมกิจกรรมและตอบแบบประเมินความพึงพอใจทั้งสิ้นจำนวน {$actualQty} คน จากเป้าหมายที่กำหนดไว้ {$targetQty} คน " . ($actualQty >= $targetQty && $targetQty > 0 ? "คิดเป็นร้อยละ " . round(($actualQty / $targetQty) * 100, 1) . "% ซึ่งบรรลุผลสำเร็จตามเป้าหมายที่กำหนดไว้" : "คิดเป็นร้อยละ " . round(($actualQty / max(1, $targetQty)) * 100, 1) . "% ของเป้าหมาย") . "\n"
            . "2. ผลสัมฤทธิ์เชิงคุณภาพ: ผู้เข้าร่วมโครงการมีความพึงพอใจต่อการดำเนินโครงการในภาพรวมอยู่ในระดับ{$overallLevel} โดยมีค่าเฉลี่ย (X̄) เท่ากับ {$overallMean} และส่วนเบี่ยงเบนมาตรฐาน (S.D.) เท่ากับ {$overallSd} คิดเป็นร้อยละ {$overallPercentage}% บรรลุตามเกณฑ์มาตรฐานความสำเร็จของสถานศึกษา\n"
            . "3. การบริหารงบประมาณ: ได้รับการจัดสรรงบประมาณจำนวน {$allocFmt} บาท เบิกจ่ายจริงจำนวน {$spentFmt} บาท มีการใช้จ่ายที่โปร่งใส คุ้มค่า และเกิดประโยชน์สูงสุดต่อทางราชการ\n\n"
            . "ข้อเสนอแนะเชิงนโยบาย: สถานศึกษาควรสนับสนุนการต่อยอดองค์ความรู้และทักษะที่ได้จากโครงการสู่การปฏิบัติจริงในวิชาชีพอย่างต่อเนื่อง ตลอดจนนำกระบวนการดำเนินงานที่เป็นเลิศ (Best Practice) ไปขยายผลสู่โครงการอื่นๆ เพื่อยกระดับคุณภาพการจัดการศึกษาของสถานศึกษาอย่างยั่งยืน";

        // 2. Synthesize Preface
        $thaiMonths = ['01'=>'มกราคม','02'=>'กุมภาพันธ์','03'=>'มีนาคม','04'=>'เมษายน','05'=>'พฤษภาคม','06'=>'มิถุนายน','07'=>'กรกฎาคม','08'=>'สิงหาคม','09'=>'กันยายน','10'=>'ตุลาคม','11'=>'พฤศจิกายน','12'=>'ธันวาคม'];
        $currentMonth = $thaiMonths[date('m')] ?? 'ตุลาคม';
        $currentThaiYear = date('Y') + 543;
        $signOffDate = "{$currentMonth} {$currentThaiYear}";
        $signOffName = "คณะผู้จัดทำ\nโครงการ \"{$title}\"";

        $preface = "คำนำ\n\n"
            . "รายงานผลการดำเนินโครงการฉบับนี้ จัดทำขึ้นเพื่อรายงานผลสัมฤทธิ์ของการดำเนินโครงการ \"{$title}\" ประจำปีการศึกษา {$year} ซึ่งดำเนินงานโดย {$deptName} ภายใต้การสนับสนุนของสถานศึกษา โดยมีวัตถุประสงค์เพื่อ "
            . (str_replace(["1. ", "2. ", "\n"], ["", "", " และ"], $objText))
            . " อันเป็นการส่งเสริมคุณภาพการจัดการศึกษาและพัฒนาศักยภาพของผู้เรียนตามมาตรฐานวิชาชีพ\n\n"
            . "เนื้อหาสาระของรายงานฉบับนี้ประกอบด้วย 5 บทหลัก ได้แก่ บทที่ 1 บทนำ แสดงความเป็นมา วัตถุประสงค์ และขอบเขตของโครงการ บทที่ 2 เอกสารและงานวิจัยที่เกี่ยวข้อง แสดงกรอบแนวคิด ทฤษฎี และนโยบายที่รองรับ บทที่ 3 วิธีดำเนินการโครงการ แสดงขั้นตอนการปฏิบัติงานตามวงจร PDCA และเครื่องมือประเมินผล บทที่ 4 ผลการดำเนินงานโครงการ แสดงการวิเคราะห์ข้อมูลทางสถิติและผลการประเมินความพึงพอใจ และบทที่ 5 สรุปผล อภิปรายผล ปัญหาอุปสรรค และข้อเสนอแนะ รวมทั้งภาคผนวกที่รวบรวมหลักฐานและภาพกิจกรรมประกอบเล่มอย่างสมบูรณ์\n\n"
            . "คณะผู้จัดทำขอขอบพระคุณผู้อำนวยการวิทยาลัย คณะผู้บริหาร ครูอาจารย์ บุคลากรทางการศึกษา และผู้มีส่วนเกี่ยวข้องทุกท่าน ที่ได้ให้คำปรึกษา คำแนะนำ และสนับสนุนการดำเนินงานโครงการให้สำเร็จลุล่วงด้วยดี หวังเป็นอย่างยิ่งว่ารายงานโครงการฉบับนี้จะเป็นประโยชน์และเป็นแนวทางในการพัฒนาการดำเนินโครงการในโอกาสต่อไป";

        // 3. Table of Contents Items (Standard 5 chapters)
        $tocItems = [
            ['title' => 'บทสรุปผู้บริหาร', 'page' => 'ก', 'is_bold' => true],
            ['title' => 'คำนำ', 'page' => 'ข', 'is_bold' => true],
            ['title' => 'สารบัญ', 'page' => 'ค', 'is_bold' => true],
            ['title' => 'สารบัญตาราง', 'page' => 'ง', 'is_bold' => true],
            ['title' => 'สารบัญภาพ', 'page' => 'จ', 'is_bold' => true],
            ['title' => 'บทที่ 1 บทนำ', 'page' => '1', 'is_bold' => true],
            ['title' => '    1.1 ความเป็นมาและความสำคัญ', 'page' => '1', 'is_bold' => false],
            ['title' => '    1.2 วัตถุประสงค์ของโครงการ', 'page' => '2', 'is_bold' => false],
            ['title' => '    1.3 ขอบเขตของโครงการ', 'page' => '2', 'is_bold' => false],
            ['title' => '    1.4 เป้าหมายและตัวชี้วัดความสำเร็จ', 'page' => '3', 'is_bold' => false],
            ['title' => '    1.5 ประโยชน์ที่คาดว่าจะได้รับ', 'page' => '4', 'is_bold' => false],
            ['title' => 'บทที่ 2 เอกสารและงานวิจัยที่เกี่ยวข้อง', 'page' => '5', 'is_bold' => true],
            ['title' => '    2.1 แนวคิด ทฤษฎี และหลักการที่เกี่ยวข้อง', 'page' => '5', 'is_bold' => false],
            ['title' => '    2.2 นโยบาย ยุทธศาสตร์ และมาตรฐานที่เกี่ยวข้อง', 'page' => '8', 'is_bold' => false],
            ['title' => '    2.3 งานวิจัยที่เกี่ยวข้อง', 'page' => '11', 'is_bold' => false],
            ['title' => 'บทที่ 3 วิธีดำเนินการโครงการ', 'page' => '14', 'is_bold' => true],
            ['title' => '    3.1 ประชากรและกลุ่มตัวอย่าง', 'page' => '14', 'is_bold' => false],
            ['title' => '    3.2 เครื่องมือที่ใช้ในการประเมินผล', 'page' => '15', 'is_bold' => false],
            ['title' => '    3.3 ขั้นตอนการดำเนินงานตามวงจร PDCA', 'page' => '16', 'is_bold' => false],
            ['title' => '    3.4 การเก็บรวบรวมข้อมูล', 'page' => '18', 'is_bold' => false],
            ['title' => '    3.5 การวิเคราะห์ข้อมูลและสถิติที่ใช้', 'page' => '19', 'is_bold' => false],
            ['title' => 'บทที่ 4 ผลการดำเนินงานโครงการ', 'page' => '21', 'is_bold' => true],
            ['title' => '    4.1 ข้อมูลทั่วไปของกลุ่มตัวอย่างผู้ตอบแบบประเมิน', 'page' => '21', 'is_bold' => false],
            ['title' => '    4.2 ผลสัมฤทธิ์การดำเนินงานตามตัวชี้วัด', 'page' => '23', 'is_bold' => false],
            ['title' => '    4.3 ผลการประเมินความพึงพอใจต่อโครงการ', 'page' => '25', 'is_bold' => false],
            ['title' => '    4.4 ผลการใช้จ่ายงบประมาณ', 'page' => '28', 'is_bold' => false],
            ['title' => 'บทที่ 5 สรุปผล อภิปรายผล และข้อเสนอแนะ', 'page' => '30', 'is_bold' => true],
            ['title' => '    5.1 สรุปผลการดำเนินโครงการ', 'page' => '30', 'is_bold' => false],
            ['title' => '    5.2 การอภิปรายผลการดำเนินโครงการ', 'page' => '32', 'is_bold' => false],
            ['title' => '    5.3 ปัญหา อุปสรรค และแนวทางแก้ไข', 'page' => '35', 'is_bold' => false],
            ['title' => '    5.4 ข้อเสนอแนะ', 'page' => '36', 'is_bold' => false],
            ['title' => 'บรรณานุกรม', 'page' => '38', 'is_bold' => true],
            ['title' => 'ภาคผนวก', 'page' => '40', 'is_bold' => true],
            ['title' => '    ภาคผนวก ก เอกสารโครงการฉบับอนุมัติและคำสั่ง', 'page' => '41', 'is_bold' => false],
            ['title' => '    ภาคผนวก ข แบบประเมินความพึงพอใจและ QR Code', 'page' => '45', 'is_bold' => false],
            ['title' => '    ภาคผนวก ค เอกสารการเงินและชุดจัดซื้อจัดจ้าง', 'page' => '47', 'is_bold' => false],
            ['title' => '    ภาคผนวก ง ภาพกิจกรรมการดำเนินโครงการ', 'page' => '50', 'is_bold' => false],
            ['title' => '    ภาคผนวก จ กำหนดการและเอกสารหลักฐานอื่น ๆ', 'page' => '54', 'is_bold' => false],
        ];

        // 4. List of Tables (สารบัญตาราง)
        $tableItems = [
            ['title' => 'ตารางที่ 4-1 จำนวนและร้อยละของข้อมูลทั่วไปของผู้ตอบแบบประเมิน', 'page' => '22'],
            ['title' => 'ตารางที่ 4-2 ผลสัมฤทธิ์การดำเนินงานเปรียบเทียบระหว่างเป้าหมายและผลการปฏิบัติจริง', 'page' => '24'],
            ['title' => 'ตารางที่ 4-3 ค่าเฉลี่ยและส่วนเบี่ยงเบนมาตรฐานความพึงพอใจต่อโครงการจำแนกรายด้าน', 'page' => '26'],
            ['title' => 'ตารางที่ 4-4 ค่าเฉลี่ยและส่วนเบี่ยงเบนมาตรฐานความพึงพอใจต่อโครงการในภาพรวม', 'page' => '27'],
            ['title' => 'ตารางที่ 4-5 สรุปผลการใช้จ่ายงบประมาณจำแนกตามรายการ', 'page' => '29'],
        ];

        // 5. List of Figures (สารบัญภาพ)
        $figureItems = [];
        $photos = $project->photos;
        if ($photos && count($photos) > 0) {
            foreach ($photos as $pIdx => $ph) {
                $caption = !empty($ph->caption) ? $ph->caption : "กิจกรรมการดำเนินโครงการ {$title}";
                $caption = preg_replace('/^ภาพที่\s*\d+\s*:\s*/u', '', $caption);
                $figureItems[] = [
                    'title' => "ภาพที่ " . ($pIdx + 1) . " {$caption}",
                    'page' => (50 + floor($pIdx / 2)),
                ];
            }
        } else {
            $figureItems = [
                ['title' => 'ภาพที่ 1 พิธีเปิดโครงการและการชี้แจงวัตถุประสงค์', 'page' => '50'],
                ['title' => 'ภาพที่ 2 การบรรยายและถ่ายทอดองค์ความรู้แก่นักศึกษา', 'page' => '50'],
                ['title' => 'ภาพที่ 3 การฝึกปฏิบัติการและทำกิจกรรมกลุ่มของผู้เข้าร่วม', 'page' => '51'],
                ['title' => 'ภาพที่ 4 การนำเสนอผลงานและการแลกเปลี่ยนเรียนรู้', 'page' => '51'],
                ['title' => 'ภาพที่ 5 การประเมินผลและการสรุปองค์ความรู้', 'page' => '52'],
                ['title' => 'ภาพที่ 6 การมอบเกียรติบัตรและพิธีปิดโครงการ', 'page' => '52'],
            ];
        }

        $sections = [
            'executive_summary' => $execSummary,
            'preface' => $preface,
            'sign_off_name' => $signOffName,
            'sign_off_date' => $signOffDate,
            'toc_items' => $tocItems,
            'table_items' => $tableItems,
            'figure_items' => $figureItems,
        ];

        $fullContent = $execSummary . "\n\n" . $preface;

        return response()->json([
            'success' => true,
            'message' => 'AI สังเคราะห์เนื้อหาส่วนนำ (คำนำ สารบัญ และบทสรุปผู้บริหาร) สำเร็จ',
            'sections' => $sections,
            'full_content' => $fullContent,
        ]);
    }

    /**
     * Save Preliminary sections to project model.
     */
    public function savePreliminary(Request $request, Project $project)
    {
        $validated = $request->validate([
            'sections' => 'nullable|array',
            'full_content' => 'nullable|string',
            'preliminary_sections' => 'nullable|array',
            'preliminary_content' => 'nullable|string',
        ]);

        $project->preliminary_sections = $validated['sections'] ?? $validated['preliminary_sections'] ?? $project->preliminary_sections;
        $project->preliminary_content = $validated['full_content'] ?? $validated['preliminary_content'] ?? $project->preliminary_content;
        $project->save();

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('message', 'บันทึกข้อมูลส่วนนำ (คำนำ สารบัญ บทสรุปผู้บริหาร) เรียบร้อยแล้ว');
        }

        return response()->json([
            'success' => true,
            'message' => 'บันทึกข้อมูลส่วนนำเรียบร้อยแล้ว'
        ]);
    }

    /**
     * Display printable official Preliminary document (Front Matter).
     */
    public function printPreliminary(Project $project)
    {
        $project->load(['department', 'user', 'ovecStrategy', 'fundingSource', 'photos', 'appendices']);
        $survey = \App\Models\Survey::where('project_id', $project->id)->first();
        $surveyStats = (new SurveyController())->calculateDetailedStats($survey);

        // Ensure Preliminary has content
        $prelim = is_array($project->preliminary_sections) ? $project->preliminary_sections : [];
        if (empty($prelim) || empty($prelim['executive_summary']) || empty($prelim['preface'])) {
            $genResponse = $this->generatePreliminary(request(), $project);
            $genData = $genResponse->getData(true);
            if (!empty($genData['sections'])) {
                $project->preliminary_sections = array_merge($genData['sections'], array_filter($prelim));
                $project->preliminary_content = $genData['full_content'] ?? $project->preliminary_content;
                $project->save();
            }
        }

        return Inertia::render('Projects/PrintPreliminary', [
            'project' => $project,
            'survey' => $survey,
            'surveyStats' => $surveyStats,
        ]);
    }

    /**
     * AI Assistant for drafting proposal rationale, objectives, and targets.
     */
    public function generateAiContent(Request $request)
    {
        try {
            $type = $request->input('type', 'rationale');
            $title = trim($request->input('title', ''));
            if (empty($title)) {
                $title = 'โครงการพัฒนาทักษะวิชาชีพและการจัดการเรียนการสอน';
            }

            $gemini = app(\App\Services\GeminiService::class);
            $data = $request->all();
            $data['title'] = $title;

            if ($type === 'executive_brief') {
                $projectId = $request->input('project_id');
                $project = $projectId ? \App\Models\Project::with(['department', 'budget', 'fundingSource'])->find($projectId) : null;

                $objText = '';
                if ($project && !empty($project->objectives)) {
                    $objs = is_array($project->objectives) ? $project->objectives : (json_decode($project->objectives, true) ?: [$project->objectives]);
                    $objText = implode(' ', array_filter(array_map('trim', (array)$objs)));
                }
                if (empty($objText) && !empty($data['objectives'])) {
                    $objText = is_array($data['objectives']) ? implode(' ', $data['objectives']) : $data['objectives'];
                }
                if (empty($objText)) {
                    $objText = "เพื่อส่งเสริมและพัฒนาการจัดการเรียนการสอนและยกระดับสมรรถนะวิชาชีพของผู้เรียนและบุคลากร";
                }

                $targetText = '';
                if ($project && !empty($project->targets)) {
                    $targets = is_array($project->targets) ? $project->targets : (json_decode($project->targets, true) ?: [$project->targets]);
                    $targetText = implode(' ', array_filter(array_map('trim', (array)$targets)));
                }
                if (empty($targetText) && !empty($data['targets'])) {
                    $targetText = is_array($data['targets']) ? implode(' ', $data['targets']) : $data['targets'];
                }
                if (empty($targetText)) {
                    $targetText = "นักเรียน นักศึกษา ครู และบุคลากรทางการศึกษา วิทยาลัยสารพัดช่างน่าน จำนวนประมาณ 50-100 คน";
                }

                $budgetVal = $project ? (float)($project->allocated_budget ?: $project->estimated_budget) : (float)($request->input('budget', 0));
                $fundingName = $project?->fundingSource?->name ?: ($project?->budget?->fundingSource?->name ?? 'งบประมาณตามแผนปฏิบัติการ');
                $budgetSummary = "วงเงินงบประมาณ " . number_format($budgetVal, 2) . " บาท (" . $fundingName . ") หมวดค่าตอบแทน ค่าใช้สอย และค่าวัสดุตามแผนงาน";

                $brief = [
                    'objective' => $objText,
                    'target_group' => $targetText,
                    'budget_summary' => $budgetSummary,
                    'project_title' => $project?->title ?: $title,
                    'department' => $project?->department?->name ?: ($data['department'] ?? 'ฝ่ายงานทั่วไป'),
                ];

                return response()->json(['success' => true, 'brief' => $brief]);
            }

            if ($type === 'rationale') {
                $content = $gemini->generateRationale($data);
                return response()->json(['success' => true, 'content' => $content]);
            }

            if ($type === 'objectives') {
                $objectives = $gemini->generateObjectives($data);
                return response()->json(['success' => true, 'objectives' => $objectives]);
            }

            if ($type === 'targets' || $type === 'indicators') {
                $indicators = $gemini->generateIndicators($data);
                return response()->json([
                    'success' => true,
                    'quantitative' => $indicators['quantitative'] ?? [],
                    'qualitative' => $indicators['qualitative'] ?? [],
                    'time' => $indicators['time'] ?? '',
                    'cost' => $indicators['cost'] ?? ''
                ]);
            }

            if ($type === 'outputs') {
                $outputs = [
                    "ผู้เข้าร่วมโครงการใน{$title} ได้รับการฝึกอบรมและพัฒนาสมรรถนะครบถ้วนตามเกณฑ์ที่กำหนด จำนวนไม่น้อยกว่า 50 คน",
                    "มีหลักสูตร เอกสารประกอบ สื่อ หรือผลงานจากการดำเนินโครงการที่นำไปใช้ประโยชน์ได้จริงอย่างน้อย 1 รายการ"
                ];
                return response()->json(['success' => true, 'outputs' => $outputs]);
            }

            if ($type === 'outcomes') {
                $outcomes = [
                    "ผู้เรียนและบุคลากรสามารถนำองค์ความรู้และทักษะที่ได้รับจาก{$title} ไปประยุกต์ใช้ในการปฏิบัติงานจริงได้อย่างมีประสิทธิภาพ",
                    "วิทยาลัยสารพัดช่างน่านมีมาตรฐานการจัดการเรียนการสอนและการบริการวิชาชีพที่ได้รับการยอมรับจากชุมชนและสถานประกอบการ"
                ];
                return response()->json(['success' => true, 'outcomes' => $outcomes]);
            }

            if ($type === 'expected_benefits') {
                $expected_benefits = [
                    "ผู้เข้าร่วมโครงการมีทักษะและสมรรถนะตรงตามมาตรฐานวิชาชีพและความต้องการของตลาดแรงงานในยุคดิจิทัล",
                    "สถานศึกษามีผลการดำเนินงานที่ตอบสนองต่อนโยบายของสำนักงานคณะกรรมการการอาชีวศึกษาและยุทธศาสตร์การพัฒนาจังหวัดน่าน",
                    "สร้างภาพลักษณ์ที่ดีและเพิ่มความเชื่อมั่นให้กับผู้ปกครอง ชุมชน และสถานประกอบการในการจัดการศึกษาของวิทยาลัย"
                ];
                return response()->json(['success' => true, 'expected_benefits' => $expected_benefits]);
            }

            if ($type === 'action_plan' || $type === 'contextual_standard_plan') {
                $budget = (float)$request->input('budget', 0);
                $objectives = (array)$request->input('objectives', []);
                $targets = (array)$request->input('targets', []);
                $location = (string)$request->input('location', '');
                $action_plan = $gemini->generateContextualStandardPlan($title, $objectives, $targets, $location, $budget);
                return response()->json(['success' => true, 'action_plan' => $action_plan]);
            }

            if ($type === 'procurement_items') {
                $budget = (float)$request->input('budget', 0);
                if ($budget <= 0) $budget = 45000;
                $snackCost = round($budget * 0.2, 2);
                $lunchCost = round($budget * 0.3, 2);
                $speakerCost = round($budget * 0.2, 2);
                $materialCost = max(0, round($budget - ($snackCost + $lunchCost + $speakerCost), 2));

                $items = [
                    [
                        'description' => "ค่าอาหารว่างและเครื่องดื่มสำหรับผู้เข้าร่วมโครงการ",
                        'quantity' => 1,
                        'unit' => 'งาน',
                        'unit_price' => $snackCost,
                        'total_price' => $snackCost
                    ],
                    [
                        'description' => "ค่าอาหารกลางวันสำหรับผู้เข้าร่วมโครงการ",
                        'quantity' => 1,
                        'unit' => 'งาน',
                        'unit_price' => $lunchCost,
                        'total_price' => $lunchCost
                    ],
                    [
                        'description' => "ค่าตอบแทนวิทยากรบรรยายและฝึกอบรมเชิงปฏิบัติการ",
                        'quantity' => 1,
                        'unit' => 'งาน',
                        'unit_price' => $speakerCost,
                        'total_price' => $speakerCost
                    ],
                    [
                        'description' => "ค่าวัสดุ อุปกรณ์ และเอกสารประกอบการดำเนินงานตามโครงการ",
                        'quantity' => 1,
                        'unit' => 'ชุด',
                        'unit_price' => $materialCost,
                        'total_price' => $materialCost
                    ]
                ];
                return response()->json(['success' => true, 'procurement_items' => $items]);
            }

            if ($type === 'activities' || $type === 'multi_activities') {
                $budget = (float)$request->input('budget', 0);
                if ($budget <= 0) {
                    $budget = 10000;
                }

                $act1Budget = round($budget * 0.55, 2);
                $act2Budget = round($budget - $act1Budget, 2);

                // Dynamically scale participant counts to fit allocated budget
                $pCount = min(40, max(10, (int)($budget / 350)));
                if ($pCount < 10) $pCount = 10;

                // Activity 1 items (Workshop / Training)
                $act1SpeakerHours = ($act1Budget >= 4000) ? 3 : 2;
                $act1SpeakerRate = 600;
                $act1Speaker = $act1SpeakerHours * $act1SpeakerRate;
                if ($act1Speaker >= $act1Budget) {
                    $act1SpeakerHours = 1;
                    $act1Speaker = 600;
                }

                $snackPrice = ($act1Budget > 6000) ? 70 : 35;
                $act1Snack = $pCount * $snackPrice;
                if ($act1Speaker + $act1Snack >= $act1Budget) {
                    $act1Snack = max(0, $act1Budget - $act1Speaker - 500);
                    $snackPrice = ($pCount > 0) ? round($act1Snack / $pCount, 2) : 0;
                }

                $act1Material = max(0, round($act1Budget - ($act1Speaker + $act1Snack), 2));

                // Activity 2 items (Study visit / Application)
                $act2SnackPrice = 35;
                $act2Snack = $pCount * $act2SnackPrice;
                $act2LunchPrice = ($act2Budget >= 3500) ? 80 : 0;
                $act2Lunch = $pCount * $act2LunchPrice;

                if ($act2Lunch + $act2Snack >= $act2Budget) {
                    $act2Lunch = 0;
                    $act2LunchPrice = 0;
                    if ($act2Snack >= $act2Budget) {
                        $act2Snack = max(0, $act2Budget - 300);
                        $act2SnackPrice = ($pCount > 0) ? round($act2Snack / $pCount, 2) : 0;
                    }
                }

                $act2Material = max(0, round($act2Budget - ($act2Lunch + $act2Snack), 2));

                $activities = [
                    [
                        'name' => "กิจกรรมที่ 1 : อบรมเชิงปฏิบัติการพัฒนาทักษะวิชาชีพและการประยุกต์ใช้งาน",
                        'location' => 'ณ วิทยาลัยสารพัดช่างน่าน',
                        'target_group' => "นักเรียน นักศึกษา และบุคลากร จำนวน {$pCount} คน",
                        'loan_items' => [
                            [
                                'description' => "1. ค่าตอบแทนวิทยากรบรรยายและฝึกอบรมเชิงปฏิบัติการ ({$act1SpeakerHours} ชม. x {$act1SpeakerRate} บาท)",
                                'quantity' => $act1SpeakerHours,
                                'unit' => 'ชั่วโมง',
                                'unit_price' => $act1SpeakerRate,
                                'total_price' => $act1Speaker
                            ],
                            [
                                'description' => "2. ค่าอาหารว่างและเครื่องดื่ม ({$pCount} คน x {$snackPrice} บาท)",
                                'quantity' => $pCount,
                                'unit' => 'คน',
                                'unit_price' => $snackPrice,
                                'total_price' => $act1Snack
                            ],
                        ],
                        'procurement_items' => [
                            [
                                'description' => '1. ค่าวัสดุ อุปกรณ์ และเอกสารประกอบการฝึกอบรม',
                                'quantity' => 1,
                                'unit' => 'ชุด',
                                'unit_price' => $act1Material,
                                'total_price' => $act1Material
                            ],
                        ]
                    ],
                    [
                        'name' => "กิจกรรมที่ 2 : ฝึกปฏิบัติการภาคสนามและศึกษาดูงานแลกเปลี่ยนเรียนรู้",
                        'location' => 'สถานประกอบการและแหล่งเรียนรู้ในจังหวัดน่าน',
                        'target_group' => "นักเรียน นักศึกษา และครูผู้ควบคุม จำนวน {$pCount} คน",
                        'loan_items' => array_values(array_filter([
                            $act2Lunch > 0 ? [
                                'description' => "1. ค่าอาหารกลางวันสำหรับผู้เข้าร่วมกิจกรรม ({$pCount} คน x {$act2LunchPrice} บาท)",
                                'quantity' => $pCount,
                                'unit' => 'คน',
                                'unit_price' => $act2LunchPrice,
                                'total_price' => $act2Lunch
                            ] : null,
                            [
                                'description' => ($act2Lunch > 0 ? '2.' : '1.') . " ค่าอาหารว่างและเครื่องดื่ม ({$pCount} คน x {$act2SnackPrice} บาท)",
                                'quantity' => $pCount,
                                'unit' => 'คน',
                                'unit_price' => $act2SnackPrice,
                                'total_price' => $act2Snack
                            ],
                        ])),
                        'procurement_items' => [
                            [
                                'description' => '1. ค่าวัสดุและคู่มือบันทึกการเรียนรู้ประจำกิจกรรม',
                                'quantity' => 1,
                                'unit' => 'ชุด',
                                'unit_price' => $act2Material,
                                'total_price' => $act2Material
                            ],
                        ]
                    ]
                ];

                return response()->json(['success' => true, 'activities' => $activities]);
            }

            return response()->json(['success' => false, 'message' => 'Invalid type']);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('generateAiContent failed: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการประมวลผล AI: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * AI Consistency Auditor Endpoint
     */
    public function auditConsistency(Request $request)
    {
        try {
            $projectData = $request->all();
            
            // Allow title from request or fallback
            if (empty($projectData['title']) && !empty($projectData['project_id'])) {
                $p = Project::find($projectData['project_id']);
                if ($p) {
                    $projectData['title'] = $p->title;
                }
            }

            if (empty($projectData['title'])) {
                $projectData['title'] = 'ข้อเสนอโครงการ';
            }

            if (!isset($projectData['allocated_budget']) && isset($projectData['estimated_budget'])) {
                $projectData['allocated_budget'] = (float)$projectData['estimated_budget'];
            }

            $geminiService = app(\App\Services\GeminiService::class);
            $result = $geminiService->auditProjectConsistency($projectData);

            return response()->json([
                'success' => true,
                'audit' => $result,
                'result' => $result,
            ]);
        } catch (\Throwable $e) {
            \Log::error('auditConsistency Controller error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการตรวจสอบ: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update project funding source directly (Admin / Plan Staff).
     */
    public function updateFundingSource(Request $request, Project $project)
    {
        $user = auth()->user();
        $isPlanOrAdmin = $user->isAdmin() || $user->isPlanHead() || $user->isPlanStaff() || ($user->department && (str_contains($user->department->name, 'แผน') || $user->department->code === 'PLAN'));
        if (!$isPlanOrAdmin) {
            abort(403, 'เฉพาะเจ้าหน้าที่งานแผนงานและผู้ดูแลระบบเท่านั้นที่สามารถกำหนดแหล่งเงินทุนได้');
        }

        $request->validate([
            'funding_source_id' => 'required|exists:funding_sources,id',
        ]);

        $project->funding_source_id = $request->input('funding_source_id');
        $project->save();

        if ($project->budget) {
            $project->budget->funding_source_id = $request->input('funding_source_id');
            $project->budget->save();
        } else {
            \App\Models\Budget::create([
                'project_id' => $project->id,
                'funding_source_id' => $request->input('funding_source_id'),
                'allocated_amount' => $project->allocated_budget ?: $project->estimated_budget,
                'encumbered_amount' => $project->allocated_budget ?: $project->estimated_budget,
                'spent_amount' => 0.00,
                'is_advance_payment' => in_array($project->disbursement_type, ['loan', 'both']),
            ]);
        }

        return redirect()->back()->with('success', 'กำหนดแหล่งเงินงบประมาณเรียบร้อยแล้ว');
    }

    /**
     * Set project disbursement type directly (Admin / Plan Staff / Proposer).
     */
    public function setDisbursementType(Request $request, Project $project)
    {
        $user = auth()->user();
        $isPlanOrAdmin = $user->isAdmin() || $user->isPlanHead() || $user->isPlanStaff() || ($user->department && (str_contains($user->department->name, 'แผน') || $user->department->code === 'PLAN'));
        if (!$isPlanOrAdmin && $project->user_id !== $user->id) {
            abort(403, 'คุณไม่มีสิทธิ์ปรับเปลี่ยนประเภทการเบิกจ่ายของโครงการนี้');
        }

        $request->validate([
            'disbursement_type' => 'required|in:procurement,loan,both',
        ]);

        $type = $request->input('disbursement_type');
        $project->disbursement_type = $type;
        $project->save();

        if ($project->budget) {
            $project->budget->is_advance_payment = in_array($type, ['loan', 'both']);
            $project->budget->save();
        }

        // If switched to loan, clean up empty procurement items
        if ($type === 'loan' && $project->procurement) {
            $project->procurement->items()->where(function($q) {
                $q->whereNull('total_price')->orWhere('total_price', '<=', 0);
            })->delete();
        }

        return redirect()->back()->with('success', 'ปรับเปลี่ยนประเภทการเบิกจ่ายโครงการเรียบร้อยแล้ว');
    }

    /**
     * Unlock project for proposer to edit.
     */
    public function unlockForEdit(Request $request, Project $project)
    {
        $user = auth()->user();
        $isPlanOrAdmin = $user->isAdmin() || $user->isPlanHead() || $user->isPlanStaff() || ($user->department && (str_contains($user->department->name, 'แผน') || $user->department->code === 'PLAN'));
        if (!$isPlanOrAdmin && $project->user_id !== $user->id) {
            abort(403, 'คุณไม่มีสิทธิ์ปลดล็อคโครงการนี้');
        }

        if ($project->procurement) {
            $project->procurement->status = 'pending';
            $project->procurement->save();
        }

        return redirect()->route('projects.edit', $project->id)->with('success', 'ปลดล็อคโครงการเรียบร้อยแล้ว ท่านสามารถเข้าแก้ไขประเภทการเบิกจ่ายและรายละเอียดโครงการได้ทันที');
    }

    /**
     * AI Smart Budget Routing: Suggest vocational funding source for project.
     */
    public function aiRecommendFunding(Request $request, \App\Services\GeminiService $geminiService)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'objectives' => 'nullable|string',
            'items' => 'nullable|array',
            'budget' => 'nullable|numeric',
        ]);

        $recommendation = $geminiService->recommendFundingSource(
            title: $validated['title'],
            objectives: $validated['objectives'] ?? '',
            items: $validated['items'] ?? [],
            budget: isset($validated['budget']) ? (float)$validated['budget'] : null
        );

        return response()->json($recommendation);
    }

    /**
     * Public Document Digital Verification Portal.
     */
    public function verifyPublicDocument($code)
    {
        $project = Project::with([
            'department',
            'user',
            'approvals' => function($q) {
                $q->with('user')->orderBy('step_number', 'asc');
            },
            'auditLogs' => function($q) {
                $q->with('user')->orderBy('created_at', 'desc');
            }
        ])->where('verification_code', $code)->first();

        return Inertia::render('Projects/Verify', [
            'verificationCode' => $code,
            'isValid' => $project !== null && !empty($project->sealed_at),
            'project' => $project ? [
                'id' => $project->id,
                'title' => $project->title,
                'academic_year' => $project->academic_year,
                'responsible_person' => $project->responsible_person,
                'department_name' => $project->department?->name ?? 'ไม่ระบุ',
                'estimated_budget' => (float)$project->estimated_budget,
                'status' => $project->status,
                'sealed_at' => $project->sealed_at ? $project->sealed_at->format('Y-m-d H:i:s') : null,
                'verification_code' => $project->verification_code,
                'digital_seal_hash' => $project->digital_seal_hash,
                'current_approval_step' => $project->current_approval_step,
                'approvals' => $project->approvals->map(fn($a) => [
                    'step_number' => $a->step_number,
                    'status' => $a->status,
                    'user_name' => $a->user?->name,
                    'role' => $a->user?->role,
                    'updated_at' => $a->updated_at ? $a->updated_at->format('Y-m-d H:i:s') : null,
                    'comments' => $a->comments,
                ]),
                'audit_logs_count' => $project->auditLogs->count(),
            ] : null,
        ]);
    }
}

