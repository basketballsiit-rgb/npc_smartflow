<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $projects = DB::table('projects')->get();

        foreach ($projects as $project) {
            $procurement = DB::table('procurements')->where('project_id', $project->id)->first();
            if (!$procurement) {
                continue;
            }

            $activities = json_decode($project->activities ?? '[]', true);
            $actualProcurementItems = [];

            if (is_array($activities) && count($activities) > 0) {
                foreach ($activities as $actIdx => $act) {
                    $actLabel = '[กิจกรรมที่ ' . ($actIdx + 1) . ']';
                    $pItems = $act['procurement_items'] ?? [];
                    if (is_array($pItems)) {
                        foreach ($pItems as $it) {
                            if (!empty($it['description']) && trim($it['description']) !== '') {
                                $qty = floatval($it['quantity'] ?? 1);
                                $unitPrice = floatval($it['unit_price'] ?? 0);
                                $actualProcurementItems[] = [
                                    'procurement_id' => $procurement->id,
                                    'description' => $actLabel . ' ' . trim($it['description']),
                                    'quantity' => $qty,
                                    'unit' => $it['unit'] ?? 'รายการ',
                                    'unit_price' => $unitPrice,
                                    'total_price' => $qty * $unitPrice,
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ];
                            }
                        }
                    }
                }
            }

            if (count($actualProcurementItems) > 0) {
                // Replace procurement_items with only genuine procurement items (excluding loan items)
                DB::table('procurement_items')->where('procurement_id', $procurement->id)->delete();
                DB::table('procurement_items')->insert($actualProcurementItems);
            } else {
                // If activities had no explicit procurement_items, filter out known loan keywords from existing items
                $loanKeywords = ['ค่าตอบแทน', 'วิทยากร', 'ค่าอาหาร', 'อาหารกลางวัน', 'อาหารว่าง', 'เครื่องดื่ม', 'เดินทาง', 'พาหนะ', 'ยานพาหนะ', 'เบี้ยเลี้ยง', 'ที่พัก', 'สมนาคุณ', 'เงินยืม'];
                foreach ($loanKeywords as $kw) {
                    DB::table('procurement_items')
                        ->where('procurement_id', $procurement->id)
                        ->where('description', 'LIKE', '%' . $kw . '%')
                        ->delete();
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reverse needed
    }
};
