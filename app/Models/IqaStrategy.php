<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IqaStrategy extends Model
{
    protected $table = 'iqa_strategies';
    
    protected $fillable = ['name', 'description'];

    /**
     * Get the projects aligned with this IQA strategy.
     */
    public function projects()
    {
        return $this->hasMany(Project::class);
    }
}
