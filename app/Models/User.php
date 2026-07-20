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
        'position',
        'is_active',
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

    public function isPlanHead(): bool
    {
        if ($this->role?->name === 'plan_head') return true;
        return $this->userPositions()
            ->where(function($q) {
                $q->where('position', 'like', '%หัวหน้างานแผน%')
                  ->orWhere('position', 'like', '%งานวางแผน%');
            })->exists();
    }

    public function isProcurementHead(): bool
    {
        if ($this->role?->name === 'procurement_head') return true;
        return $this->userPositions()
            ->where(function($q) {
                $q->where('position', 'like', '%หัวหน้างานพัสดุ%')
                  ->orWhere('position', 'like', '%งานพัสดุ%');
            })->exists();
    }

    public function isExecutive(): bool
    {
        if ($this->role?->name === 'executive') return true;
        return $this->userPositions()
            ->where(function($q) {
                $q->where('position', 'like', '%ผู้อำนวยการ%')
                  ->orWhere('position', 'like', '%รองผู้อำนวยการ%');
            })->exists();
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

        // ดึงจากทุกฝ่ายที่มีใน user_positions
        $positionDeptIds = $this->userPositions()
            ->whereNotNull('department_id')
            ->pluck('department_id')
            ->toArray();

        return array_unique(array_merge($ids, $positionDeptIds));
    }
}
