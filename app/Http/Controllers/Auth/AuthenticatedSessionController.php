<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Services\Auth\OtpService;
use App\Services\Auth\TrustedDeviceService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function __construct(
        private OtpService $otp,
        private TrustedDeviceService $trustedDevices,
    ) {}

    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        // Validasi kredensial (Auth::attempt di dalam authenticate()).
        $request->authenticate();

        $user = Auth::user();

        // Perangkat sudah dipercaya → langsung login penuh, tanpa OTP.
        if ($this->trustedDevices->isTrusted($user, $request)) {
            $request->session()->regenerate();

            if ($user->hasRole('cashier')) {
                return redirect()->intended(route('transactions.index', absolute: false));
            }

            return redirect()->intended(route('dashboard', absolute: false));
        }

        // Perangkat baru — belum login penuh, mulai tantangan OTP via email.
        Auth::guard('web')->logout();

        $request->session()->put('otp:user_id', $user->id);
        $request->session()->put('otp:remember', $request->boolean('remember'));

        $this->otp->send($user);

        return redirect()->route('otp.notice')
            ->with('status', 'Kode OTP sudah dikirim ke email Anda.');
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
