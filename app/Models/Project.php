<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'user_id',
        'department_id',
        'user_position_id',
        'proposer_duty',
        'title',
        'academic_year',
        'background_rationale',
        'objectives',
        'targets',
        'iqa_strategy_id',
        'iqa_strategy_ids',
        'ovec_strategy_id',
        'ovec_strategy_ids',
        'national_strategy_ids',
        'provincial_strategy_ids',
        'strategy_selections',
        'responsible_person',
        'position',
        'phone',
        'email',
        'mission',
        'goal',
        'strategy_tactic',
        'outputs',
        'outcomes',
        'location',
        'expected_benefits',
        'indicators',
        'action_plan',
        'activities',
        'estimated_budget',
        'proposed_budget',
        'allocated_budget',
        'approved_budget',
        'allocation_status',
        'committee_feedback',
        'budget_adjustment_reason',
        'disbursement_type',
        'funding_source_id',
        'report_category',
        'committee_comment',
        'budget_approved_at',
        'preliminary_sections',
        'preliminary_content',
        'chapter_1_sections',
        'chapter_1_content',
        'chapter_2_sections',
        'chapter_2_content',
        'chapter_3_sections',
        'chapter_3_content',
        'chapter_4_sections',
        'chapter_4_content',
        'chapter_5_sections',
        'chapter_5_content',
        'full_report_metadata',
        'full_report_completed_at',
        'status',
        'current_approval_step',
        'approved_at',
        'sealed_at',
        'digital_seal_hash',
        'verification_code',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'objectives' => 'array',
            'targets' => 'array',
            'outputs' => 'array',
            'outcomes' => 'array',
            'expected_benefits' => 'array',
            'indicators' => 'array',
            'action_plan' => 'array',
            'activities' => 'array',
            'preliminary_sections' => 'array',
            'chapter_1_sections' => 'array',
            'chapter_2_sections' => 'array',
            'chapter_3_sections' => 'array',
            'chapter_4_sections' => 'array',
            'chapter_5_sections' => 'array',
            'full_report_metadata' => 'array',
            'full_report_completed_at' => 'datetime',
            'strategy_selections' => 'array',
            'iqa_strategy_ids' => 'array',
            'ovec_strategy_ids' => 'array',
            'national_strategy_ids' => 'array',
            'provincial_strategy_ids' => 'array',
            'estimated_budget' => 'decimal:2',
            'proposed_budget' => 'decimal:2',
            'allocated_budget' => 'decimal:2',
            'approved_budget' => 'decimal:2',
            'budget_approved_at' => 'datetime',
            'approved_at' => 'datetime',
            'sealed_at' => 'datetime',
            'current_approval_step' => 'integer',
        ];
    }

    protected $appends = [
        'funding_source_name',
        'execution_status',
    ];

    /**
     * Get the funding source name from relation or budget fallback.
     */
    public function getFundingSourceNameAttribute(): ?string
    {
        return $this->fundingSource?->name
            ?: $this->budget?->fundingSource?->name
            ?: null;
    }

    /**
     * Get all audit trail logs for this project.
     */
    public function auditLogs()
    {
        return $this->morphMany(AuditLog::class, 'auditable')->latest('created_at');
    }

    /**
     * Get the teacher who proposed the project.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the department the project belongs to.
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the specific duty/position under which this project was proposed.
     */
    public function userPosition()
    {
        return $this->belongsTo(UserPosition::class);
    }

    /**
     * Get the primary IQA strategy aligned with this project.
     */
    public function iqaStrategy()
    {
        return $this->belongsTo(IqaStrategy::class);
    }

    /**
     * Get the primary OVEC strategy aligned with this project.
     */
    public function ovecStrategy()
    {
        return $this->belongsTo(OvecStrategy::class);
    }

    /**
     * Get all selected IQA strategies.
     */
    public function getIqaStrategiesAttribute()
    {
        $ids = $this->iqa_strategy_ids ?: ($this->iqa_strategy_id ? [$this->iqa_strategy_id] : []);
        return IqaStrategy::whereIn('id', $ids)->get();
    }

    /**
     * Get all selected OVEC strategies.
     */
    public function getOvecStrategiesAttribute()
    {
        $ids = $this->ovec_strategy_ids ?: ($this->ovec_strategy_id ? [$this->ovec_strategy_id] : []);
        return OvecStrategy::whereIn('id', $ids)->get();
    }

    /**
     * Get all selected National strategies.
     */
    public function getNationalStrategiesAttribute()
    {
        $ids = $this->national_strategy_ids ?: [];
        return NationalStrategy::whereIn('id', $ids)->get();
    }

    /**
     * Get all selected Provincial strategies.
     */
    public function getProvincialStrategiesAttribute()
    {
        $ids = $this->provincial_strategy_ids ?: [];
        return ProvincialStrategy::whereIn('id', $ids)->get();
    }

    /**
     * Get the approval workflow logs for this project.
     */
    public function approvals()
    {
        return $this->hasMany(ProjectApproval::class);
    }

    /**
     * Get the funding source for this project.
     */
    public function fundingSource()
    {
        return $this->belongsTo(FundingSource::class);
    }

    /**
     * Get the budget allocation for this project.
     */
    public function budget()
    {
        return $this->hasOne(Budget::class);
    }

    public function budgets()
    {
        return $this->hasMany(Budget::class);
    }

    /**
     * Get the procurement details for this project.
     */
    public function procurement()
    {
        return $this->hasOne(Procurement::class);
    }

    /**
     * Get the survey for this project.
     */
    public function survey()
    {
        return $this->hasOne(Survey::class);
    }

    /**
     * Get the appendices uploaded for this project.
     */
    public function appendices()
    {
        return $this->hasMany(Appendix::class);
    }

    /**
     * Get the photo grid items for this project.
     */
    public function photos()
    {
        return $this->hasMany(ProjectPhoto::class, 'project_id');
    }

    /**
     * Get all travel loans for this project.
     */
    public function travelLoans()
    {
        return $this->hasMany(TravelLoan::class);
    }

    /**
     * Get all expense clearings for this project.
     */
    public function expenseClearings()
    {
        return $this->hasMany(ExpenseClearing::class);
    }

    /**
     * Get the 5-level execution lifecycle status.
     * 1. 🔴 สีแดง - ยังไม่ได้เริ่มดำเนินการ
     * 2. 🟡 สีเหลือง - มีการเริ่มจัดทำโครงการแบบเต็มรูปแบบ
     * 3. 🟠 สีส้ม - มีการอนุมัติครบและดำเนินโครงการ ตรวจสอบจากการเขียนสัญญายืมเงิน หรือจัดซื้อจัดจ้าง
     * 4. 🟧 สีส้มแดง - ดำเนินการโครงการเรียบร้อย แต่ยังไม่ได้สรุปรูปเล่ม
     * 5. 🟢 สีเขียว - ดำเนินการสรุปโครงการรูปเล่ม และมีการเคลียร์เงินต่าง ๆ เรียบร้อย
     */
    public function getExecutionStatusAttribute(): array
    {
        // 1. Check Green: ดำเนินการสรุปโครงการรูปเล่ม และมีการเคลียร์เงินต่าง ๆ เรียบร้อย
        $hasCompletedBook = !empty($this->full_report_completed_at) || (!empty($this->chapter_5_content) && is_array($this->chapter_5_content) && count($this->chapter_5_content) > 0);
        
        $hasLoans = $this->relationLoaded('travelLoans') 
            ? $this->travelLoans->isNotEmpty() 
            : $this->travelLoans()->exists();

        $proc = $this->relationLoaded('procurement') ? $this->procurement : $this->procurement()->first();
        $hasProcurements = !empty($proc) && (!empty($proc->procurement_number) || !empty($proc->plan_procurement_cut_at) || ($proc->items && $proc->items->isNotEmpty()));

        $allLoansCleared = true;
        if ($hasLoans) {
            $loans = $this->relationLoaded('travelLoans') ? $this->travelLoans : $this->travelLoans()->get();
            $uncleared = $loans->filter(function($l) {
                return empty($l->cleared_at) && $l->loan_status !== 'cleared';
            });
            $allLoansCleared = $uncleared->isEmpty();
        }

        $allClearingsDone = true;
        if ($this->relationLoaded('expenseClearings') ? $this->expenseClearings->isNotEmpty() : $this->expenseClearings()->exists()) {
            $clearings = $this->relationLoaded('expenseClearings') ? $this->expenseClearings : $this->expenseClearings()->get();
            $pending = $clearings->filter(function($c) {
                return $c->status !== 'finance_completed';
            });
            $allClearingsDone = $pending->isEmpty();
        }

        $isFinanciallyCleared = ($hasLoans ? $allLoansCleared : true) && $allClearingsDone;

        if ($hasCompletedBook && $isFinanciallyCleared && ($this->status === 'completed' || $hasLoans || $hasProcurements || (float)$this->allocated_budget > 0)) {
            return [
                'key' => 'blue',
                'level' => 5,
                'percentage' => 90,
                'label' => 'ดำเนินการสรุปโครงการรูปเล่ม และมีการเคลียร์เงินต่าง ๆ เรียบร้อย',
                'short_label' => 'สรุปรูปเล่ม & เคลียร์เงินเรียบร้อย',
                'color' => 'blue',
                'hex' => '#0284c7',
                'dot' => '🔵',
                'bg_class' => 'bg-sky-50 text-sky-800 border-sky-300 font-extrabold',
            ];
        }

        // 2. Check Level 4 (Green): ดำเนินการโครงการเรียบร้อย แต่ยังไม่ได้สรุปรูปเล่ม
        $isExecutionDone = ($this->status === 'completed' || $this->status === 'evaluating')
            || ($hasLoans && ($this->relationLoaded('travelLoans') ? $this->travelLoans : $this->travelLoans()->get())->whereNotNull('finance_disbursed_at')->isNotEmpty())
            || ($proc && (!empty($proc->finance_disbursed_at) || $proc->status === 'completed'));

        if ($isExecutionDone && !$hasCompletedBook) {
            return [
                'key' => 'green',
                'level' => 4,
                'percentage' => 70,
                'label' => 'ดำเนินการโครงการเรียบร้อย แต่ยังไม่ได้สรุปรูปเล่ม',
                'short_label' => 'ดำเนินโครงการแล้ว รอสรุปรูปเล่ม',
                'color' => 'emerald',
                'hex' => '#10b981',
                'dot' => '🟢',
                'bg_class' => 'bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold',
            ];
        }

        // 3. Check Level 3 (Yellow): มีการอนุมัติครบและดำเนินโครงการ ตรวจสอบจากการเขียนสัญญายืมเงิน หรือจัดซื้อจัดจ้าง
        $isFullyApproved = ($this->status === 'approved' || $this->status === 'in_progress' || (int)$this->current_approval_step >= 6);
        $hasStartedContract = $hasLoans || $hasProcurements;

        if ($isFullyApproved && $hasStartedContract) {
            return [
                'key' => 'yellow',
                'level' => 3,
                'percentage' => 50,
                'label' => 'มีการอนุมัติครบและดำเนินโครงการ ตรวจสอบจากการเขียนสัญญายืมเงิน หรือจัดซื้อจัดจ้าง',
                'short_label' => 'อนุมัติครบ & ดำเนินโครงการ (ยืมเงิน/จัดซื้อ)',
                'color' => 'amber',
                'hex' => '#eab308',
                'dot' => '🟡',
                'bg_class' => 'bg-amber-50 text-amber-900 border-amber-300 font-bold',
            ];
        }

        // 4. Check Level 2 (Orange): มีการเริ่มจัดทำโครงการแบบเต็มรูปแบบ
        $hasFullContent = !empty($this->chapter_1_content) || !empty($this->activities) || in_array($this->status, ['submitted', 'pending_approval', 'approved', 'budget_approved']);
        $isPreliminaryOnly = ($this->status === 'preliminary') && empty($this->chapter_1_content);

        if (!$isPreliminaryOnly && ($hasFullContent || in_array($this->status, ['draft', 'submitted', 'pending_approval', 'approved']))) {
            return [
                'key' => 'orange',
                'level' => 2,
                'percentage' => 30,
                'label' => 'มีการเริ่มจัดทำโครงการแบบเต็มรูปแบบ',
                'short_label' => 'เริ่มจัดทำโครงการแบบเต็มรูปแบบ',
                'color' => 'orange',
                'hex' => '#f97316',
                'dot' => '🟠',
                'bg_class' => 'bg-orange-50 text-orange-800 border-orange-300 font-semibold',
            ];
        }

        // 5. Level 1 (Red): ยังไม่ได้เริ่มดำเนินการ
        return [
            'key' => 'red',
            'level' => 1,
            'percentage' => 10,
            'label' => 'ยังไม่ได้เริ่มดำเนินการ',
            'short_label' => 'ยังไม่ได้เริ่มดำเนินการ',
            'color' => 'red',
            'hex' => '#ef4444',
            'dot' => '🔴',
            'bg_class' => 'bg-rose-50 text-rose-800 border-rose-300 font-semibold',
        ];
    }
}
