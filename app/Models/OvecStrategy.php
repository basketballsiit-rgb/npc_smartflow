<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OvecStrategy extends Model
{
    protected $table = 'ovec_strategies';

    protected $fillable = ['name', 'description'];

    /**
     * Get the projects aligned with this OVEC strategy.
     */
    public function projects()
    {
        return $this->hasMany(Project::class);
    }
}
