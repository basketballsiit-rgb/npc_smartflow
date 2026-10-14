<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SpecialProjectBudget extends Model
{
    protected $fillable = [
        'fiscal_year',
        'document_number',
        'document_date',
        'title',
        'agency_name',
        'allocated_amount',
        'spent_amount',
        'project_id',
        'created_by',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'document_date' => 'date',
            'allocated_amount' => 'decimal:2',
            'spent_amount' => 'decimal:2',
        ];
    }

    /**
     * Get the associated project.
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the user who recorded this.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
