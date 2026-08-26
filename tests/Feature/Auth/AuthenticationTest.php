<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\Auth\OtpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        // New device / no trusted-device token yet -> credentials alone are not
        // enough, the app logs the guard back out and routes to the OTP step.
        $this->assertGuest();
        $response->assertRedirect(route('otp.notice'));

        // Generate a fresh plaintext OTP for the pending user (the stored value
        // is hashed, so we can't read back what AuthenticatedSessionController
        // sent) and complete the second factor.
        $code = app(OtpService::class)->generate($user->fresh());

        $otpResponse = $this->post(route('otp.verify'), [
            'code' => $code,
        ]);

        $this->assertAuthenticated();
        $otpResponse->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }
}
