<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\OtpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordController extends Controller
{
    public function __construct(private OtpService $otp) {}

    /**
     * Halaman ganti password back office.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Dashboard/Settings/Password', [
            'email'          => $this->maskEmail($user->email),
            'ttlSeconds'     => OtpService::TTL_SECONDS,
            'otpExpiresAt'   => optional($user->otp_expires_at)->toIso8601String(),
            'status'         => session('status'),
        ]);
    }

    /**
     * Kirim OTP ke email user sebelum mengganti password.
     * Wajib menyertakan current_password agar hanya pemilik akun yang bisa memicu.
     */
    public function sendOtp(Request $request): RedirectResponse
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        $key = 'password-otp-send:'.$user->id;
        if (RateLimiter::tooManyAttempts($key, 1)) {
            $seconds = RateLimiter::availableIn($key);

            throw ValidationException::withMessages([
                'otp_code' => "Tunggu {$seconds} detik sebelum meminta kode OTP baru.",
            ]);
        }

        RateLimiter::hit($key, OtpService::TTL_SECONDS);
        $this->otp->send($user, 'password');

        return back()->with('status', 'Kode OTP sudah dikirim ke email Anda.');
    }

    /**
     * Update password — hanya berhasil bila OTP valid.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password'         => ['required', Password::defaults(), 'confirmed'],
            'otp_code'         => ['required', 'string'],
        ]);

        $user = $request->user();

        $this->ensureNotRateLimited($request, $user);

        if (! $this->otp->verify($user, $validated['otp_code'])) {
            RateLimiter::hit($this->throttleKey($request, $user));

            throw ValidationException::withMessages([
                'otp_code' => 'Kode OTP salah atau sudah kadaluarsa.',
            ]);
        }

        RateLimiter::clear($this->throttleKey($request, $user));

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        $this->otp->clear($user);

        return back()->with('status', 'Password berhasil diganti.');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function ensureNotRateLimited(Request $request, $user): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey($request, $user), 5)) {
            return;
        }

        $seconds = RateLimiter::availableIn($this->throttleKey($request, $user));

        throw ValidationException::withMessages([
            'otp_code' => "Terlalu banyak percobaan. Coba lagi dalam {$seconds} detik.",
        ]);
    }

    private function throttleKey(Request $request, $user): string
    {
        return Str::lower('password-otp:'.$user->id.'|'.$request->ip());
    }

    private function maskEmail(string $email): string
    {
        [$name, $domain] = array_pad(explode('@', $email, 2), 2, '');
        $visible = Str::substr($name, 0, 2);
        $masked = $visible.str_repeat('*', max(1, Str::length($name) - 2));

        return $domain ? "{$masked}@{$domain}" : $masked;
    }
}
