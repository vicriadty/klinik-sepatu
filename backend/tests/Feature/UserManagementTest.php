<?php

use App\Models\User;

function staff(string $role, string $username): User
{
    return User::factory()->create(['role' => $role, 'username' => $username]);
}

it('lists users with the standard pagination envelope', function (): void {
    staff(User::ROLE_OWNER, 'owner1');
    User::factory()->count(3)->create();

    $response = $this->actingAs(User::where('username', 'owner1')->first(), 'sanctum')
        ->getJson('/api/v1/users');

    $response->assertOk()
        ->assertJsonPath('meta.page', 1)
        ->assertJsonPath('meta.per_page', 15)
        ->assertJsonPath('meta.total', 4)
        ->assertJsonPath('meta.last_page', 1)
        ->assertJsonStructure(['data' => [['id', 'name', 'username', 'role', 'is_active']]])
        ->assertJsonMissingPath('data.0.password');
});

it('forbids user listing for cashiers', function (): void {
    $this->actingAs(staff(User::ROLE_CASHIER, 'kasir1'), 'sanctum')
        ->getJson('/api/v1/users')
        ->assertForbidden();
});

it('filters users by search and role', function (): void {
    $owner = staff(User::ROLE_OWNER, 'owner1');
    staff(User::ROLE_CASHIER, 'budiseptu');

    $this->actingAs($owner, 'sanctum')
        ->getJson('/api/v1/users?search=budi')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.username', 'budiseptu');

    $this->actingAs($owner, 'sanctum')
        ->getJson('/api/v1/users?role=cashier')
        ->assertOk()
        ->assertJsonPath('meta.total', 1);
});

it('lets owners create users with a usable password', function (): void {
    $owner = staff(User::ROLE_OWNER, 'owner1');

    $this->actingAs($owner, 'sanctum')
        ->postJson('/api/v1/users', [
            'name' => 'Kasir Baru',
            'username' => 'KasirBaru',
            'role' => User::ROLE_CASHIER,
            'password' => 'rahasia-kuat-123',
        ])
        ->assertCreated()
        ->assertJsonPath('data.username', 'kasirbaru');

    // The stored password really works at login.
    $this->postJson('/api/v1/auth/login', [
        'username' => 'kasirbaru',
        'password' => 'rahasia-kuat-123',
    ])->assertOk();
});

it('validates user creation input', function (): void {
    $owner = staff(User::ROLE_OWNER, 'owner1');
    staff(User::ROLE_CASHIER, 'kasir1');

    // Duplicate username, case-insensitively.
    $this->actingAs($owner, 'sanctum')
        ->postJson('/api/v1/users', [
            'name' => 'Duplikat',
            'username' => 'KASIR1',
            'role' => User::ROLE_CASHIER,
            'password' => 'rahasia-kuat-123',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['username']);

    // Short password and bad role.
    $this->actingAs($owner, 'sanctum')
        ->postJson('/api/v1/users', [
            'name' => 'X',
            'username' => 'baru123',
            'role' => 'superadmin',
            'password' => 'pendek',
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['role', 'password']);
});

it('keeps owner management owner-only', function (): void {
    $admin = staff(User::ROLE_ADMIN, 'admin1');
    staff(User::ROLE_OWNER, 'owner1');

    // Admin cannot create owners or touch the owner account.
    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/users', [
            'name' => 'Owner Gadungan',
            'username' => 'ownergadungan',
            'role' => User::ROLE_OWNER,
            'password' => 'rahasia-kuat-123',
        ])
        ->assertForbidden();

    $owner = User::where('username', 'owner1')->first();

    $this->actingAs($admin, 'sanctum')
        ->putJson("/api/v1/users/{$owner->id}", ['name' => 'Diubah'])
        ->assertForbidden();

    // Admin cannot promote anyone to owner either.
    $kasir = staff(User::ROLE_CASHIER, 'kasir1');

    $this->actingAs($admin, 'sanctum')
        ->putJson("/api/v1/users/{$kasir->id}", ['role' => User::ROLE_OWNER])
        ->assertForbidden();

    // Cashiers cannot manage users at all.
    $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/users', [
            'name' => 'Y',
            'username' => 'yyy123',
            'role' => User::ROLE_CASHIER,
            'password' => 'rahasia-kuat-123',
        ])
        ->assertForbidden();
});

