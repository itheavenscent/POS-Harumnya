<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * TRUSTED DEVICES
     *
     * Perangkat yang sudah lolos OTP dan dipercaya user ("trust this device").
     * Cookie di browser menyimpan token acak; DB menyimpan hash SHA-256-nya.
     * Selama token belum expired, login di perangkat itu tidak butuh OTP.
     */
    public function up(): void
    {
        Schema::create('trusted_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            // SHA-256 dari token cookie (64 hex) — indexable untuk lookup cepat.
            $table->string('token_hash', 64)->unique();

            $table->string('label')->nullable()->comment('Nama perangkat / browser (opsional)');
            $table->string('last_ip', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at');

            $table->timestamps();

            $table->index(['user_id', 'expires_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trusted_devices');
    }
};
