<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Survey extends Model
{
    protected $fillable = [
        'project_id',
        'survey_code',
        'title',
        'description',
        'is_active',
        'act_recommendation',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the project associated with this survey.
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the responses submitted for this survey.
     */
    public function responses()
    {
        return $this->hasMany(SurveyResponse::class);
    }
}
