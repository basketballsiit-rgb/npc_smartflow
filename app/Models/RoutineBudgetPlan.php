<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoutineBudgetPlan extends Model
{
    protected $fillable = [
        'fiscal_year',
        'department_id',
        'title',
        'allocated_amount',
        'encumbered_amount',
        'spent_amount',
        'funding_source_id',
        'report_category',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'allocated_amount' => 'decimal:2',
            'encumbered_amount' => 'decimal:2',
            'spent_amount' => 'decimal:2',
        ];
    }

    /**
     * Get the department associated with this budget plan.
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the procurements linked to this budget plan.
     */
    public function procurements()
    {
        return $this->hasMany(Procurement::class);
    }

    /**
     * Get the funding source for this routine budget plan.
     */
    public function fundingSource()
    {
        return $this->belongsTo(FundingSource::class);
    }
}
