<?php

use App\Jobs\SendWhatsAppNotification;
use App\Models\Customer;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Support\Facades\Http;

function notificationFixtures(): array
{
    $category = ServiceCategory::factory()->create();
    $service = Service::factory()->create(['category_id' => $category->id, 'price' => 40000]);
    $customer = Customer::factory()->create(['phone' => '6281234567890']);
    $kasir = User::factory()->create(['role' => User::ROLE_CASHIER]);

    config()->set('notifications.whatsapp.enabled', true);

    $payload = [
        'customer_id' => $customer->id,
        'items' => [['brand' => 'Nike', 'shoe_type' => 'Sneakers', 'services' => [$service->id]]],
    ];

    return compact('service', 'customer', 'kasir', 'payload');
}

it('sends the digital receipt when an order is created', function (): void {
    ['kasir' => $kasir, 'payload' => $payload, 'customer' => $customer] = notificationFixtures();

    Http::fake([
        'graph.facebook.com/*' => Http::response(['messages' => [['id' => 'wamid.test123']]], 200),
    ]);

    $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/orders', $payload)
        ->assertCreated();

    $notification = Notification::query()->firstOrFail();

    expect($notification->event)->toBe(Notification::EVENT_ORDER_RECEIVED)
        ->and($notification->channel)->toBe(Notification::CHANNEL_WHATSAPP)
        ->and($notification->recipient_phone)->toBe('6281234567890')
        ->and($notification->status)->toBe(Notification::STATUS_SENT)
        ->and($notification->provider_message_id)->toBe('wamid.test123')
        ->and($notification->order_id)->not->toBeNull();

    Http::assertSent(function ($request) use ($customer): bool {
        $body = $request->data();

        return str_contains($request->url(), 'graph.facebook.com')
            && ($body['to'] ?? null) === $customer->phone
            && ($body['template']['name'] ?? null) === config('notifications.whatsapp.templates.'.Notification::EVENT_ORDER_RECEIVED);
    });
});

it('stays idle when the channel is disabled', function (): void {
    $category = ServiceCategory::factory()->create();
    $service = Service::factory()->create(['category_id' => $category->id]);
    $customer = Customer::factory()->create();
    $kasir = User::factory()->create(['role' => User::ROLE_CASHIER]);

    // Deliberately no config()->set enabled and no Http::fake.

    $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/orders', [
            'customer_id' => $customer->id,
            'items' => [['brand' => 'Nike', 'shoe_type' => 'Sneakers', 'services' => [$service->id]]],
        ])
        ->assertCreated();

    expect(Notification::count())->toBe(0);
});

it('skips opted-out customers without sending', function (): void {
    ['kasir' => $kasir, 'payload' => $payload] = notificationFixtures();

    Customer::query()->update(['wa_opt_out' => true]);

    $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/orders', $payload)
        ->assertCreated();

    expect(Notification::query()->value('status'))->toBe(Notification::STATUS_SKIPPED);

    Http::assertNothingSent();
});

it('notifies payment, pickup readiness, and completion', function (): void {
    ['kasir' => $kasir, 'payload' => $payload] = notificationFixtures();

    Http::fake([
        'graph.facebook.com/*' => Http::response(['messages' => [['id' => 'wamid.test123']]], 200),
    ]);

    $id = $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/orders', $payload)
        ->assertCreated()
        ->json('data.id');

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/payments", ['method' => 'CASH', 'amount' => 40000])
        ->assertCreated();

    foreach ([Order::STATUS_ON_PROCESS, Order::STATUS_READY_FOR_PICKUP, Order::STATUS_COMPLETED] as $next) {
        $this->actingAs($kasir, 'sanctum')
            ->postJson("/api/v1/orders/{$id}/status", ['status' => $next])
            ->assertOk();
    }

    expect(Notification::query()->pluck('event')->all())->toBe([
        Notification::EVENT_ORDER_RECEIVED,
        Notification::EVENT_PAYMENT_RECEIVED,
        Notification::EVENT_READY_FOR_PICKUP,
        Notification::EVENT_COMPLETED,
    ])->and(Notification::query()->where('status', Notification::STATUS_SENT)->count())->toBe(4);
});

it('never lets provider failure break the business operation', function (): void {
    ['kasir' => $kasir, 'payload' => $payload] = notificationFixtures();

    Http::fake(['graph.facebook.com/*' => Http::response(['error' => 'boom'], 500)]);

    $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/orders', $payload)
        ->assertCreated();

    expect(Order::count())->toBe(1)
        ->and(Notification::query()->value('status'))->toBe(Notification::STATUS_FAILED)
        ->and(Notification::query()->value('error'))->not->toBeNull();
});

it('marks notifications failed terminally', function (): void {
    $notification = Notification::query()->create([
        'event' => Notification::EVENT_ORDER_RECEIVED,
        'channel' => Notification::CHANNEL_WHATSAPP,
        'recipient_phone' => '6281234567890',
        'status' => Notification::STATUS_PROCESSING,
        'payload' => ['parameters' => []],
    ]);

    (new SendWhatsAppNotification($notification->id))->failed(new \Exception('boom'));

    expect($notification->refresh()->status)->toBe(Notification::STATUS_FAILED)
        ->and($notification->refresh()->error)->toBe('boom');
});
