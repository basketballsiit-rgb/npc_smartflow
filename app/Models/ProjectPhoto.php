<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectPhoto extends Model
{
    protected $table = 'project_photos';

    protected $fillable = [
        'project_id',
        'photo_path',
        'caption',
        'sort_order',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    /**
     * Get the project associated with this photo.
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
