<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$tables = DB::select("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
foreach ($tables as $t) {
    $tname = $t->name;
    try {
        $rows = DB::table($tname)->get();
        foreach ($rows as $r) {
            $json = json_encode($r, JSON_UNESCAPED_UNICODE);
            if (mb_strpos($json, 'กฤตพร') !== false || mb_strpos($json, 'เวชภัณฑ์') !== false || mb_strpos($json, 'จัดหายา') !== false) {
                echo "Found in Table: $tname, ID: " . ($r->id ?? '?') . "\n";
                echo "  Data: $json\n";
            }
        }
    } catch (\Exception $e) {}
}
