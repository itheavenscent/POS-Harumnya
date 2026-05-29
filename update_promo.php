<?php 
$dt = \App\Models\DiscountType::where('code', 'POIN-MEMBER')->first(); 
if ($dt) { 
    $dt->min_purchase_amount = 25000; 
    $dt->description = 'Program loyalitas: setiap transaksi Rp 25.000 = 1 Poin. Kumpulkan 30 Poin, tukarkan dengan Free parfum P30 EDT + Botol.'; 
    $dt->save(); 
    echo 'Updated'; 
}
