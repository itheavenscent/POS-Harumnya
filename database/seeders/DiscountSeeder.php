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
        $size10  = DB::table('sizes')->where('volume_ml', 10)->first();
        $intEDT  = DB::table('intensities')->where('code', 'EDT')->first();
        $intEDP  = DB::table('intensities')->where('code', 'EDP')->first();
        $intEXT  = DB::table('intensities')->where('code', 'EXT')->first();
        $intPURE = DB::table('intensities')->where('code', 'PURE')->first();

        if (!$size100 || !$size50 || !$size30 || !$intEDT || !$intPURE) {
            $this->command->error('Master data sizes/intensities belum ada. Jalankan IntensitySeeder terlebih dahulu.');
            return;
        }

        $s100 = $size100->id;
        $s50  = $size50->id;
        $s30  = $size30->id;
        $edt  = $intEDT->id;
        $pure = $intPURE->id;

        // Botol default per ukuran (dari PackagingSeeder) — ikut otomatis
        // ke keranjang saat reward parfum diklaim.
        $botolRoll    = DB::table('packaging_materials')->where('code', 'ROLL')->value('id'); // 10 ml spray
        $botolPrisma  = DB::table('packaging_materials')->where('code', 'PRI')->value('id');  // 30 ml
        $botolOrion   = DB::table('packaging_materials')->where('code', 'OR')->value('id');   // 50 ml
        $botolPersegi = DB::table('packaging_materials')->where('code', 'PER')->value('id');  // 100 ml

        // Ensure 10 mL size exists
        if (!$size10) {
            $s10Id = Str::uuid()->toString();
            DB::table('sizes')->insert([
                'id' => $s10Id,
                'volume_ml' => 10,
                'name' => '10 mL',
                'sort_order' => 0,
                'is_active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
            $s10 = $s10Id;
        } else {
            $s10 = $size10->id;
        }

        // Clean old promo data to make it idempotent and cleanly refreshable
        DB::table('discount_usages')->delete();
        DB::table('discount_types')->whereIn('code', ['SPINWHEEL', 'POIN-MEMBER', 'BUY1GET1'])->delete();

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
                'description'           => 'Setiap pembelian parfum sesuai ketentuan gratis 1 kali spinwheel dengan hadiah (P30 EDT pilih varian + Botol, P10 EDT pilih varian + Botol Spray, atau Poin Member +1).',
                'terms_conditions'      => json_encode([
                    'Syarat: Beli 3 parfum + botol 30 mL, ATAU Beli 2 parfum + botol 50 mL, ATAU Beli 1 parfum + botol 100 mL',
                    'Berlaku untuk semua kategori produk',
                    'Gratis 1 kali spinwheel per transaksi yang memenuhi ketentuan',
                    'Hadiah: P30 EDT pilih varian + Botol, P10 EDT pilih varian + Botol Spray, atau Poin Member +1',
                    'Botol hadiah otomatis ikut ke keranjang secara gratis',
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

            // Pool items (hadiah spin) — sesuai sheet PROMO:
            //   1. P30 EDT pilih varian + Botol
            //   2. P10 EDT pilih varian + Botol Spray
            //   3. Poin Member +1
            $spinItems = [
                [
                    'label'                 => 'Parfum P30 EDT (Pilih Varian) + Botol',
                    'reward_type'           => 'variant',
                    'points_amount'         => null,
                    'intensity_id'          => $edt,
                    'size_id'               => $s30,
                    'packaging_material_id' => $botolPrisma,
                    'probability'           => 40,
                    'sort_order'            => 1
                ],
                [
                    'label'                 => 'Parfum P10 EDT (Pilih Varian) + Botol Spray',
                    'reward_type'           => 'variant',
                    'points_amount'         => null,
                    'intensity_id'          => $edt,
                    'size_id'               => $s10,
                    'packaging_material_id' => $botolRoll,
                    'probability'           => 40,
                    'sort_order'            => 2
                ],
                [
                    'label'                 => 'Poin Member +1',
                    'reward_type'           => 'points',
                    'points_amount'         => 1,
                    'intensity_id'          => null,
                    'size_id'               => null,
                    'packaging_material_id' => null,
                    'probability'           => 20,
                    'sort_order'            => 3
                ],
            ];
            foreach ($spinItems as $item) {
                DB::table('discount_reward_pools')->insert([
                    'id'                 => Str::uuid(),
                    'discount_reward_id' => $rwSpin,
                    'reward_type'        => $item['reward_type'],
                    'points_amount'      => $item['points_amount'],
                    'product_id'         => null,
                    'variant_id'         => null,
                    'intensity_id'       => $item['intensity_id'],
                    'size_id'            => $item['size_id'],
                    'packaging_material_id' => $item['packaging_material_id'],
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

            // Reward: 1x P30 EDT (customer pilih varian) + Botol Prisma otomatis
            DB::table('discount_rewards')->insert([
                'id'                  => Str::uuid(),
                'discount_type_id'    => $dtPoin,
                'variant_id'          => null,
                'intensity_id'        => $edt,
                'size_id'             => $s30,
                'packaging_material_id' => $botolPrisma,
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

            // ==================================================================
            // 3. BUY 1 GET 1 (Promo Opening)
            //    - Beli 1 P50 (All Kategori) + botol -> Free 1 P10 EDT (1:2) spray
            // ==================================================================
            $dtB1G1 = Str::uuid()->toString();

            DB::table('discount_types')->insert([
                'id'                    => $dtB1G1,
                'code'                  => 'BUY1GET1',
                'name'                  => 'Buy 1 Get 1 Free P10 Spray',
                'type'                  => 'buy_x_get_y',
                'value'                 => 0.00,
                'buy_quantity'          => 1,
                'get_quantity'          => 1,
                'get_product_type'      => 'specific',
                'min_purchase_amount'   => null,
                'min_purchase_quantity' => null,
                'max_discount_amount'   => null,
                'start_date'            => null,
                'end_date'              => null,
                'start_time'            => null,
                'end_time'              => null,
                'is_game_reward'        => false,
                'game_probability'      => null,
                'priority'              => 8,
                'is_combinable'         => false,
                'is_active'             => true,
                'description'           => 'Promo Opening Buy 1 P50 + botol (All Kategori) Free 1 P10 EDT (1:2) spray.',
                'terms_conditions'      => json_encode([
                    'Beli 1 Parfum P50 (50 mL) all category gratis 1 Parfum P10 EDT (10 mL) spray',
                    'Customer dapat memilih varian parfum P10 EDT gratis',
                    'Promo berlaku selama masa opening toko',
                ]),
                'created_at'            => $now,
                'updated_at'            => $now,
            ]);

            // Applicability: P50 (50 mL)
            DB::table('discount_applicabilities')->insert([
                'id'               => Str::uuid(),
                'discount_type_id' => $dtB1G1,
                'variant_id'       => null,
                'intensity_id'     => null,
                'size_id'          => $s50,
                'created_at'       => $now,
                'updated_at'       => $now,
            ]);

            // Requirement: Beli 1 P50
            DB::table('discount_requirements')->insert([
                'id'                => Str::uuid(),
                'discount_type_id'  => $dtB1G1,
                'variant_id'        => null,
                'intensity_id'      => null,
                'size_id'           => $s50,
                'required_quantity' => 1,
                'matching_mode'     => 'all',
                'group_key'         => 'BUY-P50-1PCS',
                'created_at'        => $now,
                'updated_at'        => $now,
            ]);

            // Reward: 1x P10 EDT (customer pilih varian) + Botol Roll otomatis
            DB::table('discount_rewards')->insert([
                'id'                  => Str::uuid(),
                'discount_type_id'    => $dtB1G1,
                'variant_id'          => null,
                'intensity_id'        => $edt,
                'size_id'             => $s10,
                'packaging_material_id' => $botolRoll,
                'reward_quantity'     => 1,
                'customer_can_choose' => true,
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
                'discount_type_id' => $dtB1G1,
                'store_id'         => null,
                'created_at'       => $now,
                'updated_at'       => $now,
            ]);

            $this->command->line('  [3/3] Buy 1 Get 1 (Opening) seeded');

            DB::commit();

            $this->command->info('');
            $this->command->info('✓ DiscountSeeder selesai — 3 program promo (Spin Wheel + Poin Member + Buy 1 Get 1).');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Seeding gagal: ' . $e->getMessage());
            throw $e;
        }
    }
}
