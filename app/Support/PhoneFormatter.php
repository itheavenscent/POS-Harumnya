<?php

namespace App\Support;

class PhoneFormatter
{
    /**
     * Konversi nomor telepon Indonesia ke format internasional 62.
     *   08xxxxxxxxxx  → 628xxxxxxxxxx
     *   8xxxxxxxxxx   → 628xxxxxxxxxx
     *   +628xxxxxxxxx → 628xxxxxxxxxx
     *   628xxxxxxxxx  → tetap
     *
     * Nilai yang bukan nomor telepon (mis. nama pelanggan pada fallback)
     * dikembalikan apa adanya.
     */
    public static function toInternational(?string $raw): ?string
    {
        if ($raw === null) {
            return null;
        }

        $value = trim($raw);
        if ($value === '') {
            return $value;
        }

        // Buang pemisah umum (spasi, strip, titik, kurung).
        $digits = preg_replace('/[\s\-().]/', '', $value);

        // Bukan nomor telepon → kembalikan asli (mis. nama pada COALESCE fallback).
        if (! preg_match('/^\+?\d+$/', $digits)) {
            return $raw;
        }

        $digits = ltrim($digits, '+');

        if (str_starts_with($digits, '62')) {
            return $digits;
        }
        if (str_starts_with($digits, '0')) {
            return '62' . substr($digits, 1);
        }
        if (str_starts_with($digits, '8')) {
            return '62' . $digits;
        }

        return $digits;
    }
}
