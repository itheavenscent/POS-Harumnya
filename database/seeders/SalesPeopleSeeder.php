<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SalesPeopleSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        // FIX: gunakan kode toko yang konsisten dengan WarehouseStoreSeeder
        $storeJatim  = DB::table('stores')->where('code', 'STR-JOMBANG1')->first();
        $storeJateng = DB::table('stores')->where('code', 'STR-JOMBANG2')->first();
        $storeJabar  = DB::table('stores')->where('code', 'STR-JOMBANG3')->first();

        if (! $storeJatim || ! $storeJateng || ! $storeJabar) {
            $this->command->error('Stores belum ada. Jalankan WarehouseStoreSeeder terlebih dahulu.');
            return;
        }

        $salesPeople = [
            // ── Toko Jombang 1 ───────────────────────────────────────────────
            ['store_id' => $storeJatim->id,  'code' => 'SP-JOMBANG1-001', 'name' => 'Dewi Rahayu',      'phone' => '08111234561', 'email' => 'dewi.rahayu@harumnya.com',      'join_date' => '2023-01-15'],
            ['store_id' => $storeJatim->id,  'code' => 'SP-JOMBANG1-002', 'name' => 'Rina Susanti',      'phone' => '08111234562', 'email' => 'rina.susanti@harumnya.com',      'join_date' => '2023-03-01'],
            ['store_id' => $storeJatim->id,  'code' => 'SP-JOMBANG1-003', 'name' => 'Agus Prasetyo',     'phone' => '08111234563', 'email' => 'agus.prasetyo@harumnya.com',     'join_date' => '2023-06-10'],

            // ── Toko Jombang 2 ──────────────────────────────────────────────
            ['store_id' => $storeJateng->id, 'code' => 'SP-JOMBANG2-001','name' => 'Fitria Handayani',  'phone' => '08111234564', 'email' => 'fitria.handayani@harumnya.com',  'join_date' => '2023-02-01'],
            ['store_id' => $storeJateng->id, 'code' => 'SP-JOMBANG2-002','name' => 'Budi Kurniawan',    'phone' => '08111234565', 'email' => 'budi.kurniawan@harumnya.com',    'join_date' => '2023-04-15'],

            // ── Toko Jombang 3 ───────────────────────────────────────────────
            ['store_id' => $storeJabar->id,  'code' => 'SP-JOMBANG3-001', 'name' => 'Lestari Wulandari', 'phone' => '08111234566', 'email' => 'lestari.wulandari@harumnya.com', 'join_date' => '2023-07-01'],
            ['store_id' => $storeJabar->id,  'code' => 'SP-JOMBANG3-002', 'name' => 'Rudi Hartono',      'phone' => '08111234567', 'email' => 'rudi.hartono@harumnya.com',      'join_date' => '2023-08-01'],
        ];

        $monthlyTargets = [
            ['month' =>  1, 'amount' =>  8000000, 'qty' =>  80],
            ['month' =>  2, 'amount' =>  8500000, 'qty' =>  85],
            ['month' =>  3, 'amount' =>  9000000, 'qty' =>  90],
            ['month' =>  4, 'amount' =>  9000000, 'qty' =>  90],
            ['month' =>  5, 'amount' => 10000000, 'qty' => 100],
            ['month' =>  6, 'amount' => 12000000, 'qty' => 120],
            ['month' =>  7, 'amount' => 10000000, 'qty' => 100],
            ['month' =>  8, 'amount' => 10000000, 'qty' => 100],
            ['month' =>  9, 'amount' =>  9000000, 'qty' =>  90],
            ['month' => 10, 'amount' =>  9000000, 'qty' =>  90],
            ['month' => 11, 'amount' => 11000000, 'qty' => 110],
            ['month' => 12, 'amount' => 15000000, 'qty' => 150],
        ];

        foreach ($salesPeople as $sp) {
            $spId = Str::uuid()->toString();

            DB::table('sales_people')->insert([
                'id'         => $spId,
                'store_id'   => $sp['store_id'],
                'code'       => $sp['code'],
                'name'       => $sp['name'],
                'phone'      => $sp['phone'],
                'email'      => $sp['email'],
                'join_date'  => $sp['join_date'],
                'is_active'  => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            foreach ($monthlyTargets as $t) {
                DB::table('sales_targets')->insert([
                    'id'              => Str::uuid(),
                    'sales_person_id' => $spId,
                    'year'            => 2025,
                    'month'           => $t['month'],
                    'target_amount'   => $t['amount'],
                    'target_quantity' => $t['qty'],
                    'created_at'      => $now,
                    'updated_at'      => $now,
                ]);
            }
        }

        $this->command->info('✓ Sales people & targets seeded (' . count($salesPeople) . ' people).');
    }
}
