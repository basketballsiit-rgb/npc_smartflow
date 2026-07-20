<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $fillable = ['name', 'code', 'parent_id'];

    /**
     * Parent main division.
     */
    public function parent()
    {
        return $this->belongsTo(Department::class, 'parent_id');
    }

    /**
     * Sub-work departments / branches under this main division.
     */
    public function children()
    {
        return $this->hasMany(Department::class, 'parent_id');
    }

    /**
     * Get the users in this department.
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the projects proposed within this department.
     */
    public function projects()
    {
        return $this->hasMany(Project::class);
    }
}
