<?php

use App\Models\ServiceCategory;
use App\Models\User;

it('lists categories with service counts', function (): void {
    $owner = User::factory()->create(['role' => User::ROLE_OWNER]);
    $category = ServiceCategory::factory()->create();
    \App\Models\Service::factory()->count(2)->create(['category_id' => $category->id]);

    $this->actingAs($owner, 'sanctum')
        ->getJson('/api/v1/service-categories')
        ->assertOk()
        ->assertJsonPath('data.0.services_count', 2)
        ->assertJsonPath('meta.total', 1);
});

it('manages categories as owner and admin but not cashier', function (): void {
    $owner = User::factory()->create(['role' => User::ROLE_OWNER]);
    $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
    $kasir = User::factory()->create(['role' => User::ROLE_CASHIER]);

    $this->actingAs($admin, 'sanctum')
        ->postJson('/api/v1/service-categories', ['name' => 'Express'])
        ->assertCreated()
        ->assertJsonPath('data.name', 'Express');

    $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/service-categories', ['name' => 'Ilegal'])
        ->assertForbidden();

    $this->actingAs($kasir, 'sanctum')
        ->getJson('/api/v1/service-categories')
        ->assertOk();
});

it('validates category input', function (): void {
    $owner = User::factory()->create(['role' => User::ROLE_OWNER]);
    ServiceCategory::factory()->create(['name' => 'Cleaning']);

    $this->actingAs($owner, 'sanctum')
        ->postJson('/api/v1/service-categories', ['name' => 'Cleaning'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);

    $this->actingAs($owner, 'sanctum')
        ->postJson('/api/v1/service-categories', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['name']);
});

it('blocks deleting categories that still have services', function (): void {
    $owner = User::factory()->create(['role' => User::ROLE_OWNER]);
    $full = ServiceCategory::factory()->create();
    \App\Models\Service::factory()->create(['category_id' => $full->id]);
    $empty = ServiceCategory::factory()->create();

    $this->actingAs($owner, 'sanctum')
        ->deleteJson("/api/v1/service-categories/{$full->id}")
        ->assertConflict();

    $this->actingAs($owner, 'sanctum')
        ->deleteJson("/api/v1/service-categories/{$empty->id}")
        ->assertNoContent();

    $this->assertDatabaseMissing('service_categories', ['id' => $empty->id]);
});
