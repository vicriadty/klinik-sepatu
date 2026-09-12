<?php

use App\Models\Notification;
use App\Models\User;

it('reads settings with defaults and notification health', function (): void {
    $owner = User::factory()->create(['role' => User::ROLE_OWNER]);

    $this->actingAs($owner, 'sanctum')
        ->getJson('/api/v1/settings')
        ->assertOk()
        ->assertJsonPath('data.settings.store_name', config('app.name'))
        ->assertJsonPath('data.settings.timezone', 'Asia/Jakarta')
        ->assertJsonPath('data.settings.store_phone', null)
        ->assertJsonPath('data.notifications.whatsapp.enabled', false)
        ->assertJsonPath('data.notifications.whatsapp.configured', false)
        ->assertJsonPath('data.notifications.whatsapp.last_24h.sent', 0)
        ->assertJsonPath('data.notifications.whatsapp.last_24h.failed', 0);
});

it('persists partial settings updates', function (): void {
    $owner = User::factory()->create(['role' => User::ROLE_OWNER]);

    $this->actingAs($owner, 'sanctum')
        ->putJson('/api/v1/settings', [
            'store_name' => 'Klinik Sepatu Tebet',
            'store_phone' => '0812000111222',
            'receipt_footer' => 'Terima kasih!',
        ])
        ->assertOk()
        ->assertJsonPath('data.settings.store_name', 'Klinik Sepatu Tebet')
        ->assertJsonPath('data.settings.store_phone', '0812000111222')
        ->assertJsonPath('data.settings.receipt_footer', 'Terima kasih!')
        ->assertJsonPath('data.settings.timezone', 'Asia/Jakarta');

    $this->assertDatabaseHas('settings', ['key' => 'store_name', 'value' => 'Klinik Sepatu Tebet']);

    // Untouched keys keep working on subsequent reads.
    $this->actingAs($owner, 'sanctum')
        ->getJson('/api/v1/settings')
        ->assertOk()
        ->assertJsonPath('data.settings.store_name', 'Klinik Sepatu Tebet');
});

it('validates settings input', function (): void {
    $owner = User::factory()->create(['role' => User::ROLE_OWNER]);

    $this->actingAs($owner, 'sanctum')
        ->putJson('/api/v1/settings', ['timezone' => 'Mars/Olympus'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['timezone']);

    $this->actingAs($owner, 'sanctum')
        ->putJson('/api/v1/settings', ['store_name' => ''])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['store_name']);
});

it('restricts settings to owners', function (): void {
    $admin = User::factory()->create(['role' => User::ROLE_ADMIN]);
    $kasir = User::factory()->create(['role' => User::ROLE_CASHIER]);

    $this->getJson('/api/v1/settings')->assertUnauthorized();

    $this->actingAs($admin, 'sanctum')
        ->getJson('/api/v1/settings')
        ->assertForbidden();

    $this->actingAs($admin, 'sanctum')
        ->putJson('/api/v1/settings', ['store_name' => 'X'])
        ->assertForbidden();

    $this->actingAs($kasir, 'sanctum')
        ->getJson('/api/v1/settings')
        ->assertForbidden();
});

it('reflects live notification health', function (): void {
    $owner = User::factory()->create(['role' => User::ROLE_OWNER]);

    config()->set('notifications.whatsapp.enabled', true);
    config()->set('notifications.whatsapp.phone_number_id', '123');
    config()->set('notifications.whatsapp.access_token', 'secret');

    Notification::query()->create([
        'event' => Notification::EVENT_ORDER_RECEIVED,
        'channel' => Notification::CHANNEL_WHATSAPP,
        'recipient_phone' => '6281234567890',
        'status' => Notification::STATUS_SENT,
    ]);
    Notification::query()->create([
        'event' => Notification::EVENT_ORDER_RECEIVED,
        'channel' => Notification::CHANNEL_WHATSAPP,
        'recipient_phone' => '6281234567890',
        'status' => Notification::STATUS_FAILED,
    ]);

    $this->actingAs($owner, 'sanctum')
        ->getJson('/api/v1/settings')
        ->assertOk()
        ->assertJsonPath('data.notifications.whatsapp.enabled', true)
        ->assertJsonPath('data.notifications.whatsapp.configured', true)
        ->assertJsonPath('data.notifications.whatsapp.last_24h.sent', 1)
        ->assertJsonPath('data.notifications.whatsapp.last_24h.failed', 1);
});
