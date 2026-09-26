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
        'signature_data',
        'signature_updated_at',
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
            'signature_data' => 'encrypted',
            'signature_updated_at' => 'datetime',
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
        if ($this->role?->name === 'plan_head') return true;

        $userPosText = ($this->position ?? '') . ' ' . $this->userPositions()->pluck('position')->implode(' ');
        
        // หากมีตำแหน่ง "รองผู้อำนวยการ" จะไม่ถือเป็นหัวหน้างานวางแผน (รองฯ จะมีขั้นตอนกำกับใน Step 5)
        if (str_contains($userPosText, 'รองผู้อำนวยการ')) {
            return false;
        }

        return $this->userPositions()
            ->where(function($q) {
                $q->where('position', 'like', '%หัวหน้างานแผน%')
                  ->orWhere('position', 'like', '%งานวางแผน%')
                  ->orWhere('sub_department_id', function($sub) {
                      $sub->select('id')->from('departments')->where('name', 'like', '%แผน%');
                  });
            })->exists() || (str_contains($this->position ?? '', 'หัวหน้างานวางแผน') || str_contains($this->position ?? '', 'หัวหน้างานแผนงาน'));
    }

    public function isPlanStaff(): bool
    {
        if ($this->isAdmin() || $this->isPlanHead()) return true;
        if ($this->role?->name === 'plan_staff') return true;
        if ($this->department && ($this->department->code === 'PLAN' || str_contains($this->department->name, 'แผน') || str_contains($this->department->name, 'ยุทธศาสตร์'))) return true;
        return str_contains($this->position ?? '', 'แผน') ||
            str_contains($this->position ?? '', 'ยุทธศาสตร์') ||
            $this->userPositions()->where(function($q) {
                $q->where('position', 'like', '%แผน%')
                  ->orWhere('position', 'like', '%ยุทธศาสตร์%')
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

    public function isProcurementStaff(): bool
    {
        if ($this->isAdmin() || $this->isProcurementHead()) return true;
        if ($this->role?->name === 'procurement_staff') return true;
        if ($this->department && ($this->department->code === 'PROC' || str_contains($this->department->name, 'พัสดุ'))) return true;
        return str_contains($this->position ?? '', 'พัสดุ') ||
            $this->userPositions()->where(function($q) {
                $q->where('position', 'like', '%พัสดุ%')
                  ->orWhere('sub_department_id', function($sub) {
                      $sub->select('id')->from('departments')->where('name', 'like', '%พัสดุ%');
                  });
            })->exists();
    }

    public function isExecutive(): bool
    {
        if ($this->role?->name === 'executive') return true;
        return $this->isDirector() || $this->isDeputyDirector();
    }

    /**
     * ผู้อำนวยการวิทยาลัยสารพัดช่างน่าน (Step 6)
     */
    public function isDirector(): bool
    {
        $userPosText = ($this->position ?? '') . ' ' . $this->userPositions()->pluck('position')->implode(' ');
        $dutiesText = $this->userPositions()->pluck('duty')->implode(' ');
        
        // ผู้อำนวยการ (ต้องไม่ใช่รองผู้อำนวยการ)
        if (str_contains($userPosText, 'ผู้อำนวยการ') && !str_contains($userPosText, 'รองผู้อำนวยการ')) {
            return true;
        }
        if (str_contains($dutiesText, 'ผู้อำนวยการ') && !str_contains($dutiesText, 'รองผู้อำนวยการ')) {
            return true;
        }

        return false;
    }

    /**
     * รองผู้อำนวยการวิทยาลัย
     */
    public function isDeputyDirector(): bool
    {
        $userPosText = ($this->position ?? '') . ' ' . $this->userPositions()->pluck('position')->implode(' ');
        $dutiesText = $this->userPositions()->pluck('duty')->implode(' ');

        return str_contains($userPosText, 'รองผู้อำนวยการ') || str_contains($dutiesText, 'รองผู้อำนวยการ');
    }

    /**
     * รองผู้อำนวยการฝ่ายยุทธศาสตร์และแผนงาน (Step 5 - นายนิพนธ์ ร่องพืช)
     */
    public function isDeputyDirectorStrategy(): bool
    {
        if (!$this->isDeputyDirector()) {
            return false;
        }

        $userPosText = ($this->position ?? '') . ' ' . $this->userPositions()->pluck('position')->implode(' ');
        $dutiesText = $this->userPositions()->pluck('duty')->implode(' ');
        $allText = $userPosText . ' ' . $dutiesText;

        if (str_contains($allText, 'ยุทธศาสตร์') || str_contains($allText, 'แผนงาน') || str_contains($allText, 'ความร่วมมือ')) {
            return true;
        }

        // ตรวจสอบฝ่ายหลักของตำแหน่ง
        $planDeptIds = \App\Models\Department::whereNull('parent_id')
            ->where(function($q) {
                $q->where('name', 'like', '%แผนงาน%')
                  ->orWhere('name', 'like', '%ยุทธศาสตร์%');
            })->pluck('id')->toArray();

        $userDeptIds = array_merge([$this->department_id], $this->userPositions()->pluck('department_id')->filter()->toArray());
        return !empty(array_intersect($planDeptIds, $userDeptIds));
    }

    /**
     * ตรวจสอบว่าเป็นรองผู้อำนวยการฝ่ายที่กำกับดูแลฝ่ายต้นสังกัดของโครงการนั้นโดยเฉพาะหรือไม่ (Step 4)
     */
    public function isDeputyDirectorForDepartment(?int $departmentId = null): bool
    {
        if (!$this->isDeputyDirector()) return false;
        if (!$departmentId) return false;

        $targetDept = \App\Models\Department::find($departmentId);
        if (!$targetDept) return false;

        // หาฝ่ายหลัก (Main Division)
        $mainDeptName = $targetDept->parent ? $targetDept->parent->name : $targetDept->name;
        $userPosText = ($this->position ?? '') . ' ' . $this->userPositions()->pluck('position')->implode(' ');
        $dutiesText = $this->userPositions()->pluck('duty')->implode(' ');
        $allText = $userPosText . ' ' . $dutiesText;

        // 1. ฝ่ายบริหารทรัพยากร
        if (str_contains($mainDeptName, 'บริหารทรัพยากร')) {
            return str_contains($allText, 'บริหารทรัพยากร') || str_contains($allText, 'บริหารทั่วไป');
        }

        // 2. ฝ่ายวิชาการ
        if (str_contains($mainDeptName, 'วิชาการ')) {
            return str_contains($allText, 'วิชาการ');
        }

        // 3. ฝ่ายพัฒนากิจการนักเรียน นักศึกษา
        if (str_contains($mainDeptName, 'กิจการนักเรียน') || str_contains($mainDeptName, 'พัฒนากิจการ')) {
            return str_contains($allText, 'กิจการนักเรียน') || str_contains($allText, 'พัฒนากิจการ') || str_contains($allText, 'พัฒนานักเรียน');
        }

        // 4. ฝ่ายยุทธศาสตร์และแผนงาน
        if (str_contains($mainDeptName, 'แผนงาน') || str_contains($mainDeptName, 'ยุทธศาสตร์')) {
            return str_contains($allText, 'แผนงาน') || str_contains($allText, 'ยุทธศาสตร์') || str_contains($allText, 'ความร่วมมือ');
        }

        // ตรวจสอบจาก ID ฝ่ายหลักของตำแหน่งใน user_positions
        $targetMainDeptId = $targetDept->parent_id ?: $targetDept->id;
        $posDeptIds = $this->userPositions()
            ->where(function($q) {
                $q->where('position', 'like', '%รองผู้อำนวยการ%')
                  ->orWhere('duty', 'like', '%รองผู้อำนวยการ%');
            })
            ->pluck('department_id')
            ->filter()
            ->toArray();

        return in_array($targetMainDeptId, $posDeptIds);
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
