<?php

use App\Models\AuditLog;
use App\Models\Discount;
use App\Models\User;

it('lets cashiers read but never write discounts', function (): void {
    $owner = User::factory()->create(['role' => User::ROLE_OWNER]);
    $kasir = User::factory()->create(['role' => User::ROLE_CASHIER]);
    Discount::factory()->create(['active' => true]);
    Discount::factory()->create(['active' => false]);

    $this->actingAs($kasir, 'sanctum')
        ->getJson('/api/v1/discounts')
        ->assertOk()
        ->assertJsonPath('meta.total', 2);

    $this->actingAs($kasir, 'sanctum')
        ->getJson('/api/v1/discounts?active=1')
        ->assertOk()
        ->assertJsonPath('meta.total', 1);

    $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/discounts', [
            'name' => 'Nakal',
            'type' => Discount::TYPE_FIXED,
            'value' => 5000,
        ])
        ->assertForbidden();
});

it('keeps discount management owner-only', function (): void {
    $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);

    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/discounts', [
            'name' => 'Admin Coba',
            'type' => Discount::TYPE_PERCENT,
            'value' => 5,
        ])
        ->assertForbidden();

    $discount = Discount::factory()->create();

    $this->actingAs($admin, 'sanctum')
        ->putJson("/api/v1/discounts/{$discount->id}", ['name' => 'Diubah'])
        ->assertForbidden();

    $this->actingAs($admin, 'sanctum')
        ->deleteJson("/api/v1/discounts/{$discount->id}")
        ->assertForbidden();
});

it('validates discount rules per type', function (): void {
    $owner = User::factory()->create(['role' => User::ROLE_OWNER]);

    // Percent above 100 rejected.
    $this->actingAs($owner, 'sanctum')
        ->postJson('/api/v1/discounts', [
            'name' => 'Kebablasan',
            'type' => Discount::TYPE_PERCENT,
            'value' => 150,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['value']);

    // Zero nominal rejected.
    $this->actingAs($owner, 'sanctum')
        ->postJson('/api/v1/discounts', [
            'name' => 'Nol Rupiah',
            'type' => Discount::TYPE_FIXED,
            'value' => 0,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['value']);

    // Unknown type rejected.
    $this->actingAs($owner, 'sanctum')
        ->postJson('/api/v1/discounts', [
            'name' => 'Aneh',
            'type' => 'BOGO',
            'value' => 10,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['type']);
});

it('creates, updates, and soft-deletes discounts with audit', function (): void {
    $owner = User::factory()->create(['role' => User::ROLE_OWNER]);

    $id = $this->actingAs($owner, 'sanctum')
        ->postJson('/api/v1/discounts', [
            'name' => 'Member 10%',
            'type' => Discount::TYPE_PERCENT,
            'value' => 10,
            'min_order_subtotal' => 50000,
        ])
        ->assertCreated()
        ->assertJsonPath('data.type', Discount::TYPE_PERCENT)
        ->json('data.id');

    expect(AuditLog::query()->where('action', 'DISCOUNT_CREATED')->count())->toBe(1);

    $this->actingAs($owner, 'sanctum')
        ->putJson("/api/v1/discounts/{$id}", ['active' => false])
        ->assertOk()
        ->assertJsonPath('data.active', false);

    expect(AuditLog::query()->where('action', 'DISCOUNT_UPDATED')->count())->toBe(1);

    $this->actingAs($owner, 'sanctum')
        ->deleteJson("/api/v1/discounts/{$id}")
        ->assertNoContent();

    $this->assertSoftDeleted('discounts', ['id' => $id]);
});
