<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Budget extends Model
{
    protected $fillable = [
        'project_id',
        'funding_source_id',
        'allocated_amount',
        'encumbered_amount',
        'spent_amount',
        'is_advance_payment',
        'advance_cleared_at',
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
            'is_advance_payment' => 'boolean',
            'advance_cleared_at' => 'datetime',
        ];
    }

    /**
     * Get the project associated with this budget.
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the funding source for this budget.
     */
    public function fundingSource()
    {
        return $this->belongsTo(FundingSource::class);
    }
}
