<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Procurement extends Model
{
    protected $fillable = [
        'project_id',
        'procurement_number',
        'memo_date',
        'memo_subject',
        'tor_specifications',
        'status',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'memo_date' => 'date',
        ];
    }

    /**
     * Get the project associated with this procurement process.
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the estimation items for this procurement.
     */
    public function items()
    {
        return $this->hasMany(ProcurementItem::class);
    }

    /**
     * Get all committees assigned to this procurement.
     */
    public function committees()
    {
        return $this->belongsToMany(User::class, 'procurement_committees')
                    ->withPivot('committee_type', 'role')
                    ->withTimestamps();
    }

    /**
     * Helper to get the purchasing committee members.
     */
    public function purchasingCommittee()
    {
        return $this->committees()->wherePivot('committee_type', 'purchasing');
    }

    /**
     * Helper to get the inspection committee members.
     */
    public function inspectionCommittee()
    {
        return $this->committees()->wherePivot('committee_type', 'inspection');
    }
}
