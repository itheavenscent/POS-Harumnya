<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * MIGRATION 15 — PAYMENT SETTINGS
 * Membutuhkan: stores (01)
 *
 * Konfigurasi payment gateway per toko.
 * store_id nullable: null = setting global/default (fallback jika toko tidak punya override).
 *
 * DESAIN:
 *   - Satu record per toko (unique store_id)
 *   - null store_id = global default
 *   - is_production: false = sandbox / testing mode
 *
 * CATATAN KEAMANAN:
 *   midtrans_server_key, xendit_secret_key, dll → simpan sebagai ciphertext.
 *   Enkripsi di app layer (Laravel Crypt) SEBELUM disimpan ke DB.
 *   Jangan simpan plaintext secret key di DB.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_settings', function (Blueprint $table) {
            $table->id();

            $table->uuid('store_id')->nullable()
                  ->comment('null = global default; filled = override per toko');

            $table->string('default_gateway', 50)->default('cash')
                  ->comment('cash | midtrans | xendit');

            // ── Midtrans ──────────────────────────────────────────────────────
            $table->boolean('midtrans_enabled')->default(false);
            $table->text('midtrans_server_key')->nullable()
                  ->comment('Simpan sebagai ciphertext (enkripsi di app layer)');
            $table->string('midtrans_client_key', 255)->nullable();
            $table->boolean('midtrans_production')->default(false)
                  ->comment('false = sandbox mode');

            // ── Xendit ────────────────────────────────────────────────────────
            $table->boolean('xendit_enabled')->default(false);
            $table->text('xendit_secret_key')->nullable()
                  ->comment('Simpan sebagai ciphertext (enkripsi di app layer)');
            $table->string('xendit_public_key', 255)->nullable();
            $table->boolean('xendit_production')->default(false);

            $table->timestamps();

            $table->foreign('store_id')
                  ->references('id')->on('stores')->cascadeOnDelete();

            $table->unique('store_id', 'uq_payment_settings_store');
            $table->index('store_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_settings');
    }
};
