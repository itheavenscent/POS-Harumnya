<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$discounts = \App\Models\DiscountType::all();
echo "Count: " . $discounts->count() . "\n";
foreach ($discounts as $d) {
    echo "ID: {$d->id}\n";
    echo "Name: {$d->name}\n";
    echo "Active: {$d->is_active}\n";
    echo "Stores count: " . $d->stores()->count() . "\n";
    echo "Start: {$d->start_date}\n";
    echo "End: {$d->end_date}\n";
}
