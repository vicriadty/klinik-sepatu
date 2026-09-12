<?php

use App\Models\AuditLog;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;

it('lists services with filters', function (): void {
    $kasir = User::factory()->create(['role' => User::ROLE_CASHIER]);
    $cleaning = ServiceCategory::factory()->create();
    $repair = ServiceCategory::factory()->create();
    Service::factory()->create(['category_id' => $cleaning->id, 'active' => true]);
    Service::factory()->create(['category_id' => $cleaning->id, 'active' => false]);
    Service::factory()->create(['category_id' => $repair->id, 'active' => true]);

    $base = fn () => $this->actingAs($kasir, 'sanctum');

    $base()->getJson('/api/v1/services')
        ->assertOk()
        ->assertJsonPath('meta.total', 3)
        ->assertJsonStructure(['data' => [['id', 'name', 'category', 'price', 'active']]]);

    $base()->getJson("/api/v1/services?category_id={$cleaning->id}")
        ->assertOk()
        ->assertJsonPath('meta.total', 2);

    $base()->getJson('/api/v1/services?active=1')
        ->assertOk()
        ->assertJsonPath('meta.total', 2);
});

it('manages services as owner and admin but not cashier', function (): void {
    $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
    $kasir = User::factory()->create(['role' => User::ROLE_CASHIER]);
    $category = ServiceCategory::factory()->create();

    $payload = [
        'category_id' => $category->id,
        'name' => 'Deep Clean Premium',
        'price' => 75000,
        'estimated_duration_days' => 3,
    ];

    $id = $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/services', $payload)
        ->assertCreated()
        ->assertJsonPath('data.price', 75000)
        ->assertJsonPath('data.category.id', $category->id)
        ->json('data.id');

    $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/services', $payload)
        ->assertForbidden();

    $this->actingAs($kasir, 'sanctum')
        ->putJson("/api/v1/services/{$id}", ['price' => 1])
        ->assertForbidden();
});

it('validates service input', function (): void {
    $owner = User::factory()->create(['role' => User::ROLE_OWNER]);

    $this->actingAs($owner, 'sanctum')
        ->postJson('/api/v1/services', [
            'category_id' => 999999,
            'name' => 'X',
            'price' => -5000,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['category_id', 'price']);
});

it('audits creation, updates, and price changes', function (): void {
    $owner = User::factory()->create(['role' => User::ROLE_OWNER]);
    $category = ServiceCategory::factory()->create();

    $id = $this->actingAs($owner, 'sanctum')
        ->postJson('/api/v1/services', [
            'category_id' => $category->id,
            'name' => 'Fast Clean',
            'price' => 25000,
        ])
        ->assertCreated()
        ->json('data.id');

    expect(AuditLog::query()->where('action', 'SERVICE_CREATED')->count())->toBe(1);

    // Name-only update logs UPDATED but not PRICE_CHANGED.
    $this->actingAs($owner, 'sanctum')
        ->putJson("/api/v1/services/{$id}", ['name' => 'Fast Clean Plus'])
        ->assertOk();

    expect(AuditLog::query()->where('action', 'SERVICE_UPDATED')->count())->toBe(1);
    expect(AuditLog::query()->where('action', 'SERVICE_PRICE_CHANGED')->count())->toBe(0);

    // Price update logs both, with before/after payloads.
    $this->actingAs($owner, 'sanctum')
        ->putJson("/api/v1/services/{$id}", ['price' => 30000])
        ->assertOk()
        ->assertJsonPath('data.price', 30000);

    $priceLog = AuditLog::query()->where('action', 'SERVICE_PRICE_CHANGED')->firstOrFail();

    expect($priceLog->before)->toBe(['price' => 25000])
        ->and($priceLog->after)->toBe(['price' => 30000])
        ->and($priceLog->actor_user_id)->toBe($owner->id);
});

it('toggles active status and soft-deletes services', function (): void {
    $owner = User::factory()->create(['role' => User::ROLE_OWNER]);
    $service = Service::factory()->create(['active' => true]);

    $this->actingAs($owner, 'sanctum')
        ->patchJson("/api/v1/services/{$service->id}/status", ['active' => false])
        ->assertOk()
        ->assertJsonPath('data.active', false);

    $this->actingAs($owner, 'sanctum')
        ->deleteJson("/api/v1/services/{$service->id}")
        ->assertNoContent();

    $this->assertSoftDeleted('services', ['id' => $service->id]);

    // Soft-deleted services disappear from listings.
    $this->actingAs($owner, 'sanctum')
        ->getJson('/api/v1/services')
        ->assertJsonPath('meta.total', 0);
});
