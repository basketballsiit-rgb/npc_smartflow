<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SurveyResponse extends Model
{
    protected $table = 'survey_responses';

    protected $fillable = [
        'survey_id',
        'respondent_name',
        'respondent_type',
        'ratings',
        'rating_q1',
        'rating_q2',
        'rating_q3',
        'rating_q4',
        'rating_q5',
        'comments',
        'include_in_report',
    ];

    /**
     * Get the attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'ratings' => 'array',
            'rating_q1' => 'integer',
            'rating_q2' => 'integer',
            'rating_q3' => 'integer',
            'rating_q4' => 'integer',
            'rating_q5' => 'integer',
            'include_in_report' => 'boolean',
        ];
    }

    /**
     * Get the survey associated with this response.
     */
    public function survey()
    {
        return $this->belongsTo(Survey::class);
    }

    /**
     * Compute average rating for this specific response.
     */
    public function getAverageRatingAttribute(): float
    {
        if (is_array($this->ratings) && count($this->ratings) > 0) {
            $sum = array_sum($this->ratings);
            return round($sum / count($this->ratings), 2);
        }
        return round(($this->rating_q1 + $this->rating_q2 + $this->rating_q3 + $this->rating_q4 + $this->rating_q5) / 5.0, 2);
    }
}
