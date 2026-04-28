<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * DISCOUNT SEEDER
 * ===============================================================
 * Sumber: Sheet "PROMO" — Varian_Harumnya.xlsx
 *
 * 2 Program Promo resmi dari Excel:
 *
 *   1. SPIN WHEEL (game_reward)
 *      Syarat:
 *        a. Beli >= 3 botol P30 (semua intensitas & varian)
 *        b. Beli >= 2 botol P50 (semua intensitas & varian)
 *        c. Beli >= 1 botol P100 (semua intensitas & varian)
 *      Reward : 1x spin Spin Wheel
 *      Hadiah spin: P30 EDT pilih varian + Botol, atau P10 EDT pilih varian + Botol Spray
 *
 *   2. POIN MEMBER (percentage / loyalty)
 *      Akumulasi: Rp 10.000 = 1 Poin
 *      Redeem   : 30 Poin → 1 Parfum P30 EDT + Botol (gratis)
 * ===============================================================
 */
class DiscountSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // ── Guard: master data ─────────────────────────────────────────────────
        $size100 = DB::table('sizes')->where('volume_ml', 100)->first();
        $size50  = DB::table('sizes')->where('volume_ml', 50)->first();
        $size30  = DB::table('sizes')->where('volume_ml', 30)->first();
        $intEDT  = DB::table('intensities')->where('code', 'EDT')->first();
        $intEDP  = DB::table('intensities')->where('code', 'EDP')->first();
        $intEXT  = DB::table('intensities')->where('code', 'EXT')->first();

        if (!$size100 || !$size50 || !$size30 || !$intEDT) {
            $this->command->error('Master data sizes/intensities belum ada. Jalankan IntensitySeeder terlebih dahulu.');
            return;
        }

        $s100 = $size100->id;
        $s50  = $size50->id;
        $s30  = $size30->id;
        $edt  = $intEDT->id;

        // ── Guard: idempotent ─────────────────────────────────────────────────
        $existing = DB::table('discount_types')
            ->whereIn('code', ['SPINWHEEL', 'POIN-MEMBER'])
            ->count();

        if ($existing > 0) {
            $this->command->warn('DiscountSeeder: data sudah ada, skip.');
            return;
        }

        DB::beginTransaction();

        try {
            // ==================================================================
            // 1. SPIN WHEEL
            // ==================================================================
            $dtSpin = Str::uuid()->toString();

            DB::table('discount_types')->insert([
                'id'                    => $dtSpin,
                'code'                  => 'SPINWHEEL',
                'name'                  => 'Spin Wheel',
                'type'                  => 'game_reward',
                'value'                 => 0.00,
                'buy_quantity'          => 1,
                'get_quantity'          => 1,
                'get_product_type'      => 'choose_from_pool',
                'min_purchase_amount'   => null,
                'min_purchase_quantity' => null,
                'max_discount_amount'   => null,
                'start_date'            => null,
                'end_date'              => null,
                'start_time'            => null,
                'end_time'              => null,
                'is_game_reward'        => true,
                'game_probability'      => 100,
                'priority'              => 10,
                'is_combinable'         => false,
                'is_active'             => true,
                'description'           => 'Gratis 1x Spin Wheel untuk setiap: beli ≥3 botol P30, atau ≥2 botol P50, atau ≥1 botol P100 (semua intensitas & varian). Hadiah: P30 EDT (pilih varian + botol) atau P10 EDT (pilih varian + botol spray).',
                'terms_conditions'      => json_encode([
                    'Syarat: beli ≥3 botol P30 ATAU ≥2 botol P50 ATAU ≥1 botol P100',
                    'Berlaku semua intensitas (EDT/EDP/EXT) dan semua varian',
                    'Gratis 1x spin Spin Wheel per transaksi yang memenuhi syarat',
                    'Hadiah spin: P30 EDT pilih varian + Botol, atau P10 EDT pilih varian + Botol Spray',
                    'Hadiah tidak dapat ditukar uang tunai',
                ]),
                'created_at'            => $now,
                'updated_at'            => $now,
            ]);

            // Applicabilities: P30 (≥3), P50 (≥2), P100 (≥1)
            $applicabilities = [
                ['size_id' => $s30,  'intensity_id' => null],
                ['size_id' => $s50,  'intensity_id' => null],
                ['size_id' => $s100, 'intensity_id' => null],
            ];
            foreach ($applicabilities as $app) {
                DB::table('discount_applicabilities')->insert([
                    'id'               => Str::uuid(),
                    'discount_type_id' => $dtSpin,
                    'variant_id'       => null,
                    'intensity_id'     => $app['intensity_id'],
                    'size_id'          => $app['size_id'],
                    'created_at'       => $now,
                    'updated_at'       => $now,
                ]);
            }

            // Requirements — pakai group_key berbeda per syarat (OR antar group)
            $requirements = [
                ['size_id' => $s30,  'qty' => 3, 'group' => 'P30-3PCS'],
                ['size_id' => $s50,  'qty' => 2, 'group' => 'P50-2PCS'],
                ['size_id' => $s100, 'qty' => 1, 'group' => 'P100-1PCS'],
            ];
            foreach ($requirements as $req) {
                DB::table('discount_requirements')->insert([
                    'id'                => Str::uuid(),
                    'discount_type_id'  => $dtSpin,
                    'variant_id'        => null,
                    'intensity_id'      => null,
                    'size_id'           => $req['size_id'],
                    'required_quantity' => $req['qty'],
                    'matching_mode'     => 'all',
                    'group_key'         => $req['group'],
                    'created_at'        => $now,
                    'updated_at'        => $now,
                ]);
            }

            // Reward pool (spin wheel items)
            $rwSpin = Str::uuid()->toString();
            DB::table('discount_rewards')->insert([
                'id'                  => $rwSpin,
                'discount_type_id'    => $dtSpin,
                'variant_id'          => null,
                'intensity_id'        => null,
                'size_id'             => null,
                'reward_quantity'     => 1,
                'customer_can_choose' => true,  // customer pilih varian
                'is_pool'             => true,
                'max_choices'         => 1,
                'discount_percentage' => 100.00,
                'fixed_price'         => null,
                'priority'            => 1,
                'created_at'          => $now,
                'updated_at'          => $now,
            ]);

            // Pool items: P30 EDT pilih varian + Botol (50%), P10 EDT pilih varian + Botol Spray (50%)
            $spinItems = [
                ['label' => 'P30 EDT (Pilih Varian + Botol)',        'probability' => 50, 'sort_order' => 1],
                ['label' => 'P10 EDT (Pilih Varian + Botol Spray)',  'probability' => 50, 'sort_order' => 2],
            ];
            foreach ($spinItems as $item) {
                DB::table('discount_reward_pools')->insert([
                    'id'                 => Str::uuid(),
                    'discount_reward_id' => $rwSpin,
                    'product_id'         => null,
                    'variant_id'         => null,
                    'intensity_id'       => $edt,
                    'size_id'            => $item['sort_order'] === 1 ? $s30 : null, // P10 belum ada di sizes
                    'label'              => $item['label'],
                    'image_url'          => null,
                    'fixed_price'        => 0.00,
                    'probability'        => $item['probability'],
                    'is_active'          => true,
                    'sort_order'         => $item['sort_order'],
                    'created_at'         => $now,
                    'updated_at'         => $now,
                ]);
            }

            // Berlaku di semua toko
            DB::table('discount_stores')->insert([
                'id'               => Str::uuid(),
                'discount_type_id' => $dtSpin,
                'store_id'         => null,
                'created_at'       => $now,
                'updated_at'       => $now,
            ]);

            $this->command->line('  [1/2] Spin Wheel seeded');

            // ==================================================================
            // 2. POIN MEMBER
            //    - Setiap kelipatan Rp 10.000 → +1 Poin
            //    - 30 Poin → gratis 1 Parfum P30 EDT + Botol
            // ==================================================================
            $dtPoin = Str::uuid()->toString();

            DB::table('discount_types')->insert([
                'id'                    => $dtPoin,
                'code'                  => 'POIN-MEMBER',
                'name'                  => 'Poin Member',
                'type'                  => 'buy_x_get_y',   // loyalty redemption
                'value'                 => 0.00,
                'buy_quantity'          => null,
                'get_quantity'          => 1,
                'get_product_type'      => 'specific',
                'min_purchase_amount'   => 10000.00,         // per Rp 10.000 = 1 Poin
                'min_purchase_quantity' => null,
                'max_discount_amount'   => null,
                'start_date'            => null,
                'end_date'              => null,
                'start_time'            => null,
                'end_time'              => null,
                'is_game_reward'        => false,
                'game_probability'      => null,
                'priority'              => 5,
                'is_combinable'         => true,              // poin bisa dipakai bersamaan dengan promo lain
                'is_active'             => true,
                'description'           => 'Program loyalitas: setiap transaksi Rp 10.000 = 1 Poin. Kumpulkan 30 Poin, tukarkan dengan 1 Parfum P30 EDT + Botol gratis (pilih varian).',
                'terms_conditions'      => json_encode([
                    'Setiap kelipatan Rp 10.000 dalam satu transaksi mendapat 1 Poin',
                    'Akumulasi 30 Poin dapat ditukar 1 Parfum P30 EDT + Botol (gratis)',
                    'Customer dapat memilih varian parfum P30 EDT',
                    'Penukaran poin dilakukan di kasir — tunjukkan kartu/aplikasi member',
                    'Poin tidak dapat ditukar uang tunai',
                    'Poin hangus jika tidak digunakan dalam 12 bulan',
                ]),
                'created_at'            => $now,
                'updated_at'            => $now,
            ]);

            // Applicability: berlaku untuk semua produk (semua size/intensity/variant)
            DB::table('discount_applicabilities')->insert([
                'id'               => Str::uuid(),
                'discount_type_id' => $dtPoin,
                'variant_id'       => null,
                'intensity_id'     => null,
                'size_id'          => null,  // null = semua ukuran
                'created_at'       => $now,
                'updated_at'       => $now,
            ]);

            // Reward: 1x P30 EDT (customer pilih varian)
            DB::table('discount_rewards')->insert([
                'id'                  => Str::uuid(),
                'discount_type_id'    => $dtPoin,
                'variant_id'          => null,
                'intensity_id'        => $edt,
                'size_id'             => $s30,
                'reward_quantity'     => 1,
                'customer_can_choose' => true,  // customer pilih varian
                'is_pool'             => false,
                'max_choices'         => null,
                'discount_percentage' => 100.00,
                'fixed_price'         => null,
                'priority'            => 1,
                'created_at'          => $now,
                'updated_at'          => $now,
            ]);

            // Berlaku di semua toko
            DB::table('discount_stores')->insert([
                'id'               => Str::uuid(),
                'discount_type_id' => $dtPoin,
                'store_id'         => null,
                'created_at'       => $now,
                'updated_at'       => $now,
            ]);

            $this->command->line('  [2/2] Poin Member seeded');

            DB::commit();

            $this->command->info('');
            $this->command->info('✓ DiscountSeeder selesai — 2 program promo (Spin Wheel + Poin Member).');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Seeding gagal: ' . $e->getMessage());
            throw $e;
        }
    }
}
