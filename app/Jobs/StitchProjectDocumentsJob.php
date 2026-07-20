<?php

namespace App\Jobs;

use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class StitchProjectDocumentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $project;

    /**
     * Create a new job instance.
     */
    public function __construct(Project $project)
    {
        $this->project = $project;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("Starting document stitching job for project: " . $this->project->title);

        // Eager load everything needed
        $this->project->load(['user', 'department', 'budget.fundingSource', 'procurement.items', 'procurement.committees', 'survey.responses', 'appendices']);

        // Simulate PDF stitching processing delay
        sleep(2);

        // Prepare the text content representing the stitched document layout
        $content = "========================================================================\n";
        $content .= "                    NPC SMART FLOW - STITCHED PROJECT REPORT\n";
        $content .= "========================================================================\n\n";
        
        $content .= "1. PROJECT INFORMATION\n";
        $content .= "------------------------------------------------------------------------\n";
        $content .= "Title: " . $this->project->title . "\n";
        $content .= "Academic Year: " . $this->project->academic_year . "\n";
        $content .= "Department: " . ($this->project->department?->name ?? 'N/A') . "\n";
        $content .= "Proposer: " . ($this->project->user?->name ?? 'N/A') . "\n";
        $content .= "Estimated Budget: " . number_format($this->project->estimated_budget, 2) . " THB\n";
        $content .= "Approved At: " . ($this->project->approved_at ? $this->project->approved_at->toDateTimeString() : 'N/A') . "\n\n";

        $content .= "2. BUDGET ALLOCATION (PHASE 2 - DO)\n";
        $content .= "------------------------------------------------------------------------\n";
        if ($this->project->budget) {
            $content .= "Funding Pool: " . ($this->project->budget->fundingSource?->name ?? 'Revenue') . "\n";
            $content .= "Allocated Amount: " . number_format($this->project->budget->allocated_amount, 2) . " THB\n";
            $content .= "Spent Amount: " . number_format($this->project->budget->spent_amount, 2) . " THB\n";
            $content .= "Advance Payment: " . ($this->project->budget->is_advance_payment ? 'Yes' : 'No') . "\n";
            $content .= "Clearing Date: " . ($this->project->budget->advance_cleared_at ? $this->project->budget->advance_cleared_at->toDateTimeString() : 'Pending') . "\n";
        } else {
            $content .= "No budget details recorded.\n";
        }
        $content .= "\n";

        $content .= "3. PROCUREMENT & COMMITTEES (PHASE 2 - DO)\n";
        $content .= "------------------------------------------------------------------------\n";
        if ($this->project->procurement) {
            $content .= "Procurement ID: " . $this->project->procurement->procurement_number . "\n";
            $content .= "Roster:\n";
            foreach ($this->project->procurement->committees as $user) {
                $content .= "  - " . $user->name . " (" . ucwords($user->pivot->committee_type) . " " . ucwords($user->pivot->role) . ")\n";
            }
        } else {
            $content .= "No procurement details recorded.\n";
        }
        $content .= "\n";

        $content .= "4. SURVEY EVALUATIONS & FEEDBACK (PHASE 3 - CHECK)\n";
        $content .= "------------------------------------------------------------------------\n";
        if ($this->project->survey && $this->project->survey->responses()->count() > 0) {
            $responses = $this->project->survey->responses;
            $total = $responses->count();
            $avgQ1 = round($responses->sum('rating_q1') / $total, 2);
            $avgQ2 = round($responses->sum('rating_q2') / $total, 2);
            $avgQ3 = round($responses->sum('rating_q3') / $total, 2);
            $avgQ4 = round($responses->sum('rating_q4') / $total, 2);
            $avgQ5 = round($responses->sum('rating_q5') / $total, 2);
            $overall = round(($avgQ1 + $avgQ2 + $avgQ3 + $avgQ4 + $avgQ5) / 5, 2);
            
            $content .= "Total Responses: " . $total . "\n";
            $content .= "Averages:\n";
            $content .= "  - Q1 (Objectives Met): " . $avgQ1 . "/5.0\n";
            $content .= "  - Q2 (Appropriate Duration): " . $avgQ2 . "/5.0\n";
            $content .= "  - Q3 (Facilities): " . $avgQ3 . "/5.0\n";
            $content .= "  - Q4 (Materials): " . $avgQ4 . "/5.0\n";
            $content .= "  - Q5 (Practical Utility): " . $avgQ5 . "/5.0\n";
            $content .= "Overall Rating Score: " . $overall . "/5.0 (" . round(($overall / 5) * 100, 1) . "% Satisfaction)\n\n";

            $content .= "Qualitative Suggestions:\n";
            foreach ($responses->whereNotNull('comments') as $resp) {
                $content .= "  - \"" . $resp->comments . "\"\n";
            }
        } else {
            $content .= "No survey evaluations submitted.\n";
        }
        $content .= "\n";

        $content .= "5. AI ACT RECOMMENDATIONS (PHASE 4 - ACT)\n";
        $content .= "------------------------------------------------------------------------\n";
        if ($this->project->survey && $this->project->survey->act_recommendation) {
            $content .= $this->project->survey->act_recommendation . "\n";
        } else {
            $content .= "No AI ACT recommendations generated yet.\n";
        }
        $content .= "\n";

        $content .= "6. APPENDICES & ATTACHMENTS (STITCHED)\n";
        $content .= "------------------------------------------------------------------------\n";
        if ($this->project->appendices->count() > 0) {
            foreach ($this->project->appendices as $index => $app) {
                $content .= "  - Appendix #" . ($index + 1) . ": " . $app->title . " (File: " . $app->file_path . ", Size: " . number_format($app->file_size) . " bytes)\n";
            }
        } else {
            $content .= "No appendices uploaded.\n";
        }

        // Save report to public disk as simulated stitched PDF/report
        Storage::disk('public')->put("reports/project_{$this->project->id}_report.pdf", $content);

        Log::info("Document stitching completed for project: " . $this->project->title);
    }
}
