<?php

use App\Models\User;

it('logs in with valid credentials and returns a token', function (): void {
    $user = User::factory()->create(['username' => 'kasir01']);

    $response = $this->postJson('/api/v1/auth/login', [
        'username' => 'kasir01',
        'password' => 'password',
    ]);

    $response->assertOk()
        ->assertJsonPath('data.user.username', 'kasir01')
        ->assertJsonPath('data.user.role', User::ROLE_CASHIER)
        ->assertJsonStructure(['data' => ['user', 'token']])
        ->assertJsonMissingPath('data.user.password');

    expect($user->fresh()->last_login_at)->not->toBeNull();
});

it('treats usernames case-insensitively', function (): void {
    User::factory()->create(['username' => 'BudiSantoso']);

    $this->postJson('/api/v1/auth/login', [
        'username' => 'budisantoso',
        'password' => 'password',
    ])->assertOk()->assertJsonPath('data.user.username', 'budisantoso');
});

it('rejects bad credentials with a uniform 401', function (string $username, string $password): void {
    User::factory()->create(['username' => 'kasir01']);

    $this->postJson('/api/v1/auth/login', [
        'username' => $username,
        'password' => $password,
    ])->assertUnauthorized()->assertJsonPath('message', 'Invalid credentials.');
})->with([
    'wrong password' => ['kasir01', 'salah-password'],
    'unknown user' => ['tidak-ada', 'password'],
]);

it('validates login input with 422 field errors', function (): void {
    $this->postJson('/api/v1/auth/login', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['username', 'password']);
});

it('rejects deactivated accounts with 403', function (): void {
    User::factory()->inactive()->create(['username' => 'nonaktif']);

    $this->postJson('/api/v1/auth/login', [
        'username' => 'nonaktif',
        'password' => 'password',
    ])->assertForbidden()->assertJsonPath('message', 'Account deactivated.');
});

it('returns the current user on me', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user, 'sanctum')
        ->getJson('/api/v1/auth/me')
        ->assertOk()
        ->assertJsonPath('data.username', $user->username)
        ->assertJsonMissingPath('data.password');
});

it('rejects unauthenticated me requests', function (): void {
    $this->getJson('/api/v1/auth/me')->assertUnauthorized();
});

it('revokes the token on logout', function (): void {
    $user = User::factory()->create();
    $token = $user->createToken('test')->plainTextToken;

    expect(\Laravel\Sanctum\PersonalAccessToken::count())->toBe(1);

    $this->withToken($token)->postJson('/api/v1/auth/logout')->assertNoContent();

    expect(\Laravel\Sanctum\PersonalAccessToken::count())->toBe(0);

    // The test client reuses one app instance for every HTTP call in a
    // test, so the sanctum RequestGuard would keep serving the memoized
    // user from the logout request. Production boots a fresh app per
    // request, so drop the cached guards to assert the real contract.
    auth()->forgetGuards();

    $this->withToken($token)->getJson('/api/v1/auth/me')->assertUnauthorized();
});

it('throttles repeated login attempts', function (): void {
    User::factory()->create(['username' => 'kasir01']);

    for ($i = 0; $i < 10; $i++) {
        $this->postJson('/api/v1/auth/login', [
            'username' => 'kasir01',
            'password' => 'salah',
        ])->assertUnauthorized();
    }

    $this->postJson('/api/v1/auth/login', [
        'username' => 'kasir01',
        'password' => 'salah',
    ])->assertStatus(429);
});
