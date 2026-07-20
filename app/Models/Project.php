<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    protected $fillable = [
        'user_id',
        'department_id',
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
        'estimated_budget',
        'status',
        'current_approval_step',
        'approved_at',
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
            'strategy_selections' => 'array',
            'iqa_strategy_ids' => 'array',
            'ovec_strategy_ids' => 'array',
            'national_strategy_ids' => 'array',
            'provincial_strategy_ids' => 'array',
            'estimated_budget' => 'decimal:2',
            'approved_at' => 'datetime',
            'current_approval_step' => 'integer',
        ];
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
}
