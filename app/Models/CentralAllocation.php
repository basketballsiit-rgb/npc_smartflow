<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CentralAllocation extends Model
{
    protected $fillable = [
        'fiscal_year',
        'document_number',
        'title',
        'funding_source_id',
        'amount',
        'description',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    /**
     * Get the funding source for this allocation.
     */
    public function fundingSource()
    {
        return $this->belongsTo(FundingSource::class);
    }
}
