<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE stock_adjustments MODIFY COLUMN type ENUM('stock_opname', 'damage', 'loss', 'found', 'expired', 'daily_mutation', 'other') NOT NULL");
        } else {
            Schema::table('stock_adjustments', function (Blueprint $table) {
                $table->string('type', 30)->change();
            });
        }
    }

    public function down(): void
    {
        $driver = DB::connection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE stock_adjustments MODIFY COLUMN type ENUM('stock_opname', 'damage', 'loss', 'found', 'expired', 'other') NOT NULL");
        }
    }
};
