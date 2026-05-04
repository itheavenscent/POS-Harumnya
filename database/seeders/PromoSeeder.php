<?php

namespace Database\Seeders;

use App\Models\DiscountType;
use App\Models\DiscountRequirement;
use App\Models\Size;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PromoSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Ambil ID Size yang dibutuhkan
        $size30  = Size::where('volume_ml', 30)->first();
        $size50  = Size::where('volume_ml', 50)->first();
        $size100 = Size::where('volume_ml', 100)->first();

        if (!$size30 || !$size50 || !$size100) {
            $this->command->error('Master data Size (30ml, 50ml, 100ml) tidak ditemukan. Jalankan IntensitySeeder dulu.');
            return;
        }

        // 2. Buat Promo Spin Wheel
        $promo = DiscountType::updateOrCreate(
            ['code' => 'PROMO-SPIN-WHEEL'],
            [
                'name' => 'Spin Wheel Reward',
                'type' => 'game_reward',
                'is_active' => true,
                'description' => 'Hadiah Spin Wheel untuk pembelian jumlah tertentu.',
                'terms_conditions' => [
                    'Beli 3 botol 30 mL',
                    'ATAU Beli 2 botol 50 mL',
                    'ATAU Beli 1 botol 100 mL',
                ],
                'is_game_reward' => true,
                'game_probability' => 100, // Selalu muncul jika syarat terpenuhi
            ]
        );

        // Bersihkan requirement lama jika ada (untuk re-run seeder)
        $promo->requirements()->delete();

        // 3. Tambahkan Syarat (Grouped by group_key sebagai "ATAU")
        
        // Group A: 3x 30ml
        DiscountRequirement::create([
            'discount_type_id' => $promo->id,
            'size_id' => $size30->id,
            'required_quantity' => 3,
            'matching_mode' => 'any', // Varian apa saja asal size ini
            'group_key' => 'condition_30ml',
        ]);

        // Group B: 2x 50ml
        DiscountRequirement::create([
            'discount_type_id' => $promo->id,
            'size_id' => $size50->id,
            'required_quantity' => 2,
            'matching_mode' => 'any',
            'group_key' => 'condition_50ml',
        ]);

        // Group C: 1x 100ml
        DiscountRequirement::create([
            'discount_type_id' => $promo->id,
            'size_id' => $size100->id,
            'required_quantity' => 1,
            'matching_mode' => 'any',
            'group_key' => 'condition_100ml',
        ]);

        $this->command->info('✓ Promo Spin Wheel berhasil disetup.');
    }
}
