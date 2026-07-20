<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FundingSource extends Model
{
    protected $table = 'funding_sources';

    protected $fillable = [
        'name',
        'code',
        'description',
    ];

    /**
     * Get the budgets allocated from this funding source.
     */
    public function budgets()
    {
        return $this->hasMany(Budget::class);
    }
}
