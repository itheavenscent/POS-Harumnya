<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambah snapshot stok GLOBAL (gabungan semua lokasi) di stock_movements,
 * berdampingan dengan qty_before/qty_after yang sudah per-lokasi.
 * Nullable — record lama tidak di-backfill, ditampilkan "-" di frontend.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->bigInteger('global_qty_before')->nullable()->after('qty_after')
                  ->comment('Snapshot stok global (semua lokasi) sebelum gerakan');
            $table->bigInteger('global_qty_after')->nullable()->after('global_qty_before')
                  ->comment('Snapshot stok global (semua lokasi) setelah gerakan');
        });
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropColumn(['global_qty_before', 'global_qty_after']);
        });
    }
};
