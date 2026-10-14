<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoleDelegation extends Model
{
    use HasFactory;

    protected $table = 'role_delegations';

    protected $fillable = [
        'user_id',
        'delegate_user_id',
        'start_date',
        'end_date',
        'acting_position',
        'reason',
        'order_number',
        'is_active',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    /**
     * The principal user who delegated their authority (ผู้มอบอำนาจ).
     */
    public function principalUser()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Alias for principalUser.
     */
    public function delegator()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * The assigned acting/delegate user (ผู้รับมอบอำนาจ/รักษาการ).
     */
    public function delegateUser()
    {
        return $this->belongsTo(User::class, 'delegate_user_id');
    }

    /**
     * Approvals executed under this delegation.
     */
    public function approvals()
    {
        return $this->hasMany(ProjectApproval::class, 'role_delegation_id');
    }

    /**
     * Scope for currently active delegations.
     */
    public function scopeCurrentlyActive($query, ?Carbon $date = null)
    {
        $targetDate = ($date ?: Carbon::today())->toDateString();
        return $query->where('is_active', true)
            ->whereDate('start_date', '<=', $targetDate)
            ->whereDate('end_date', '>=', $targetDate);
    }

    /**
     * Check if this delegation is currently active today.
     */
    public function isEffective(?Carbon $date = null): bool
    {
        if (!$this->is_active) {
            return false;
        }

        $targetDate = ($date ?: Carbon::today())->toDateString();
        $start = $this->start_date ? Carbon::parse($this->start_date)->toDateString() : null;
        $end = $this->end_date ? Carbon::parse($this->end_date)->toDateString() : null;

        if ($start && $targetDate < $start) return false;
        if ($end && $targetDate > $end) return false;

        return true;
    }

    /**
     * Get default acting label if none is set.
     */
    public function getResolvedActingTitle(): string
    {
        if (!empty($this->acting_position)) {
            return trim($this->acting_position);
        }

        $principal = $this->principalUser;
        if (!$principal) {
            return 'รักษาการในตำแหน่ง';
        }

        $pos = $principal->position_level ?: $principal->position;
        if (!empty($pos)) {
            if (str_starts_with($pos, 'รักษาการในตำแหน่ง')) {
                return $pos;
            }
            return 'รักษาการในตำแหน่ง' . $pos;
        }

        if ($principal->isDirector()) {
            return 'รักษาการในตำแหน่งผู้อำนวยการวิทยาลัยสารพัดช่างน่าน';
        }

        if ($principal->isDeputyDirector()) {
            return 'รักษาการในตำแหน่งรองผู้อำนวยการ';
        }

        return 'รักษาการในตำแหน่ง';
    }
}
