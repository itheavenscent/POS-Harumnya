<?php

namespace App\Services\Auth;

use App\Models\TrustedDevice;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;

class TrustedDeviceService
{
    /** Nama cookie di browser. */
    public const COOKIE = 'harumnya_device';

    /** Masa berlaku kepercayaan perangkat (hari). */
    public const TRUST_DAYS = 30;

    /**
     * Apakah request ini datang dari perangkat yang dipercaya untuk user tsb.
     * Jika ya, perbarui last_used_at + last_ip (sliding refresh expiry).
     */
    public function isTrusted(User $user, Request $request): bool
    {
        $token = $request->cookie(self::COOKIE);
        if (! $token) {
            return false;
        }

        $device = TrustedDevice::query()
            ->where('user_id', $user->id)
            ->where('token_hash', $this->hash($token))
            ->active()
            ->first();

        if (! $device) {
            return false;
        }

        // Sliding: perpanjang masa berlaku tiap dipakai.
        $device->forceFill([
            'last_used_at' => now(),
            'last_ip'      => $request->ip(),
            'expires_at'   => now()->addDays(self::TRUST_DAYS),
        ])->save();

        Cookie::queue($this->makeCookie($token));

        return true;
    }

    /**
     * Tandai perangkat saat ini sebagai dipercaya: buat token, simpan hash,
     * dan antre cookie ke browser.
     */
    public function trust(User $user, Request $request): void
    {
        $token = Str::random(64);

        $user->trustedDevices()->create([
            'token_hash'   => $this->hash($token),
            'label'        => Str::limit((string) $request->userAgent(), 190, ''),
            'last_ip'      => $request->ip(),
            'user_agent'   => $request->userAgent(),
            'last_used_at' => now(),
            'expires_at'   => now()->addDays(self::TRUST_DAYS),
        ]);

        Cookie::queue($this->makeCookie($token));
    }

    /**
     * Lupakan perangkat saat ini (hapus row + kadaluarsakan cookie).
     */
    public function forget(Request $request): void
    {
        $token = $request->cookie(self::COOKIE);
        if ($token) {
            TrustedDevice::where('token_hash', $this->hash($token))->delete();
        }

        Cookie::queue(Cookie::forget(self::COOKIE));
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private function hash(string $token): string
    {
        return hash('sha256', $token);
    }

    private function makeCookie(string $token): \Symfony\Component\HttpFoundation\Cookie
    {
        // httpOnly, sameSite=lax; secure mengikuti env (session.secure).
        return cookie(
            name:     self::COOKIE,
            value:    $token,
            minutes:  self::TRUST_DAYS * 24 * 60,
            path:     null,
            domain:   null,
            secure:   null,
            httpOnly: true,
            raw:      false,
            sameSite: 'lax',
        );
    }
}
