<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$discounts = \App\Models\DiscountType::all();
foreach ($discounts as $d) {
    echo "ID: {$d->id} Name: {$d->name}\n";
    foreach ($d->stores as $s) {
        echo " - Store ID: {$s->store_id}\n";
    }
}
$user = \App\Models\User::first();
echo "User default store ID: {$user->default_store_id}\n";
