<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPosition extends Model
{
    protected $fillable = [
        'user_id',
        'department_id',
        'duty',
        'sub_department_id',
        'major',
        'position',
        'job_level',
        'is_primary',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'job_level'  => 'integer',
    ];

    protected static function booted()
    {
        static::saving(function ($model) {
            if (empty($model->position)) {
                $model->position = $model->formatPositionTitle();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function subDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'sub_department_id');
    }

    /**
     * Generate standard position title string based on duty, sub-department, and department
     */
    public function formatPositionTitle(): string
    {
        $dept = $this->department ?: ($this->department_id ? Department::find($this->department_id) : null);
        $subDept = $this->subDepartment ?: ($this->sub_department_id ? Department::find($this->sub_department_id) : null);

        $deptName = $dept?->name ?? '';
        $duty = $this->duty ?? '';

        if (empty($duty)) {
            return !empty($this->position) ? $this->position : 'บุคลากร';
        }

        if (in_array($duty, ['หัวหน้าสาขาวิชา', 'ครูผู้สอน'])) {
            $majorName = $this->major ?: ($subDept ? str_replace('สาขาวิชา', '', $subDept->name) : '');
            $title = "{$duty} - สาขาวิชา{$majorName}";
            if ($deptName) {
                $title .= " ({$deptName})";
            }
            return $title;
        }

        if (in_array($duty, ['หัวหน้างาน', 'เจ้าหน้าที่'])) {
            $workName = $subDept ? $subDept->name : '';
            if ($workName) {
                $title = "{$duty}{$workName}";
            } else {
                $title = "{$duty}";
            }
            if ($deptName) {
                $title .= " ({$deptName})";
            }
            return $title;
        }

        return !empty($this->position) ? $this->position : ($duty ?: 'บุคลากร');
    }
}
