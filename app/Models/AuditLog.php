<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    public $timestamps = false;

    protected $table = 'audit_logs';

    protected $fillable = [
        'user_id',
        'action',
        'auditable_type',
        'auditable_id',
        'step_number',
        'old_values',
        'new_values',
        'notes',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'old_values' => 'array',
            'new_values' => 'array',
            'created_at' => 'datetime',
            'step_number' => 'integer',
        ];
    }

    /**
     * User who triggered this action.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Polymorphic relation to the auditable entity.
     */
    public function auditable()
    {
        return $this->morphTo();
    }

    /**
     * Helper to log an event quickly.
     */
    public static function record(
        string $action,
        ?Model $model = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $notes = null,
        ?int $stepNumber = null,
        ?int $userId = null,
        ?Model $auditable = null
    ): self {
        $targetModel = $model ?? $auditable;
        $user = auth()->user();
        $req = request();

        return self::create([
            'user_id' => $userId ?: $user?->id,
            'action' => $action,
            'auditable_type' => $targetModel ? get_class($targetModel) : null,
            'auditable_id' => $targetModel ? $targetModel->getKey() : null,
            'step_number' => $stepNumber,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'notes' => $notes,
            'ip_address' => $req ? $req->ip() : null,
            'user_agent' => $req ? substr((string)$req->userAgent(), 0, 255) : null,
            'created_at' => now(),
        ]);
    }
}
