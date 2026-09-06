<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TravelLoan extends Model
{
    use HasFactory;

    protected $table = 'travel_loans';

    protected $fillable = [
        'travel_id',
        'contract_no',
        'system_source',
        'borrower_user_id',
        'borrower_name',
        'borrower_position',
        'borrower_department',
        'borrower_staff_type',
        'subject',
        'destination',
        'start_date',
        'end_date',
        'total_days',
        'doc_date',
        'due_date',
        'return_days',
        'project_id',
        'expense_type',
        'allowance_amount',
        'allowance_detail',
        'rent_amount',
        'rent_detail',
        'vehicle_amount',
        'vehicle_detail',
        'other_amount',
        'other_detail',
        'total_loan_amount',
        'thai_baht_text',
        'loan_status',
        'cleared_amount',
        'refund_amount',
        'cleared_at',
        'clearance_ref_id',
        'approved_at',
        'approved_by_director',
        'approved_by_deputy',
        'finance_checked_by',
        'raw_payload',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'doc_date' => 'date',
        'due_date' => 'date',
        'total_days' => 'float',
        'allowance_amount' => 'float',
        'rent_amount' => 'float',
        'vehicle_amount' => 'float',
        'other_amount' => 'float',
        'total_loan_amount' => 'float',
        'cleared_amount' => 'float',
        'refund_amount' => 'float',
        'cleared_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
