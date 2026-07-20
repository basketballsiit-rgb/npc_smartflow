<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Appendix extends Model
{
    protected $table = 'appendices';

    protected $fillable = [
        'project_id',
        'title',
        'file_path',
        'file_type',
        'file_size',
        'sort_order',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /**
     * Get the project associated with this appendix.
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
