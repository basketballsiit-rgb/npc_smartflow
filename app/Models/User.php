<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'department_id',
        'citizen_id',
        'position',
        'is_active',
        'line_user_id',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'citizen_id' => 'encrypted',
        ];
    }

    /**
     * Get the role associated with the user.
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Get the department associated with the user.
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get all positions/departments associated with the user (from npcjob sync).
     */
    public function userPositions()
    {
        return $this->hasMany(UserPosition::class)->with('department')->orderBy('is_primary', 'desc')->orderBy('job_level');
    }

    /**
     * Get the projects proposed by the user.
     */
    public function projects()
    {
        return $this->hasMany(Project::class);
    }

    /**
     * Get the approvals performed by the user.
     */
    public function approvals()
    {
        return $this->hasMany(ProjectApproval::class);
    }

    /**
     * Role-checking helper methods.
     */
    public function isAdmin(): bool
    {
        return $this->role?->name === 'admin';
    }

    public function isTeacher(): bool
    {
        return $this->role?->name === 'teacher';
    }

    public function isDepartmentHead(?int $departmentId = null): bool
    {
        if ($this->isAdmin()) return true;
        if ($this->role?->name === 'department_head') return true;

        $posQuery = $this->userPositions()
            ->where(function($q) {
                $q->whereIn('duty', ['หัวหน้างาน', 'หัวหน้าสาขาวิชา'])
                  ->orWhere('position', 'like', '%หัวหน้า%');
            });

        if ($departmentId) {
            // Check direct match on department_id or sub_department_id
            $targetDept = \App\Models\Department::find($departmentId);
            $parentId = $targetDept?->parent_id;

            $posQuery->where(function($q) use ($departmentId, $parentId) {
                $q->where('department_id', $departmentId)
                  ->orWhere('sub_department_id', $departmentId);
                if ($parentId) {
                    $q->orWhere('department_id', $parentId);
                }
            });
        }

        if ($posQuery->exists()) {
            return true;
        }

        if (str_contains($this->position ?? '', 'หัวหน้า')) {
            if (!$departmentId || $this->department_id === $departmentId) {
                return true;
            }
            if ($departmentId) {
                $targetDept = \App\Models\Department::find($departmentId);
                if ($targetDept && $targetDept->parent_id && $this->department_id === $targetDept->parent_id) {
                    return true;
                }
            }
        }

        return false;
    }

    public function isPlanHead(): bool
    {
        if ($this->isAdmin()) return true;
        if ($this->role?->name === 'plan_head') return true;
        return $this->userPositions()
            ->where(function($q) {
                $q->where('position', 'like', '%หัวหน้างานแผน%')
                  ->orWhere('position', 'like', '%งานวางแผน%')
                  ->orWhere('sub_department_id', function($sub) {
                      $sub->select('id')->from('departments')->where('name', 'like', '%แผน%');
                  });
            })->exists();
    }

    public function isFinanceStaff(): bool
    {
        if ($this->isAdmin()) return true;
        if ($this->role?->name === 'finance_head' || $this->role?->name === 'finance_staff') return true;
        if ($this->department && ($this->department->code === 'FIN' || str_contains($this->department->name, 'การเงิน'))) return true;
        return str_contains($this->position ?? '', 'การเงิน') ||
            $this->userPositions()->where(function($q) {
                $q->where('position', 'like', '%การเงิน%')
                  ->orWhere('sub_department_id', function($sub) {
                      $sub->select('id')->from('departments')->where('name', 'like', '%การเงิน%');
                  });
            })->exists();
    }

    public function isProcurementHead(): bool
    {
        if ($this->isAdmin()) return true;
        if ($this->role?->name === 'procurement_head') return true;
        return $this->userPositions()
            ->where(function($q) {
                $q->where('position', 'like', '%หัวหน้างานพัสดุ%')
                  ->orWhere('position', 'like', '%งานพัสดุ%')
                  ->orWhere('sub_department_id', function($sub) {
                      $sub->select('id')->from('departments')->where('name', 'like', '%พัสดุ%');
                  });
            })->exists();
    }

    public function isExecutive(): bool
    {
        if ($this->isAdmin()) return true;
        if ($this->role?->name === 'executive') return true;
        return $this->userPositions()
            ->where(function($q) {
                $q->where('position', 'like', '%ผู้อำนวยการ%')
                  ->orWhere('position', 'like', '%รองผู้อำนวยการ%');
            })->exists() || (str_contains($this->position ?? '', 'ผู้อำนวยการ') || str_contains($this->position ?? '', 'รองผู้อำนวยการ'));
    }

    /**
     * ตรวจสอบว่าเป็นรองผู้อำนวยการหรือผู้บริหารที่กำกับดูแลฝ่ายนั้นหรือไม่ (Step 4)
     */
    public function isExecutiveForDepartment(?int $departmentId = null): bool
    {
        if ($this->isAdmin()) return true;
        if (!$this->isExecutive()) return false;

        // ผู้อำนวยการวิทยาลัย อนุมัติได้ทุกฝ่าย
        $userPosText = ($this->position ?? '') . ' ' . $this->userPositions()->pluck('position')->implode(' ');
        if (str_contains($userPosText, 'ผู้อำนวยการวิทยาลัย') && !str_contains($userPosText, 'รองผู้อำนวยการ')) {
            return true;
        }

        if (!$departmentId) return true;

        $targetDept = \App\Models\Department::find($departmentId);
        if (!$targetDept) return true;

        // หาฝ่ายหลัก (Main Division)
        $mainDeptName = $targetDept->parent ? $targetDept->parent->name : $targetDept->name;

        // ตรวจสอบชื่อตำแหน่งรองผู้อำนวยการว่าตรงกับฝ่ายหรือไม่
        if (str_contains($mainDeptName, 'บริหารทรัพยากร') && str_contains($userPosText, 'บริหารทรัพยากร')) return true;
        if (str_contains($mainDeptName, 'วิชาการ') && str_contains($userPosText, 'วิชาการ')) return true;
        if (str_contains($mainDeptName, 'พัฒนากิจการ') && (str_contains($userPosText, 'พัฒนากิจการ') || str_contains($userPosText, 'พัฒนานักเรียน'))) return true;
        if ((str_contains($mainDeptName, 'แผนงาน') || str_contains($mainDeptName, 'ยุทธศาสตร์')) && (str_contains($userPosText, 'แผนงาน') || str_contains($userPosText, 'ยุทธศาสตร์'))) return true;

        // Fallback: หากเป็นผู้บริหารแต่ไม่ระบุฝ่ายเฉพาะ ให้มีสิทธิ์
        return true;
    }

    /**
     * ดึง ID ฝ่ายทั้งหมดที่ผู้ใช้รายนี้รับผิดชอบ (จากทุกตำแหน่งใน user_positions)
     */
    public function getResponsibleDepartmentIds(): array
    {
        $ids = [];

        // ถ้าเป็นแอดมินหรือหัวหน้างานแผน ให้เข้าถึงได้ทุกฝ่าย
        if ($this->isAdmin() || $this->isPlanHead()) {
            return \App\Models\Department::pluck('id')->toArray();
        }

        // ดึงจากฝ่ายหลักในตาราง users
        if ($this->department_id) {
            $ids[] = $this->department_id;
        }

        // ดึงจากทุกตำแหน่งใน user_positions (ทั้ง department_id และ sub_department_id)
        $posDeptIds = $this->userPositions()
            ->whereNotNull('department_id')
            ->pluck('department_id')
            ->toArray();
        
        $subDeptIds = $this->userPositions()
            ->whereNotNull('sub_department_id')
            ->pluck('sub_department_id')
            ->toArray();

        $merged = array_unique(array_merge($ids, $posDeptIds, $subDeptIds));

        // หากเป็นหัวหน้าฝ่ายหลัก ให้ดึงงานย่อยภายใต้ฝ่ายนั้นมารวมด้วย
        $childIds = \App\Models\Department::whereIn('parent_id', $merged)->pluck('id')->toArray();

        return array_unique(array_merge($merged, $childIds));
    }
}
