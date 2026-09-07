<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExpenseClearing extends Model
{
    use HasFactory;

    protected $table = 'expense_clearings';

    protected $fillable = [
        'clearing_number',
        'clearing_type',
        'project_id',
        'routine_budget_plan_id',
        'funding_source_id',
        'travel_loan_id',
        'procurement_id',
        'user_id',
        'claimant_name',
        'claimant_position',
        'claimant_department',
        'title',
        'expense_date',
        'loan_amount',
        'actual_spent_amount',
        'difference_amount',
        'clearing_result',
        'expense_items',
        'receipt_count',
        'receipt_reference',
        'status',
        'plan_doc_number',
        'plan_approved_at',
        'plan_approved_by',
        'plan_notes',
        'finance_doc_number',
        'finance_completed_at',
        'finance_completed_by',
        'finance_payment_ref',
        'finance_notes',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'plan_approved_at' => 'datetime',
        'finance_completed_at' => 'datetime',
        'loan_amount' => 'decimal:2',
        'actual_spent_amount' => 'decimal:2',
        'difference_amount' => 'decimal:2',
        'expense_items' => 'array',
        'receipt_count' => 'integer',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function routineBudgetPlan()
    {
        return $this->belongsTo(RoutineBudgetPlan::class);
    }

    public function fundingSource()
    {
        return $this->belongsTo(FundingSource::class);
    }

    public function travelLoan()
    {
        return $this->belongsTo(TravelLoan::class);
    }

    public function procurement()
    {
        return $this->belongsTo(Procurement::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function planApprover()
    {
        return $this->belongsTo(User::class, 'plan_approved_by');
    }

    public function financeApprover()
    {
        return $this->belongsTo(User::class, 'finance_completed_by');
    }

    /**
     * Get human-readable clearing result in Thai
     */
    public function getResultLabel(): string
    {
        return match ($this->clearing_result) {
            'refund' => 'มีเงินเหลือส่งคืนคลัง',
            'reimburse' => 'ขอเบิกจ่ายเงินเพิ่ม (จ่ายเกิน)',
            default => 'จ่ายครบพอดี (ไม่เหลือและไม่ขาด)',
        };
    }

    /**
     * Get human-readable status in Thai
     */
    public function getStatusLabel(): string
    {
        return match ($this->status) {
            'pending_plan' => 'รอแผนงานตรวจสอบและตัดยอด',
            'plan_approved' => 'แผนงานตัดยอดแล้ว (รอการเงินปิดยอด)',
            'finance_completed' => 'การเงินปิดยอดสมบูรณ์',
            'rejected' => 'ส่งกลับแก้ไข',
            default => $this->status,
        };
    }
}
