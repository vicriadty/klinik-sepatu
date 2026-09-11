<?php

use App\Models\Customer;
use App\Models\User;

it('creates customers storing the canonical phone', function (): void {
    $staff = User::factory()->create();

    $this->actingAs($staff, 'sanctum')
        ->postJson('/api/v1/customers', [
            'name' => 'Budi Santoso',
            'phone' => '0812-3456-7890',
        ])
        ->assertCreated()
        ->assertJsonPath('data.phone', '6281234567890')
        ->assertJsonPath('data.phone_display', '+6281234567890')
        ->assertJsonPath('data.wa_opt_out', false);

    $this->assertDatabaseHas('customers', [
        'name' => 'Budi Santoso',
        'phone' => '6281234567890',
    ]);
});

it('returns 409 with the existing record on duplicate phone', function (): void {
    $staff = User::factory()->create();
    $existing = Customer::factory()->create(['phone' => '6281234567890']);

    $this->actingAs($staff, 'sanctum')
        ->postJson('/api/v1/customers', [
            'name' => 'Budi Lain',
            'phone' => '+62 812-3456-7890',
        ])
        ->assertConflict()
        ->assertJsonPath('data.customer.id', $existing->id)
        ->assertJsonPath('data.customer.phone', '6281234567890');

    expect(Customer::count())->toBe(1);
});

it('rejects invalid phones with 422', function (string $phone): void {
    $staff = User::factory()->create();

    $this->actingAs($staff, 'sanctum')
        ->postJson('/api/v1/customers', ['name' => 'X', 'phone' => $phone])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['phone']);
})->with(['0211234567', '+6581234567', '0812', 'bukan-nomor']);

it('searches by phone in any format and by name', function (): void {
    $staff = User::factory()->create();
    Customer::factory()->create(['name' => 'Budi Santoso', 'phone' => '6281234567890']);
    Customer::factory()->create(['name' => 'Siti Aminah', 'phone' => '6289876543210']);

    $searches = [
        '081234567890' => 'Budi Santoso',
        '+6281234567890' => 'Budi Santoso',
        '0812' => 'Budi Santoso',
        'siti' => 'Siti Aminah',
        'SITI' => 'Siti Aminah',
    ];

    foreach ($searches as $query => $expectedName) {
        $this->actingAs($staff, 'sanctum')
            ->getJson('/api/v1/customers?search='.urlencode($query))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', $expectedName);
    }
});

it('lists customers with the standard pagination envelope', function (): void {
    $staff = User::factory()->create();
    Customer::factory()->count(3)->create();

    $this->actingAs($staff, 'sanctum')
        ->getJson('/api/v1/customers')
        ->assertOk()
        ->assertJsonPath('meta.page', 1)
        ->assertJsonPath('meta.total', 3)
        ->assertJsonStructure(['data' => [['id', 'name', 'phone', 'phone_display']]]);
});

it('shows and updates customers, guarding duplicates on update', function (): void {
    $staff = User::factory()->create();
    $customer = Customer::factory()->create(['phone' => '6281234567890']);
    $other = Customer::factory()->create(['phone' => '6289876543210']);

    $this->actingAs($staff, 'sanctum')
        ->getJson("/api/v1/customers/{$customer->id}")
        ->assertOk()
        ->assertJsonPath('data.phone', '6281234567890');

    $this->actingAs($staff, 'sanctum')
        ->getJson('/api/v1/customers/999999')
        ->assertNotFound();

    $this->actingAs($staff, 'sanctum')
        ->putJson("/api/v1/customers/{$customer->id}", [
            'address' => 'Jl. Merdeka 10',
            'wa_opt_out' => true,
        ])
        ->assertOk()
        ->assertJsonPath('data.address', 'Jl. Merdeka 10')
        ->assertJsonPath('data.wa_opt_out', true);

    $this->actingAs($staff, 'sanctum')
        ->putJson("/api/v1/customers/{$customer->id}", ['phone' => '089876543210'])
        ->assertConflict()
        ->assertJsonPath('data.customer.id', $other->id);
});

it('rejects unauthenticated customer access', function (): void {
    $this->getJson('/api/v1/customers')->assertUnauthorized();

    $this->postJson('/api/v1/customers', ['name' => 'X', 'phone' => '081234567890'])
        ->assertUnauthorized();
});
