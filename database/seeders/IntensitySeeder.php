<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class IntensitySeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        DB::beginTransaction();

        try {
            // ================================================================
            // 1. SIZES
            // ================================================================
            $this->command->info('Seeding Sizes...');

            $sizesData = [
                ['volume' => 30, 'name' => '30 mL', 'sort_order' => 1],
                ['volume' => 50, 'name' => '50 mL', 'sort_order' => 2],
                ['volume' => 100, 'name' => '100 mL', 'sort_order' => 3],
            ];

            $sizeMap = []; // volume_ml => id

            foreach ($sizesData as $s) {
                $existing = DB::table('sizes')->where('volume_ml', $s['volume'])->first();
                $id = $existing ? $existing->id : Str::uuid()->toString();

                DB::table('sizes')->updateOrInsert(
                    ['volume_ml' => $s['volume']],
                    [
                        'id' => $id,
                        'name' => $s['name'],
                        'sort_order' => $s['sort_order'],
                        'is_active' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );

                $sizeMap[$s['volume']] = $id;
            }

            // ================================================================
            // 2. INTENSITIES
            // ================================================================
            // Sumber: Sheet "Gross Margin" — Konsentrasi (oil : alkohol)
            //   EDT → 1:2  (oil=1 part, alkohol=2 part)
            //   EDP → 1:1
            //   EXT → 2:1
            // ================================================================
            $this->command->info('Seeding Intensities...');

            $intensitiesData = [
                [
                    'code' => 'EDT',
                    'name' => 'Eau de Toilette',
                    'oil_ratio' => '1:2',
                    'alcohol_ratio' => '2:1',
                    'sort_order' => 1,
                ],
                [
                    'code' => 'EDP',
                    'name' => 'Eau de Parfum',
                    'oil_ratio' => '1:1',
                    'alcohol_ratio' => '1:1',
                    'sort_order' => 2,
                ],
                [
                    'code' => 'EXT',
                    'name' => 'Extrait de Parfum',
                    'oil_ratio' => '2:1',
                    'alcohol_ratio' => '1:2',
                    'sort_order' => 3,
                ],
            ];

            $intensityMap = []; // code => id

            foreach ($intensitiesData as $i) {
                $existing = DB::table('intensities')->where('code', $i['code'])->first();
                $id = $existing ? $existing->id : Str::uuid()->toString();

                DB::table('intensities')->updateOrInsert(
                    ['code' => $i['code']],
                    [
                        'id' => $id,
                        'name' => $i['name'],
                        'oil_ratio' => $i['oil_ratio'],
                        'alcohol_ratio' => $i['alcohol_ratio'],
                        'sort_order' => $i['sort_order'],
                        'is_active' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );

                $intensityMap[$i['code']] = $id;
            }

            // ================================================================
            // 3. INTENSITY SIZE PRICES & QUANTITIES
            // ================================================================
            // Sumber: Sheet "Gross Margin" — Harga Jual per Konsentrasi & Volume
            //
            //   EDT: 30ml=30.000 | 50ml=48.000 | 100ml=99.000
            //   EDP: 30ml=45.000 | 50ml=75.000 | 100ml=150.000
            //   EXT: 30ml=60.000 | 50ml=102.000 | 100ml=198.000
            //
            // Qty (oil + alc) dari Sheet "Material & Packing":
            //   EDT 30ml:  FO+DPG=10ml, alc=20ml  → total 30ml
            //   EDT 50ml:  FO+DPG=16ml, alc=34ml  → total 50ml
            //   EDT 100ml: FO+DPG=33ml, alc=67ml  → total 100ml
            //   EDP 30ml:  FO+DPG=15ml, alc=15ml  → total 30ml
            //   EDP 50ml:  FO+DPG=25ml, alc=25ml  → total 50ml
            //   EDP 100ml: FO+DPG=50ml, alc=50ml  → total 100ml
            //   EXT 30ml:  FO+DPG=20ml, alc=10ml  → total 30ml
            //   EXT 50ml:  FO+DPG=34ml, alc=16ml  → total 50ml
            //   EXT 100ml: FO+DPG=67ml, alc=33ml  → total 100ml
            // ================================================================
            $this->command->info('Seeding Intensity Size Prices & Quantities...');

            $matrix = [
                'EDT' => [
                    30 => ['price' => 30000, 'oil' => 10, 'alc' => 20],
                    50 => ['price' => 48000, 'oil' => 16, 'alc' => 34],
                    100 => ['price' => 99000, 'oil' => 33, 'alc' => 67],
                ],
                'EDP' => [
                    30 => ['price' => 45000, 'oil' => 15, 'alc' => 15],
                    50 => ['price' => 75000, 'oil' => 25, 'alc' => 25],
                    100 => ['price' => 150000, 'oil' => 50, 'alc' => 50],
                ],
                'EXT' => [
                    30 => ['price' => 60000, 'oil' => 20, 'alc' => 10],
                    50 => ['price' => 102000, 'oil' => 34, 'alc' => 16],
                    100 => ['price' => 198000, 'oil' => 67, 'alc' => 33],
                ],
            ];

            foreach ($matrix as $code => $sizes) {
                $intensityId = $intensityMap[$code] ?? null;
                if (!$intensityId) {
                    $this->command->warn("Intensity '$code' tidak ditemukan, skip.");
                    continue;
                }

                foreach ($sizes as $volume => $data) {
                    $sizeId = $sizeMap[$volume] ?? null;
                    if (!$sizeId) {
                        $this->command->warn("Size {$volume}ml tidak ditemukan, skip.");
                        continue;
                    }

                    $totalVolume = $data['oil'] + $data['alc'];

                    if ($totalVolume !== $volume) {
                        $this->command->warn(
                            "⚠ Volume mismatch {$code} {$volume}ml: " .
                            "oil({$data['oil']}) + alc({$data['alc']}) = {$totalVolume}"
                        );
                    }

                    // ── intensity_size_prices ─────────────────────────────
                    $existingPrice = DB::table('intensity_size_prices')
                        ->where('intensity_id', $intensityId)
                        ->where('size_id', $sizeId)
                        ->first();

                    DB::table('intensity_size_prices')->updateOrInsert(
                        ['intensity_id' => $intensityId, 'size_id' => $sizeId],
                        [
                            'id' => $existingPrice ? $existingPrice->id : Str::uuid()->toString(),
                            'price' => $data['price'],
                            'is_active' => true,
                            'notes' => null,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]
                    );

                    // ── intensity_size_quantities ─────────────────────────
                    $existingQty = DB::table('intensity_size_quantities')
                        ->where('intensity_id', $intensityId)
                        ->where('size_id', $sizeId)
                        ->first();

                    DB::table('intensity_size_quantities')->updateOrInsert(
                        ['intensity_id' => $intensityId, 'size_id' => $sizeId],
                        [
                            'id' => $existingQty ? $existingQty->id : Str::uuid()->toString(),
                            'oil_quantity' => $data['oil'],
                            'alcohol_quantity' => $data['alc'],
                            'total_volume' => $totalVolume,
                            'is_active' => true,
                            'notes' => null,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]
                    );
                }
            }

            DB::commit();
            $this->command->info('✓ IntensitySeeder selesai.');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->command->error('Seeding gagal: ' . $e->getMessage());
            throw $e;
        }
    }
}