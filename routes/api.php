<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\TravelLoanApiController;

/*
|--------------------------------------------------------------------------
| API Routes for NPC SmartFlow
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {
    // Travel Loan Integration Routes from npc_hr
    Route::get('/travel-loans/ping', [TravelLoanApiController::class, 'ping']);
    Route::get('/travel-loans', [TravelLoanApiController::class, 'index']);
    Route::post('/travel-loans', [TravelLoanApiController::class, 'receiveLoanContract']);
    Route::post('/travel-loans/clearance', [TravelLoanApiController::class, 'receiveLoanClearance']);

    // User Line ID Sync Routes from npc_hr
    Route::post('/users/sync-line-user', [TravelLoanApiController::class, 'syncLineUser']);
    Route::post('/users/bulk-sync-line-users', [TravelLoanApiController::class, 'bulkSyncLineUsers']);
});
