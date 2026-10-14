<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectApproval extends Model
{
    protected $table = 'project_approvals';

    protected $fillable = [
        'project_id',
        'user_id',
        'delegated_from_user_id',
        'role_delegation_id',
        'step_number',
        'status',
        'comments',
        'signature_data',
        'signature_type',
        'acting_position_text',
        'signature_hash',
        'ip_address',
        'user_agent',
        'signed_at',
    ];

    protected function casts(): array
    {
        return [
            'signature_data' => 'encrypted',
            'signed_at' => 'datetime',
            'step_number' => 'integer',
        ];
    }

    /**
     * Get the project being approved.
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the user who made this approval decision (ผู้ลงนามจริง).
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The principal user if this was signed under delegation (ผู้มอบอำนาจ).
     */
    public function delegatedFromUser()
    {
        return $this->belongsTo(User::class, 'delegated_from_user_id');
    }

    /**
     * The delegation contract/record.
     */
    public function roleDelegation()
    {
        return $this->belongsTo(RoleDelegation::class, 'role_delegation_id');
    }

    /**
     * Check if this approval was made as an acting / delegated signatory.
     */
    public function isActing(): bool
    {
        return !empty($this->delegated_from_user_id) || !empty($this->acting_position_text);
    }
}
