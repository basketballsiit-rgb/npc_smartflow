<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $thai = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
        $arabic = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        // 1. Convert Strategy Categories
        if (Schema::hasTable('strategy_categories')) {
            $categories = DB::table('strategy_categories')->get();
            foreach ($categories as $cat) {
                $newName = str_replace($thai, $arabic, $cat->name);
                $newDesc = $cat->description ? str_replace($thai, $arabic, $cat->description) : null;
                if ($newName !== $cat->name || $newDesc !== $cat->description) {
                    DB::table('strategy_categories')->where('id', $cat->id)->update([
                        'name' => $newName,
                        'description' => $newDesc,
                    ]);
                }
            }
        }

        // 2. Convert Strategy Items
        if (Schema::hasTable('strategy_items')) {
            $items = DB::table('strategy_items')->get();
            foreach ($items as $item) {
                $newGroup = $item->group_name ? str_replace($thai, $arabic, $item->group_name) : null;
                $newName = str_replace($thai, $arabic, $item->name);
                if ($newGroup !== $item->group_name || $newName !== $item->name) {
                    DB::table('strategy_items')->where('id', $item->id)->update([
                        'group_name' => $newGroup,
                        'name' => $newName,
                    ]);
                }
            }
        }

        // 3. Convert Legacy IQA Strategies
        if (Schema::hasTable('iqa_strategies')) {
            $iqa = DB::table('iqa_strategies')->get();
            foreach ($iqa as $item) {
                $newName = str_replace($thai, $arabic, $item->name);
                if ($newName !== $item->name) {
                    DB::table('iqa_strategies')->where('id', $item->id)->update(['name' => $newName]);
                }
            }
        }

        // 4. Convert Legacy OVEC Strategies
        if (Schema::hasTable('ovec_strategies')) {
            $ovec = DB::table('ovec_strategies')->get();
            foreach ($ovec as $item) {
                $newName = str_replace($thai, $arabic, $item->name);
                if ($newName !== $item->name) {
                    DB::table('ovec_strategies')->where('id', $item->id)->update(['name' => $newName]);
                }
            }
        }

        // 5. Convert Legacy National Strategies
        if (Schema::hasTable('national_strategies')) {
            $nat = DB::table('national_strategies')->get();
            foreach ($nat as $item) {
                $newName = str_replace($thai, $arabic, $item->name);
                if ($newName !== $item->name) {
                    DB::table('national_strategies')->where('id', $item->id)->update(['name' => $newName]);
                }
            }
        }

        // 6. Convert Legacy Provincial Strategies
        if (Schema::hasTable('provincial_strategies')) {
            $prov = DB::table('provincial_strategies')->get();
            foreach ($prov as $item) {
                $newName = str_replace($thai, $arabic, $item->name);
                if ($newName !== $item->name) {
                    DB::table('provincial_strategies')->where('id', $item->id)->update(['name' => $newName]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse Arabic back to Thai
    }
};
