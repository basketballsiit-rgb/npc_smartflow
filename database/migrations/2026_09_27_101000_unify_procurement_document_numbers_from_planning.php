<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Procurement;

return new class extends Migration
{
    public function up(): void
    {
        $procs = Procurement::where('procurement_number', 'like', 'PR-%')->get();
        foreach ($procs as $p) {
            $year = date('Y') + 543;
            $docNo = 'ผง. ' . str_pad($p->project_id, 3, '0', STR_PAD_LEFT) . '/' . $year;
            $p->procurement_number = $docNo;
            if (empty($p->plan_procurement_doc_number)) {
                $p->plan_procurement_doc_number = $docNo;
            }
            $p->save();
        }
    }

    public function down(): void
    {
        //
    }
};
