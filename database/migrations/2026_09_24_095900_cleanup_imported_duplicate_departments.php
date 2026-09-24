<?php

use Illuminate\Database\Migrations\Migration;
use App\Http\Controllers\AdminController;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        AdminController::cleanupDuplicateDepartments();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reverse needed for cleanup
    }
};