it('shows a single user and 404s unknown ids', function (): void {
    $owner = staff(User::ROLE_OWNER, 'owner1');
    $kasir = staff(User::ROLE_CASHIER, 'kasir1');

    $this->actingAs($owner, 'sanctum')
        ->getJson("/api/v1/users/{$kasir->id}")
        ->assertOk()
        ->assertJsonPath('data.username', 'kasir1')
        ->assertJsonMissingPath('data.password');

    $this->actingAs($owner, 'sanctum')
        ->getJson('/api/v1/users/999999')
        ->assertNotFound();
});

it('updates name, role, and password but never username', function (): void {
    $owner = staff(User::ROLE_OWNER, 'owner1');
    $kasir = staff(User::ROLE_CASHIER, 'kasir1');

    $this->actingAs($owner, 'sanctum')
        ->putJson("/api/v1/users/{$kasir->id}", ['username' => 'barulagi'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['username']);

    $this->actingAs($owner, 'sanctum')
        ->putJson("/api/v1/users/{$kasir->id}", [
            'name' => 'Kasir Senior',
            'role' => User::ROLE_ADMIN,
            'password' => 'password-baru-123',
        ])
        ->assertOk()
        ->assertJsonPath('data.name', 'Kasir Senior')
        ->assertJsonPath('data.role', User::ROLE_ADMIN);

    $this->postJson('/api/v1/auth/login', [
        'username' => 'kasir1',
        'password' => 'password-baru-123',
    ])->assertOk();
});

it('deactivates users and revokes their tokens', function (): void {
    $owner = staff(User::ROLE_OWNER, 'owner1');
    $kasir = staff(User::ROLE_CASHIER, 'kasir1');
    $token = $kasir->createToken('test')->plainTextToken;

    $this->actingAs($owner, 'sanctum')
        ->patchJson("/api/v1/users/{$kasir->id}/status", ['is_active' => false])
        ->assertOk()
        ->assertJsonPath('data.is_active', false);

    expect($kasir->fresh()->tokens()->count())->toBe(0);

    auth()->forgetGuards();

    $this->withToken($token)
        ->getJson('/api/v1/auth/me')
        ->assertUnauthorized();
});

it('protects accounts from self-harm and last-owner lockout', function (): void {
    $owner = staff(User::ROLE_OWNER, 'owner1');
    $admin = staff(User::ROLE_ADMIN, 'admin1');
    $kasir = staff(User::ROLE_CASHIER, 'kasir1');

    // Nobody changes their own status or deletes themselves.
    $this->actingAs($owner, 'sanctum')
        ->patchJson("/api/v1/users/{$owner->id}/status", ['is_active' => false])
        ->assertForbidden();

    $this->actingAs($admin, 'sanctum')
        ->deleteJson("/api/v1/users/{$admin->id}")
        ->assertForbidden();

    // A second owner removes the lockout guard for the first.
    $owner2 = staff(User::ROLE_OWNER, 'owner2');

    $this->actingAs($owner2, 'sanctum')
        ->patchJson("/api/v1/users/{$owner->id}/status", ['is_active' => false])
        ->assertOk();

    $this->actingAs($owner2, 'sanctum')
        ->patchJson("/api/v1/users/{$owner2->id}/status", ['is_active' => false])
        ->assertForbidden();

    // Admins delete cashiers only.
    $this->actingAs($admin, 'sanctum')
        ->deleteJson("/api/v1/users/{$kasir->id}")
        ->assertNoContent();

    $this->assertSoftDeleted('users', ['id' => $kasir->id]);

    $this->actingAs($admin, 'sanctum')
        ->deleteJson("/api/v1/users/{$owner2->id}")
        ->assertForbidden();
});
