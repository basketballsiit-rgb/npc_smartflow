<?php

namespace App\Http\Controllers;

use App\Models\Budget;
use Illuminate\Http\Request;

class BudgetController extends Controller
{
    /**
     * Clear the advance payment for a project.
     */
    public function clear(Request $request, Budget $budget)
    {
        // Only Plan Head can clear advance payments
        if (!auth()->user()->isPlanHead()) {
            abort(403, 'Unauthorized.');
        }

        $validated = $request->validate([
            'spent_amount' => 'required|numeric|min:0',
        ]);

        $budget->spent_amount = $validated['spent_amount'];
        $budget->encumbered_amount = 0; // Release encumbrance upon actual spent recording
        $budget->advance_cleared_at = now();
        $budget->save();

        return redirect()->route('dashboard')->with('message', 'Advance payment cleared successfully.');
    }
}
