<?php

use App\Models\User;

it('provisions a user via make:user', function (): void {
    $this->artisan('make:user', [
        'name' => 'Pemilik Toko',
        'username' => 'Pemilik',
        'role' => 'owner',
        '--password' => 'rahasia-kuat-123',
        '--no-interaction' => true,
    ])->assertSuccessful();

    $this->assertDatabaseHas('users', [
        'username' => 'pemilik',
        'role' => User::ROLE_OWNER,
        'is_active' => true,
    ]);
});

it('rejects duplicate usernames via make:user', function (): void {
    User::factory()->create(['username' => 'kasir01']);

    $this->artisan('make:user', [
        'name' => 'Duplikat',
        'username' => 'kasir01',
        'role' => 'cashier',
        '--password' => 'rahasia-kuat-123',
        '--no-interaction' => true,
    ])->assertFailed();
});
