<?php
/**
 * DIAGNOSTIC Spin Wheel eligibility — jalankan: php diag_spin.php
 * Hapus file ini setelah selesai debug.
 */
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Cart;
use App\Models\DiscountType;

function line($s = '') { echo $s . PHP_EOL; }

// 1. Cari cashier+store yg punya cart aktif (hold_id null)
$grp = Cart::whereNull('hold_id')
    ->selectRaw('cashier_id, store_id, COUNT(*) c')
    ->groupBy('cashier_id', 'store_id')
    ->orderByDesc('c')
    ->first();

if (!$grp) { line('TIDAK ADA cart aktif. Isi keranjang dulu, lalu jalankan ulang.'); exit; }

$cashierId = $grp->cashier_id;
$storeId   = $grp->store_id;
line("Cashier=$cashierId  Store=$storeId  cartRows={$grp->c}");
line(str_repeat('=', 60));

$carts = Cart::with([
        'variant:id,name,code',
        'size:id,volume_ml',
        'intensity:id,code',
        'packagings.packagingMaterial:id,name,code',
    ])
    ->where('cashier_id', $cashierId)
    ->where('store_id', $storeId)
    ->whereNull('hold_id')
    ->get();

// 2. SPINWHEEL discount
$spin = DiscountType::with(['requirements.packagingMaterial:id,name,code', 'stores'])
    ->where('code', 'SPINWHEEL')->first();

if (!$spin) { line('SPINWHEEL tidak ada di discount_types. Jalankan DiscountSeeder.'); exit; }
line("SPINWHEEL id={$spin->id} is_active=" . var_export($spin->is_active, true)
    . " start={$spin->start_date} end={$spin->end_date}");

// 3. STORE FILTER
$storeRows = $spin->stores->pluck('store_id');
$passStore = $spin->stores->every(fn($s) => $s->store_id === null)
    || $spin->stores->contains('store_id', $storeId);
line("  store rows=[" . $storeRows->map(fn($v) => var_export($v, true))->implode(', ') . "]  LOLOS_STORE=" . ($passStore ? 'YA' : 'TIDAK'));
line(str_repeat('-', 60));

// 4. CART ITEMS (paid)
$paid = $carts->reject(fn($c) => $c->is_free)->values();
line('PAID CART ITEMS:');
foreach ($paid as $c) {
    line(sprintf('  qty=%d size=%sml int=%s var=%s',
        $c->qty, $c->size?->volume_ml ?? '-', $c->intensity?->code ?? '-', $c->variant?->code ?? '-'));
}

// 5. PACKAGING QTY MAP (paid only)
$pkgQty = [];
$pkgCode = [];
foreach ($carts as $c) {
    if ($c->is_free) continue;
    foreach ($c->packagings ?? [] as $p) {
        $id = $p->packaging_material_id;
        $pkgQty[$id] = ($pkgQty[$id] ?? 0) + (int) $p->qty;
        $pkgCode[$id] = $p->packagingMaterial?->code ?? '?';
    }
}
line('BOTOL DI CART (packaging_material_id => qty):');
if (!$pkgQty) line('  (KOSONG — tak ada botol nempel di item berbayar!)');
foreach ($pkgQty as $id => $q) line("  {$pkgCode[$id]} ($id) => $q");
line(str_repeat('-', 60));

// 6. GROUP MULTIPLIER (replika logic controller)
$reqMult = function ($req) use ($paid, $pkgQty) {
    $need = (int) $req->required_quantity;
    if ($need <= 0) return null;
    if ($req->packaging_material_id) {
        $qty = $pkgQty[$req->packaging_material_id] ?? 0;
        return intdiv($qty, $need);
    }
    if ($req->variant_id || $req->intensity_id || $req->size_id) {
        $qty = 0;
        foreach ($paid as $c) {
            if ($req->variant_id   && $c->variant_id   !== $req->variant_id)   continue;
            if ($req->intensity_id && $c->intensity_id !== $req->intensity_id) continue;
            if ($req->size_id      && $c->size_id      !== $req->size_id)      continue;
            $qty += (int) $c->qty;
        }
        return intdiv($qty, $need);
    }
    return null;
};

line('EVALUASI GROUP (AND dalam group, OR antar group):');
$best = 0;
foreach ($spin->requirements->groupBy('group_key') as $gk => $reqs) {
    $mult = null;
    $parts = [];
    foreach ($reqs as $r) {
        $m = $reqMult($r);
        $what = $r->packaging_material_id
            ? ('botol:' . ($r->packagingMaterial?->code ?? '?'))
            : ('parfum:size=' . ($r->size?->volume_ml ?? '-') . 'ml');
        $parts[] = "$what need={$r->required_quantity} mult=" . var_export($m, true);
        if ($m !== null) $mult = $mult === null ? $m : min($mult, $m);
    }
    $mult = $mult ?? 0;
    $best = max($best, $mult);
    line("  [$gk] " . implode(' | ', $parts) . "  => groupMult=$mult");
}
line(str_repeat('=', 60));
$verdict = ($passStore && $best > 0) ? 'ELIGIBLE' : 'TIDAK ELIGIBLE';
line("HASIL: bestMultiplier=$best  storePass=" . ($passStore ? 'YA' : 'TIDAK') . "  => $verdict");
if (!$passStore) line('SEBAB: store filter (baris discount_stores tak cocok).');
elseif ($best === 0) line('SEBAB: tak ada group terpenuhi (lihat mult=0 di atas — parfum atau botol kurang/beda).');
