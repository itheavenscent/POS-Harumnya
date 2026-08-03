<?php

namespace Database\Seeders;

use App\Models\DiscountType;
use Illuminate\Database\Seeder;

/**
 * GIFT INTERNAL — diskon manual 100%.
 *
 * Dipakai untuk hadiah/sampel internal: parfum + botol (mis. 30 ml) diberikan
 * GRATIS. Kasir memilih diskon ini di modal "Tambah Diskon / Voucher"; karena
 * type=percentage value=100, seluruh isi keranjang (parfum + kemasan berbayar)
 * dipotong penuh sehingga total = 0.
 *
 * Stok bahan & botol TETAP terpotong (item bukan reward, dihitung normal oleh
 * StockDeductionService), dan pemakaian tercatat di sale_discounts + discount_usages.
 *
 * Idempotent: aman dijalankan berulang.
 */
class GiftInternalDiscountSeeder extends Seeder
{
    public function run(): void
    {
        DiscountType::updateOrCreate(
            ['code' => 'GIFT-INTERNAL'],
            [
                'name'          => 'Gift Internal',
                'type'          => 'percentage',
                'value'         => 100,
                'is_active'     => true,
                'is_combinable' => false,
                'priority'      => 0,
                'description'   => 'Hadiah internal 100% (parfum + botol gratis). Stok tetap terpotong & tercatat.',
            ],
        );
    }
}
