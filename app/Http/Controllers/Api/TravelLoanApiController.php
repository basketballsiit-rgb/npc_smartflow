<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TravelLoan;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
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

            $existingLoan = TravelLoan::where('travel_id', $travelId)->first();
            $loanStatus = ($existingLoan && !in_array($existingLoan->loan_status, ['pending', 'pending_plan'])) 
                ? $existingLoan->loan_status 
                : 'pending_plan';

            $fundingSourceId = $data['fundingSourceId'] ?? ($travelDetails['fundingSourceId'] ?? null);
            if ($existingLoan && $existingLoan->funding_source_id && !$fundingSourceId) {
                $fundingSourceId = $existingLoan->funding_source_id;
            }

            // Create or update TravelLoan record
            $loan = TravelLoan::updateOrCreate(
                ['travel_id' => $travelId],
                [
                    'contract_no' => $data['contractNo'] ?? null,
                    'system_source' => $data['systemSource'] ?? 'npc_hr',
                    
                    'borrower_user_id' => $borrower['userId'] ?? null,
                    'borrower_name' => $borrower['fullName'] ?? '',
                    'borrower_line_user_id' => $borrower['lineUserId'] ?? null,
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
                    'funding_source_id' => $fundingSourceId,
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
                    'loan_status' => $loanStatus,

                    'approved_at' => $approvalInfo['approvedAt'] ?? now(),
                    'approved_by_director' => $approvalInfo['directorName'] ?? 'นายกเชษฐ์ กิ่งชนะ',
                    'approved_by_deputy' => $approvalInfo['deputyName'] ?? null,
                    'finance_checked_by' => $approvalInfo['financeHeadName'] ?? 'นางสาวดวงดาว ไชยเขียว',

                    'raw_payload' => json_encode($data, JSON_UNESCAPED_UNICODE),
                ]
            );

            // Auto-link Line User ID to user in SmartFlow if provided
            if (!empty($borrower['lineUserId']) && !empty($borrower['fullName'])) {
                $matchedUser = self::findUserByNormalizedName($borrower['fullName']);
                if ($matchedUser) {
                    $matchedUser->line_user_id = $borrower['lineUserId'];
                    $matchedUser->save();
                    Log::info("SmartFlow: Auto-linked LINE User ID for {$matchedUser->name} from travel loan {$travelId}");
                }
            }

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

    /**
     * Normalize Thai Name by stripping prefixes and whitespace
     */
    public static function normalizeThaiName(string $name): string
    {
        // Strip zero-width characters and spaces
        $clean = preg_replace('/[\x{200B}-\x{200D}\x{FEFF}]/u', '', $name);
        $clean = trim(preg_replace('/\s+/u', ' ', $clean));
        $noSpaces = preg_replace('/\s+/u', '', $clean);

        // Common Thai prefixes (ordered longest first to prevent partial cut)
        $prefixes = [
            'ว่าที่ร้อยตรีหญิง', 'ว่าที่ ร้อยตรี หญิง', 'ว่าที่ ร.ต. หญิง', 'ว่าที่ ร.ต.หญิง', 'ว่าที่ร.ต.หญิง',
            'ว่าที่ร้อยตรี', 'ว่าที่ ร้อยตรี', 'ว่าที่ ร.ต.', 'ว่าที่ร.ต.',
            'ศาสตราจารย์ ดร.', 'ศ.ดร.', 'รองศาสตราจารย์ ดร.', 'รศ.ดร.', 'ผู้ช่วยศาสตราจารย์ ดร.', 'ผศ.ดร.',
            'ศาสตราจารย์', 'ศ.', 'รองศาสตราจารย์', 'รศ.', 'ผู้ช่วยศาสตราจารย์', 'ผศ.',
            'นางสาว', 'น.ส.', 'นาง', 'นาย',
            'ดร.', 'อาจารย์', 'อ.'
        ];

        foreach ($prefixes as $prefix) {
            $prefixNoSpaces = preg_replace('/\s+/u', '', $prefix);
            if (mb_strpos($noSpaces, $prefixNoSpaces) === 0) {
                $noSpaces = mb_substr($noSpaces, mb_strlen($prefixNoSpaces));
                break;
            }
        }

        return trim($noSpaces);
    }

    /**
     * Find user in smartflow matching normalized name
     */
    public static function findUserByNormalizedName(string $fullName): ?User
    {
        if (empty(trim($fullName))) {
            return null;
        }

        $cleanTarget = preg_replace('/\s+/u', '', $fullName);
        $normTarget = self::normalizeThaiName($fullName);

        $users = User::all();

        // 1. Exact match
        foreach ($users as $user) {
            if ($user->name === $fullName) {
                return $user;
            }
        }

        // 2. Exact match without whitespace
        foreach ($users as $user) {
            $userNoSpace = preg_replace('/\s+/u', '', $user->name);
            if ($userNoSpace === $cleanTarget) {
                return $user;
            }
        }

        // 3. Normalized match (stripping prefixes like นาย, นาง, นางสาว, etc.)
        foreach ($users as $user) {
            $userNorm = self::normalizeThaiName($user->name);
            if (!empty($userNorm) && !empty($normTarget) && $userNorm === $normTarget) {
                return $user;
            }
        }

        return null;
    }

    /**
     * Sync single user Line User ID from npc_eleve on login or bind
     * POST /api/v1/users/sync-line-user
     */
    public function syncLineUser(Request $request)
    {
        if (!$this->verifyToken($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Invalid API Token',
            ], 401);
        }

        $validator = Validator::make($request->all(), [
            'fullName' => 'required|string',
            'lineUserId' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'ข้อมูลไม่ครบถ้วน',
                'errors' => $validator->errors(),
            ], 422);
        }

        $fullName = $request->input('fullName');
        $lineUserId = $request->input('lineUserId');

        $matchedUser = self::findUserByNormalizedName($fullName);

        if (!$matchedUser) {
            Log::warning("SmartFlow: User not found for LINE ID sync: {$fullName}");
            return response()->json([
                'success' => false,
                'message' => "ไม่พบผู้ใช้ที่ชื่อ '{$fullName}' ในระบบ SmartFlow (เปรียบเทียบทั้งแบบมี/ไม่มีคำนำหน้า)",
                'searchedName' => $fullName,
                'normalizedName' => self::normalizeThaiName($fullName),
            ], 404);
        }

        $matchedUser->line_user_id = $lineUserId;
        $matchedUser->save();

        Log::info("SmartFlow: Successfully updated line_user_id for {$matchedUser->name} ({$matchedUser->email}) -> {$lineUserId}");

        return response()->json([
            'success' => true,
            'message' => "บันทึก LineUserID ให้กับผู้ใช้ '{$matchedUser->name}' เรียบร้อยแล้ว",
            'data' => [
                'userId' => $matchedUser->id,
                'name' => $matchedUser->name,
                'email' => $matchedUser->email,
                'lineUserId' => $matchedUser->line_user_id,
                'updatedAt' => now()->toIso8601String(),
            ],
        ]);
    }

    /**
     * Bulk Sync all Line User IDs from npc_eleve
     * POST /api/v1/users/bulk-sync-line-users
     */
    public function bulkSyncLineUsers(Request $request)
    {
        if (!$this->verifyToken($request)) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized: Invalid API Token',
            ], 401);
        }

        $usersList = $request->input('users', []);
        if (!is_array($usersList) || empty($usersList)) {
            return response()->json([
                'success' => false,
                'message' => 'ไม่พบรายการผู้ใช้ที่ต้องการซิงค์',
            ], 422);
        }

        $matched = 0;
        $unmatched = 0;
        $details = [];

        foreach ($usersList as $item) {
            $name = $item['fullName'] ?? $item['name'] ?? null;
            $lineId = $item['lineUserId'] ?? null;

            if (!$name || !$lineId) {
                continue;
            }

            $user = self::findUserByNormalizedName($name);
            if ($user) {
                $user->line_user_id = $lineId;
                $user->save();
                $matched++;
                $details[] = [
                    'sourceName' => $name,
                    'matchedName' => $user->name,
                    'status' => 'synced',
                ];
            } else {
                $unmatched++;
                $details[] = [
                    'sourceName' => $name,
                    'status' => 'not_found',
                ];
            }
        }

        return response()->json([
            'success' => true,
            'message' => "ซิงค์ข้อมูล LineUserID เรียบร้อยแล้ว (ตรงกัน: {$matched}, ไม่พบ: {$unmatched})",
            'matchedCount' => $matched,
            'unmatchedCount' => $unmatched,
            'details' => $details,
        ]);
    }

    /**
     * Fetch Line User ID from npc_eleve API and update user in SmartFlow
     */
    public static function fetchAndSyncUserLineId(User $user, ?string $username = null): ?string
    {
        if (!empty($user->line_user_id)) {
            return $user->line_user_id;
        }

        $apiBase = config('services.npc_eleve.api_url', 'http://127.0.0.1:5000');
        $url = rtrim($apiBase, '/') . '/api/users/lookup-line';

        $queryParams = ['name' => $user->name];
        if ($username) {
            $queryParams['username'] = $username;
        }

        try {
            Log::info("SmartFlow: Checking LineUserID from npc_eleve for {$user->name} at {$url}");
            $response = Http::timeout(3)->get($url, $queryParams);

            if ($response->successful()) {
                $data = $response->json();
                $lineId = $data['user']['lineUserId'] ?? null;
                if (!empty($lineId)) {
                    $user->line_user_id = $lineId;
                    $user->save();
                    Log::info("SmartFlow: Successfully synced line_user_id for {$user->name} from npc_eleve: {$lineId}");
                    return $lineId;
                }
            } else {
                Log::info("SmartFlow: npc_eleve lookup for {$user->name} returned status " . $response->status());
            }
        } catch (\Exception $e) {
            Log::warning("SmartFlow: Failed to query npc_eleve API for {$user->name}: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Trigger bulk sync from npc_eleve into SmartFlow
     */
    public static function pullAllLineUsersFromNpcEleve(): array
    {
        $apiBase = config('services.npc_eleve.api_url', 'http://127.0.0.1:5000');
        $url = rtrim($apiBase, '/') . '/api/smartflow/sync-all-line-users';

        try {
            $response = Http::timeout(10)->post($url);
            if ($response->successful()) {
                return $response->json();
            }
            return [
                'success' => false,
                'message' => 'HTTP ' . $response->status() . ': ' . $response->body()
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection error: ' . $e->getMessage()
            ];
        }
    }
}
