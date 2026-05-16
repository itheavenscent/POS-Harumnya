<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();

        $methods = [
            [
                'code'            => 'CASH',
                'name'            => 'Tunai',
                'type'            => 'cash',
                'has_admin_fee'   => false,
                'admin_fee_pct'   => 0.00,
                'can_give_change' => true,
                'sort_order'      => 1,
            ],
            [
                'code'            => 'QRIS',
                'name'            => 'QRIS',
                'type'            => 'qris',
                'has_admin_fee'   => true,
                'admin_fee_pct'   => 0.70, // Sesuaikan dengan fee aslinya jika perlu
                'can_give_change' => false,
                'sort_order'      => 2,
            ],
            [
                'code'            => 'EDC',
                'name'            => 'EDC',
                'type'            => 'card',
                'has_admin_fee'   => true,
                'admin_fee_pct'   => 1.00, // Sesuaikan dengan fee EDC jika perlu
                'can_give_change' => false,
                'sort_order'      => 3,
            ],
        ];

        foreach ($methods as $m) {
            DB::table('payment_methods')->insert([
                'id'              => Str::uuid(),
                'code'            => $m['code'],
                'name'            => $m['name'],
                'type'            => $m['type'],
                'has_admin_fee'   => $m['has_admin_fee'],
                'admin_fee_pct'   => $m['admin_fee_pct'],
                'can_give_change' => $m['can_give_change'],
                'is_active'       => true,
                'sort_order'      => $m['sort_order'],
                'created_at'      => $now,
                'updated_at'      => $now,
            ]);
        }

        $this->command->info('Payment methods seeded (' . count($methods) . ' methods).');
    }
}
