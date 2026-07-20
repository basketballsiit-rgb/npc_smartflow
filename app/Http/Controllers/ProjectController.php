<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\IqaStrategy;
use App\Models\OvecStrategy;
use App\Models\Department;
use App\Models\ProjectApproval;
use App\Models\Budget;
use App\Jobs\StitchProjectDocumentsJob;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;

class ProjectController extends Controller
{
    /**
     * Show the form for creating a new project.
     */
    public function create()
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

        return Inertia::render('Projects/Create', [
            'strategyCategories' => $activeCategories,
            'iqaStrategies' => IqaStrategy::all(),
            'ovecStrategies' => OvecStrategy::all(),
            'nationalStrategies' => \App\Models\NationalStrategy::all(),
            'provincialStrategies' => \App\Models\ProvincialStrategy::all(),
            'departments' => Department::all(),
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

        return redirect()->route('dashboard')->with('message', 'Project draft created successfully.');
    }

    /**
     * Display the specified project.
     */
    public function show(Project $project)
    {
        $project->load(['user', 'department', 'iqaStrategy', 'ovecStrategy', 'approvals.user', 'budget.fundingSource', 'procurement.committees', 'procurement.items']);
        $project->append(['iqa_strategies', 'ovec_strategies', 'national_strategies', 'provincial_strategies']);
        
        // Load all strategy categories for display
        $allCategories = \App\Models\StrategyCategory::with(['items'])->orderBy('order_index', 'asc')->get();

        // Determine if current user can approve this step
        $canApprove = false;
        $user = auth()->user();
        
        if ($project->status === 'submitted' || $project->status === 'pending_approval') {
            switch ($project->current_approval_step) {
                case 2: // Head of Department (HOD) - mapped to same department teacher or HOD role
                    $canApprove = ($user->department_id === $project->department_id && ($user->isTeacher() || $user->isPlanHead()));
                    break;
                case 3: // Plan Head
                    $canApprove = $user->isPlanHead();
                    break;
                case 4: // Deputy Director
                case 5: // Deputy Director 2
                case 6: // Director
                    $canApprove = $user->isExecutive();
                    break;
            }
        }

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'strategyCategories' => $allCategories,
            'fundingSources' => \App\Models\FundingSource::all(),
            'allUsers' => \App\Models\User::orderBy('name')->get(['id', 'name', 'email']),
            'canApprove' => $canApprove,
        ]);
    }

    /**
     * Show the form for editing the specified project.
     */
    public function edit(Project $project)
    {
        // Only draft or rejected projects can be edited
        if (!in_array($project->status, ['draft', 'rejected'])) {
            abort(403, 'Locked projects cannot be edited.');
        }

        if ($project->user_id !== auth()->id()) {
            abort(403, 'Unauthorized.');
        }

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
        ]);
    }

    /**
     * Update the specified project in database.
     */
    public function update(Request $request, Project $project)
    {
        if (!in_array($project->status, ['draft', 'rejected'])) {
            abort(403, 'Locked projects cannot be updated.');
        }

        if ($project->user_id !== auth()->id()) {
            abort(403, 'Unauthorized.');
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

        $project->update($validated);

        return redirect()->route('dashboard')->with('message', 'Project updated successfully.');
    }

    /**
     * Delete the specified project from database.
     */
    public function destroy(Project $project)
    {
        $user = auth()->user();
        
        // Admin can delete any project; regular user can only delete their own draft
        if (!$user->isAdmin() && ($project->user_id !== $user->id || $project->status !== 'draft')) {
            abort(403, 'คุณไม่มีสิทธิ์ลบโครงการนี้');
        }

        // Clean up all related child records
        $project->approvals()->delete();
        if ($project->budget) $project->budget()->delete();
        if ($project->procurement) $project->procurement()->delete();
        if ($project->survey) $project->survey()->delete();
        $project->appendices()->delete();
        $project->photos()->delete();

        $project->delete();

        return redirect()->back()->with('success', 'ลบโครงการเรียบร้อยแล้ว');
    }

    /**
     * Submit project to the approval workflow.
     */
    public function submit(Project $project)
    {
        $user = auth()->user();
        if ($project->user_id !== $user->id && !$user->isAdmin()) {
            abort(403, 'คุณไม่มีสิทธิ์ยื่นขออนุมัติโครงการนี้');
        }

        if (!in_array($project->status, ['draft', 'rejected'])) {
            abort(403, 'เฉพาะโครงการที่เป็นแบบร่างหรือส่งกลับแก้ไขเท่านั้นที่สามารถยื่นขออนุมัติได้');
        }

        $project->status = 'pending_approval';
        $project->current_approval_step = 2; // Advance to HOD review step
        $project->save();

        // Create submission log
        ProjectApproval::create([
            'project_id' => $project->id,
            'user_id' => auth()->id(),
            'step_number' => 1,
            'status' => 'approved',
            'comments' => 'ยื่นขออนุมัติเพื่อดำเนินงานโครงการต่อ (Submitted for Board Execution Approval)',
        ]);

        return redirect()->back()->with('success', 'ยื่นเสนอขออนุมัติเพื่อดำเนินงานโครงการต่อเรียบร้อยแล้ว');
    }

    /**
     * Approve the project at the current step.
     */
    public function approve(Request $request, Project $project)
    {
        $request->validate([
            'comments' => 'nullable|string',
        ]);

        // Budget locking details check during Step 3 (Plan Head)
        if ($project->current_approval_step === 3) {
            $request->validate([
                'funding_source_id' => 'required|exists:funding_sources,id',
                'allocated_amount' => 'required|numeric|min:0',
                'is_advance_payment' => 'nullable|boolean',
            ]);

            Budget::updateOrCreate(
                ['project_id' => $project->id],
                [
                    'funding_source_id' => $request->input('funding_source_id'),
                    'allocated_amount' => $request->input('allocated_amount'),
                    'encumbered_amount' => $request->input('allocated_amount'), // lock budget
                    'spent_amount' => 0.00,
                    'is_advance_payment' => $request->boolean('is_advance_payment', false),
                ]
            );
        }

        // Record approval log
        ProjectApproval::create([
            'project_id' => $project->id,
            'user_id' => auth()->id(),
            'step_number' => $project->current_approval_step,
            'status' => 'approved',
            'comments' => $request->input('comments', 'Approved'),
        ]);

        if ($project->current_approval_step >= 6) {
            // Final step: Director approval. Lock project and set approved state
            $project->status = 'approved';
            $project->approved_at = now();
            $project->save();

            // PDF generation trigger (Stub / mock file creation)
            // A read-only PDF file is prepared in real-time
            // In Step 7, we integrate Browsershot/Puppeteer for actual generation
            return redirect()->route('dashboard')->with('message', 'Project fully approved and locked.');
        }

        // Advance to next step
        $project->current_approval_step += 1;
        $project->status = 'pending_approval';
        $project->save();

        return redirect()->route('dashboard')->with('message', 'Project approved to next stage.');
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

        if ($mode === 'full') {
            $defaultFunding = \App\Models\FundingSource::first();
            $fundingId = $defaultFunding ? $defaultFunding->id : 1;

            Budget::updateOrCreate(
                ['project_id' => $project->id],
                [
                    'funding_source_id' => $request->input('funding_source_id', $fundingId),
                    'allocated_amount' => $request->input('allocated_amount', $project->estimated_budget),
                    'encumbered_amount' => $request->input('allocated_amount', $project->estimated_budget),
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
                ]);
            }

            $project->status = 'approved';
            $project->current_approval_step = 6;
            $project->approved_at = now();
            $project->save();

            return redirect()->back()->with('message', 'ผู้ดูแลระบบอนุมัติโครงการสมบูรณ์เรียบร้อยแล้ว (Approved)');
        }

        // Single step advance
        if ($project->current_approval_step === 3) {
            $defaultFunding = \App\Models\FundingSource::first();
            $fundingId = $request->input('funding_source_id', $defaultFunding ? $defaultFunding->id : 1);
            $allocated = $request->input('allocated_amount', $project->estimated_budget);

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
        }

        ProjectApproval::create([
            'project_id' => $project->id,
            'user_id' => $user->id,
            'step_number' => $project->current_approval_step,
            'status' => 'approved',
            'comments' => $request->input('comments', 'อนุมัติผ่านสิทธิ์ผู้ดูแลระบบ (Admin Step Override)'),
        ]);

        if ($project->current_approval_step >= 6) {
            $project->status = 'approved';
            $project->approved_at = now();
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
            'status' => 'required|in:draft,submitted,pending_approval,approved,in_progress,evaluating,completed',
        ]);

        $project->status = $validated['status'];
        $project->save();

        return redirect()->back()->with('message', 'อัปเดตสถานะความก้าวหน้าการดำเนินโครงการเรียบร้อยแล้ว');
    }

    /**
     * Reject the project at the current step.
     */
    public function reject(Request $request, Project $project)
    {
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
        $project->load(['user', 'department', 'approvals.user', 'budget.fundingSource']);
        $allCategories = \App\Models\StrategyCategory::with(['items'])->orderBy('order_index', 'asc')->get();

        return Inertia::render('Projects/Print', [
            'project' => $project,
            'strategyCategories' => $allCategories,
        ]);
    }

    /**
     * AI Assistant for drafting proposal rationale, objectives, and targets.
     */
    public function generateAiContent(Request $request)
    {
        $type = $request->input('type', 'rationale');
        $title = trim($request->input('title', ''));
        if (empty($title)) {
            $title = 'โครงการพัฒนาทักษะวิชาชีพและการจัดการเรียนการสอน';
        }

        if ($type === 'rationale') {
            $content = "ในปัจจุบัน การเปลี่ยนแปลงทางสังคม เศรษฐกิจ และเทคโนโลยีดิจิทัลดำเนินไปอย่างรวดเร็ว ส่งผลให้สถานศึกษาอาชีวศึกษาจำเป็นต้องปรับเปลี่ยนและพัฒนากระบวนการจัดการเรียนการสอนและการฝึกทักษะวิชาชีพให้สอดคล้องกับความต้องการของตลาดแรงงานและยุทธศาสตร์การพัฒนาประเทศ\n\nวิทยาลัยสารพัดช่างน่าน มุ่งมั่นในการยกระดับคุณภาพการจัดการศึกษาและการฝึกอบรมวิชาชีพ เพื่อสร้างผู้เรียนและบุคลากรที่มีความรู้ ความสามารถ มีทักษะสมรรถนะสูง ตลอดจนมีคุณธรรมจริยธรรมที่พร้อมตอบสนองต่อการพัฒนาเศรษฐกิจในระดับชุมชน จังหวัด และประเทศชาติ\n\nดังนั้น งานวางแผนและงบประมาณร่วมกับฝ่ายงานที่เกี่ยวข้อง จึงได้จัดทำ \"{$title}\" ขึ้น เพื่อเป็นกลไกสำคัญในการขับเคลื่อนการพัฒนาทักษะ การเสริมสร้างประสบการณ์จริง และส่งเสริมคุณภาพการศึกษาตามมาตรฐานการประกันคุณภาพการศึกษาอย่างยั่งยืนต่อไป";
            return response()->json(['success' => true, 'content' => $content]);
        }

        if ($type === 'objectives') {
            $objectives = [
                "เพื่อส่งเสริมและพัฒนาทักษะสมรรถนะอาชีพของผู้เรียนใน{$title} ให้ตรงตามมาตรฐานอาชีวศึกษา",
                "เพื่อยกระดับคุณภาพการจัดการเรียนการสอนและการฝึกอบรมวิชาชีพของวิทยาลัยสารพัดช่างน่าน",
                "เพื่อสร้างเครือข่ายความร่วมมือในการพัฒนาการศึกษาร่วมกับหน่วยงานภาครัฐ ภาคเอกชน และชุมชนในจังหวัดน่าน"
            ];
            return response()->json(['success' => true, 'objectives' => $objectives]);
        }

        if ($type === 'targets') {
            $quantitative = [
                "นักเรียน นักศึกษา และผู้เข้าร่วมโครงการ จำนวนไม่น้อยกว่า 50 คน",
                "มีการจัดกิจกรรมฝึกอบรมเชิงปฏิบัติการ จำนวนไม่น้อยกว่า 1 ครั้ง"
            ];
            $qualitative = [
                "ผู้เข้าร่วมโครงการมีความรู้ ความเข้าใจ และทักษะเพิ่มขึ้นไม่น้อยกว่าร้อยละ 85",
                "ผู้เข้าร่วมโครงการมีความพึงพอใจต่อภาพรวมของการจัดโครงการในระดับดีมาก (ร้อยละ 90 ขึ้นไป)"
            ];
            return response()->json(['success' => true, 'quantitative' => $quantitative, 'qualitative' => $qualitative]);
        }

        return response()->json(['success' => false, 'message' => 'Invalid type']);
    }
}
