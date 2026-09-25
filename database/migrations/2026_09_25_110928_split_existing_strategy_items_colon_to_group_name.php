<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $items = \App\Models\StrategyItem::all();
        foreach ($items as $item) {
            if (str_contains($item->name, ' : ')) {
                $parts = explode(' : ', $item->name, 2);
                $item->group_name = trim($parts[0]);
                $item->name = trim($parts[1]);
                $item->save();
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $items = \App\Models\StrategyItem::whereNotNull('group_name')->get();
        foreach ($items as $item) {
            $item->name = $item->group_name . ' : ' . $item->name;
            $item->group_name = null;
            $item->save();
        }
    }
};
