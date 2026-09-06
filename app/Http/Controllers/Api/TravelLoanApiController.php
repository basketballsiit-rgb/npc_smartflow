<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TravelLoan;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class TravelLoanApiController extends Controller
{
    /**
     * Verify API Token (Shared Secret / Bearer Token)
     */
    protected function verifyToken(Request $request): bool
    {
        $expectedToken = env('SMARTFLOW_API_TOKEN', 'npc_smartflow_secret_token_2026');
        $authHeader = $request->header('Authorization', '');
        
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            return hash_equals($expectedToken, $matches[1]);
        }
        
        $apiKey = $request->header('X-API-Key') ?? $request->query('api_key');
        if ($apiKey && hash_equals($expectedToken, $apiKey)) {
            return true;
        }

        return false;
    }

    /**
     * Receive / Sync Travel Loan Contract from npc_hr
     * POST /api/v1/travel-loans
     */
    public function receiveLoanContract(Request $request)
    {
        if (!$this->verifyToken($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Invalid API Token',
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'travelId' => 'required|string',
            'borrower.fullName' => 'required|string',
            'travelDetails.subject' => 'required|string',
            'travelDetails.destination' => 'required|string',
            'travelDetails.startDate' => 'required',
            'travelDetails.endDate' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'ข้อมูลไม่ครบถ้วน',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $data = $request->all();
            $travelId = $data['travelId'];

            // Extract Borrower info
            $borrower = $data['borrower'] ?? [];
            $travelDetails = $data['travelDetails'] ?? [];
            $loanBreakdown = $data['loanBreakdown'] ?? [];
            $approvalInfo = $data['approvalInfo'] ?? [];

            // Project linking if provided
            $projectId = $travelDetails['projectId'] ?? null;
            if ($projectId && !Project::where('id', $projectId)->exists()) {
                $projectId = null;
            }

            // Create or update TravelLoan record
            $loan = TravelLoan::updateOrCreate(
                ['travel_id' => $travelId],
                [
                    'contract_no' => $data['contractNo'] ?? null,
                    'system_source' => $data['systemSource'] ?? 'npc_hr',
                    
                    'borrower_user_id' => $borrower['userId'] ?? null,
                    'borrower_name' => $borrower['fullName'] ?? '',
                    'borrower_position' => $borrower['position'] ?? null,
                    'borrower_department' => $borrower['department'] ?? null,
                    'borrower_staff_type' => $borrower['staffType'] ?? null,

                    'subject' => $travelDetails['subject'] ?? '',
                    'destination' => $travelDetails['destination'] ?? '',
                    'start_date' => $travelDetails['startDate'] ?? now()->toDateString(),
                    'end_date' => $travelDetails['endDate'] ?? now()->toDateString(),
                    'total_days' => floatval($travelDetails['totalDays'] ?? 0),
                    'doc_date' => $data['docDate'] ?? null,
                    'due_date' => $data['dueDate'] ?? null,
                    'return_days' => intval($data['returnDays'] ?? 30),
                    'project_id' => $projectId,
                    'expense_type' => $travelDetails['expenseType'] ?? 'claim',

                    'allowance_amount' => floatval($loanBreakdown['allowance']['amount'] ?? 0),
                    'allowance_detail' => $loanBreakdown['allowance']['detail'] ?? null,
                    'rent_amount' => floatval($loanBreakdown['rent']['amount'] ?? 0),
                    'rent_detail' => $loanBreakdown['rent']['detail'] ?? null,
                    'vehicle_amount' => floatval($loanBreakdown['vehicle']['amount'] ?? 0),
                    'vehicle_detail' => $loanBreakdown['vehicle']['detail'] ?? null,
                    'other_amount' => floatval($loanBreakdown['otherCost']['amount'] ?? 0),
                    'other_detail' => $loanBreakdown['otherCost']['detail'] ?? null,

                    'total_loan_amount' => floatval($loanBreakdown['totalLoanAmount'] ?? ($data['totalAmount'] ?? 0)),
                    'thai_baht_text' => $loanBreakdown['thaiBahtText'] ?? null,
                    'loan_status' => 'borrowed',

                    'approved_at' => $approvalInfo['approvedAt'] ?? now(),
                    'approved_by_director' => $approvalInfo['directorName'] ?? 'นายกเชษฐ์ กิ่งชนะ',
                    'approved_by_deputy' => $approvalInfo['deputyName'] ?? null,
                    'finance_checked_by' => $approvalInfo['financeHeadName'] ?? 'นางสาวดวงดาว ไชยเขียว',

                    'raw_payload' => json_encode($data, JSON_UNESCAPED_UNICODE),
                ]
            );

            Log::info("SmartFlow: Received Travel Loan from npc_hr for travelId: {$travelId}, Total: {$loan->total_loan_amount}");

            return response()->json([
                'success' => true,
                'message' => 'บันทึกข้อมูลสัญญายืมเงินสู่ระบบ smartflow เรียบร้อยแล้ว',
                'data' => [
                    'id' => $loan->id,
                    'travelId' => $loan->travel_id,
                    'contractNo' => $loan->contract_no,
                    'borrowerName' => $loan->borrower_name,
                    'totalLoanAmount' => $loan->total_loan_amount,
                    'loanStatus' => $loan->loan_status,
                    'syncedAt' => now()->toIso8601String(),
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error("SmartFlow TravelLoanApi error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการประมวลผล: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Receive / Sync Travel Loan Clearance from npc_hr
     * POST /api/v1/travel-loans/clearance
     */
    public function receiveLoanClearance(Request $request)
    {
        if (!$this->verifyToken($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Invalid API Token',
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'travelId' => 'required|string',
            'clearanceId' => 'required|string',
            'actualExpense' => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'ข้อมูลไม่ครบถ้วน',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $travelId = $request->input('travelId');
            $loan = TravelLoan::where('travel_id', $travelId)->first();

            if (!$loan) {
                return response()->json([
                    'success' => false,
                    'message' => "ไม่พบสัญญายืมเงินสำหรับ travelId: {$travelId}",
                ], 404);
            }

            $actualExpense = floatval($request->input('actualExpense', 0));
            $refundAmount = floatval($request->input('refundAmount', 0));
            $clearanceId = $request->input('clearanceId');

            $loan->cleared_amount = $actualExpense;
            $loan->refund_amount = $refundAmount;
            $loan->clearance_ref_id = $clearanceId;
            $loan->cleared_at = now();
            $loan->loan_status = 'cleared';
            $loan->save();

            Log::info("SmartFlow: Cleared Travel Loan travelId: {$travelId}, Actual: {$actualExpense}, Refund: {$refundAmount}");

            return response()->json([
                'success' => true,
                'message' => 'บันทึกการเคลียร์เงินยืมเรียบร้อยแล้ว',
                'data' => [
                    'id' => $loan->id,
                    'travelId' => $loan->travel_id,
                    'contractNo' => $loan->contract_no,
                    'totalLoanAmount' => $loan->total_loan_amount,
                    'clearedAmount' => $loan->cleared_amount,
                    'refundAmount' => $loan->refund_amount,
                    'loanStatus' => $loan->loan_status,
                    'clearedAt' => $loan->cleared_at->toIso8601String(),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error("SmartFlow TravelLoan Clearance error: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'เกิดข้อผิดพลาดในการบันทึกเคลียร์เงิน: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * List all Travel Loans
     * GET /api/v1/travel-loans
     */
    public function index(Request $request)
    {
        $query = TravelLoan::with('project')->latest();

        if ($request->has('status') && $request->status) {
            $query->where('loan_status', $request->status);
        }

        if ($request->has('borrower') && $request->borrower) {
            $query->where('borrower_name', 'like', '%' . $request->borrower . '%');
        }

        return response()->json([
            'success' => true,
            'data' => $query->get(),
        ]);
    }

    /**
     * Health check / ping
     * GET /api/v1/travel-loans/ping
     */
    public function ping()
    {
        return response()->json([
            'success' => true,
            'service' => 'npc_smartflow',
            'endpoint' => 'travel-loans',
            'time' => now()->toIso8601String(),
        ]);
    }
}
