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
        // Sanitize any malformed non-UTF8 strings in user_positions
        if (DB::getSchemaBuilder()->hasTable('user_positions')) {
            $positions = DB::table('user_positions')->get();
            foreach ($positions as $p) {
                $updates = [];
                if (isset($p->duty) && !mb_check_encoding($p->duty, 'UTF-8')) {
                    $cleaned = mb_convert_encoding($p->duty, 'UTF-8', 'ISO-8859-1');
                    $updates['duty'] = mb_check_encoding($cleaned, 'UTF-8') ? $cleaned : 'บุคลากร';
                }
                if (isset($p->position) && !mb_check_encoding($p->position, 'UTF-8')) {
                    $cleaned = mb_convert_encoding($p->position, 'UTF-8', 'ISO-8859-1');
                    $updates['position'] = mb_check_encoding($cleaned, 'UTF-8') ? $cleaned : 'บุคลากร';
                }
                if (!empty($updates)) {
                    DB::table('user_positions')->where('id', $p->id)->update($updates);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No reversal needed
    }
};
