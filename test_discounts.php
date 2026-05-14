<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$storeId = \App\Models\Store::first()->id;

$discounts = \App\Models\DiscountType::where('is_active', true)
    ->where(fn($q) => $q->whereNull('start_date')
        ->orWhereDate('start_date', '<=', today()))
    ->where(fn($q) => $q->whereNull('end_date')
        ->orWhereDate('end_date', '>=', today()))
    ->where(fn($q) => $q->whereDoesntHave('stores')
        ->orWhereHas('stores', fn($sq) => $sq->where('store_id', $storeId)))
    ->with(['requirements', 'applicabilities'])
    ->orderByDesc('priority')
    ->get([
        'id',
        'name',
        'code',
        'type',
        'value',
        'description',
        'min_purchase_amount',
        'min_purchase_quantity',
        'max_discount_amount',
        'buy_quantity',
        'get_quantity',
        'get_product_type',
        'is_game_reward',
        'is_combinable',
        'priority',
    ]);

echo json_encode($discounts);
