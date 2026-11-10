<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FundingSource extends Model
{
    protected $table = 'funding_sources';

    protected $fillable = [
        'name',
        'code',
        'fiscal_year',
        'budget_number',
        'budget_code',
        'activity_code',
        'sub_account_code',
        'description',
    ];

    /**
     * Get the central allocations for this funding source.
     */
    public function centralAllocations()
    {
        return $this->hasMany(CentralAllocation::class);
    }

    /**
     * Get the budgets allocated from this funding source.
     */
    public function budgets()
    {
        return $this->hasMany(Budget::class);
    }
}
