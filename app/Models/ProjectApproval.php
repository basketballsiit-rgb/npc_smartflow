<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectApproval extends Model
{
    protected $table = 'project_approvals';

    protected $fillable = [
        'project_id',
        'user_id',
        'step_number',
        'status',
        'comments',
    ];

    /**
     * Get the project being approved.
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the user who made this approval decision.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
