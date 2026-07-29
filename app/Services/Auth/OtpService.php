<?php

namespace App\Services\Auth;

use App\Models\User;
use App\Notifications\LoginOtpNotification;
use App\Notifications\PasswordOtpNotification;
use Illuminate\Support\Facades\Hash;

class OtpService
{
    /** Masa berlaku OTP dalam detik. */
    public const TTL_SECONDS = 60;

    /**
     * Buat OTP baru, simpan ter-hash di user, kirim ke email.
     * $purpose menentukan template email: 'login' (default) atau 'password'.
     * Mengembalikan kode plaintext (untuk keperluan debug/log bila perlu).
     */
    public function send(User $user, string $purpose = 'login'): string
    {
        $code = $this->generate($user);

        $notification = $purpose === 'password'
            ? new PasswordOtpNotification($code, self::TTL_SECONDS)
            : new LoginOtpNotification($code, self::TTL_SECONDS);

        $user->notify($notification);

        return $code;
    }

    /**
     * Generate kode 6 digit, simpan hash + expiry ke user.
     */
    public function generate(User $user): string
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->forceFill([
            'otp_code'       => Hash::make($code),
            'otp_expires_at' => now()->addSeconds(self::TTL_SECONDS),
        ])->save();

        return $code;
    }

    /**
     * Verifikasi kode. Gagal jika tidak ada OTP, kadaluarsa, atau tidak cocok.
     */
    public function verify(User $user, string $code): bool
    {
        if (! $user->otp_code || ! $user->otp_expires_at) {
            return false;
        }

        if ($user->otp_expires_at->isPast()) {
            return false;
        }

        return Hash::check($code, $user->otp_code);
    }

    /**
     * Hapus OTP setelah dipakai / dibatalkan.
     */
    public function clear(User $user): void
    {
        $user->forceFill([
            'otp_code'       => null,
            'otp_expires_at' => null,
        ])->save();
    }
}
