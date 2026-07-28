<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Auth\OtpService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class OtpController extends Controller
{
    // Kunci session untuk tantangan OTP (user belum benar-benar login).
    private const SESSION_USER = 'otp:user_id';
    private const SESSION_REMEMBER = 'otp:remember';

    public function __construct(private OtpService $otp) {}

    /**
     * Halaman input OTP.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        $user = $this->pendingUser($request);
        if (! $user) {
            return redirect()->route('login');
        }

        return Inertia::render('Auth/VerifyOtp', [
            'email'       => $this->maskEmail($user->email),
            'expiresAt'   => optional($user->otp_expires_at)->toIso8601String(),
            'ttlSeconds'  => OtpService::TTL_SECONDS,
            'status'      => session('status'),
        ]);
    }

    /**
     * Verifikasi OTP → login penuh.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $this->pendingUser($request);
        if (! $user) {
            return redirect()->route('login');
        }

        $request->validate(['code' => ['required', 'string']]);

        $this->ensureNotRateLimited($request, $user);

        if (! $this->otp->verify($user, $request->string('code'))) {
            RateLimiter::hit($this->throttleKey($request, $user));

            throw ValidationException::withMessages([
                'code' => 'Kode OTP salah atau sudah kadaluarsa.',
            ]);
        }

        RateLimiter::clear($this->throttleKey($request, $user));

        // OTP valid → login penuh
        $remember = (bool) $request->session()->get(self::SESSION_REMEMBER, false);
        $this->otp->clear($user);
        Auth::guard('web')->login($user, $remember);
        $request->session()->regenerate();
        $request->session()->forget([self::SESSION_USER, self::SESSION_REMEMBER]);

        if ($user->hasRole('cashier')) {
            return redirect()->intended(route('transactions.index', absolute: false));
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Kirim ulang OTP (cooldown = TTL).
     */
    public function resend(Request $request): RedirectResponse
    {
        $user = $this->pendingUser($request);
        if (! $user) {
            return redirect()->route('login');
        }

        $key = 'otp-resend:'.$user->id;
        if (RateLimiter::tooManyAttempts($key, 1)) {
            $seconds = RateLimiter::availableIn($key);

            throw ValidationException::withMessages([
                'code' => "Tunggu {$seconds} detik sebelum kirim ulang OTP.",
            ]);
        }

        RateLimiter::hit($key, OtpService::TTL_SECONDS);
        $this->otp->send($user);

        return back()->with('status', 'Kode OTP baru sudah dikirim ke email Anda.');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function pendingUser(Request $request): ?User
    {
        $id = $request->session()->get(self::SESSION_USER);

        return $id ? User::find($id) : null;
    }

    private function ensureNotRateLimited(Request $request, User $user): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey($request, $user), 5)) {
            return;
        }

        $seconds = RateLimiter::availableIn($this->throttleKey($request, $user));

        throw ValidationException::withMessages([
            'code' => "Terlalu banyak percobaan. Coba lagi dalam {$seconds} detik.",
        ]);
    }

    private function throttleKey(Request $request, User $user): string
    {
        return Str::lower('otp:'.$user->id.'|'.$request->ip());
    }

    private function maskEmail(string $email): string
    {
        [$name, $domain] = array_pad(explode('@', $email, 2), 2, '');
        $visible = Str::substr($name, 0, 2);
        $masked = $visible.str_repeat('*', max(1, Str::length($name) - 2));

        return $domain ? "{$masked}@{$domain}" : $masked;
    }
}
