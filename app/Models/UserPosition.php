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
        $deptName = $this->department?->name ?? '';
        $subName = $this->subDepartment?->name ?? ($this->major ? "สาขาวิชา{$this->major}" : '');
        $duty = $this->duty ?? '';

        if (empty($duty)) {
            return $this->position ?: 'บุคลากร';
        }

        if (in_array($duty, ['หัวหน้าสาขาวิชา', 'ครูผู้สอน'])) {
            $majorName = $this->major ?: ($this->subDepartment ? str_replace('สาขาวิชา', '', $this->subDepartment->name) : '');
            $title = "{$duty} - สาขาวิชา{$majorName}";
            if ($deptName) {
                $title .= " ({$deptName})";
            }
            return $title;
        }

        if (in_array($duty, ['หัวหน้างาน', 'เจ้าหน้าที่'])) {
            $workName = $this->subDepartment ? $this->subDepartment->name : '';
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

        return $this->position ?: $duty;
    }
}
