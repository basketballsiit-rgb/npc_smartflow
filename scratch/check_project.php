<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$projects = DB::table('projects')->get();
foreach ($projects as $p) {
    echo "ID: {$p->id}, Title: {$p->title}, Status: {$p->status}\n";
}
