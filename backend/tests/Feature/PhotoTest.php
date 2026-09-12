<?php

use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderItemPhoto;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

function photoFixtures(): array
{
    Storage::fake('s3');

    $category = ServiceCategory::factory()->create();
    $service = Service::factory()->create(['category_id' => $category->id, 'price' => 25000]);
    $customer = Customer::factory()->create();
    $kasir = User::factory()->create(['role' => User::ROLE_CASHIER]);

    $payload = [
        'customer_id' => $customer->id,
        'items' => [['brand' => 'Nike', 'shoe_type' => 'Sneakers', 'services' => [$service->id]]],
    ];

    [$order] = app(\App\Services\OrderService::class)->create($payload, $kasir);
    [$otherOrder] = app(\App\Services\OrderService::class)->create($payload, $kasir);

    return [
        'item' => $order->items->firstOrFail(),
        'otherItem' => $otherOrder->items->firstOrFail(),
        'kasir' => $kasir,
        'order' => $order,
    ];
}

it('uploads photos with thumbnails generated inline', function (): void {
    ['item' => $item, 'kasir' => $kasir] = photoFixtures();

    $response = $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/order-items/{$item->id}/photos", [
            'photo' => UploadedFile::fake()->image('before.jpg', 800, 600),
            'type' => OrderItemPhoto::TYPE_BEFORE,
        ])
        ->assertCreated()
        ->assertJsonPath('data.type', OrderItemPhoto::TYPE_BEFORE)
        ->assertJsonStructure(['data' => ['id', 'url', 'thumbnail_url', 'mime', 'size']]);

    $photo = OrderItemPhoto::findOrFail($response->json('data.id'));

    expect($photo->path)->toStartWith('photos/')
        ->and(Storage::disk('s3')->exists($photo->path))->toBeTrue()
        ->and($photo->thumbnail_path)->not->toBeNull()
        ->and(Storage::disk('s3')->exists($photo->thumbnail_path))->toBeTrue()
        ->and($response->json('data.url'))->toContain($photo->path);

    // Filenames are unguessable UUIDs, not client names.
    expect($photo->path)->not->toContain('before');
});

it('validates photo uploads', function (): void {
    ['item' => $item, 'kasir' => $kasir] = photoFixtures();
    $url = "/api/v1/order-items/{$item->id}/photos";
    $auth = fn () => $this->actingAs($kasir, 'sanctum');

    // Non-image rejected.
    $auth()->postJson($url, [
        'photo' => UploadedFile::fake()->create('notes.txt', 10, 'text/plain'),
        'type' => OrderItemPhoto::TYPE_BEFORE,
    ])->assertUnprocessable()->assertJsonValidationErrors(['photo']);

    // Oversize rejected (limit 5 MB).
    $auth()->postJson($url, [
        'photo' => UploadedFile::fake()->image('big.jpg')->size(6000),
        'type' => OrderItemPhoto::TYPE_BEFORE,
    ])->assertUnprocessable()->assertJsonValidationErrors(['photo']);

    // Unknown type rejected.
    $auth()->postJson($url, [
        'photo' => UploadedFile::fake()->image('x.jpg'),
        'type' => 'ANGLE_FRONT',
    ])->assertUnprocessable()->assertJsonValidationErrors(['type']);

    // Missing file rejected.
    $auth()->postJson($url, ['type' => OrderItemPhoto::TYPE_BEFORE])
        ->assertUnprocessable()->assertJsonValidationErrors(['photo']);

    expect(OrderItemPhoto::count())->toBe(0);
});

it('lists photos scoped to their item and requires auth', function (): void {
    ['item' => $item, 'otherItem' => $otherItem, 'kasir' => $kasir] = photoFixtures();

    $this->getJson("/api/v1/order-items/{$item->id}/photos")->assertUnauthorized();

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/order-items/{$item->id}/photos", [
            'photo' => UploadedFile::fake()->image('a.jpg'),
            'type' => OrderItemPhoto::TYPE_BEFORE,
        ])
        ->assertCreated();

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/order-items/{$otherItem->id}/photos", [
            'photo' => UploadedFile::fake()->image('b.jpg'),
            'type' => OrderItemPhoto::TYPE_DAMAGE,
        ])
        ->assertCreated();

    $this->actingAs($kasir, 'sanctum')
        ->getJson("/api/v1/order-items/{$item->id}/photos")
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.type', OrderItemPhoto::TYPE_BEFORE);
});

it('deletes photos with their objects', function (): void {
    ['item' => $item, 'kasir' => $kasir] = photoFixtures();

    $id = $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/order-items/{$item->id}/photos", [
            'photo' => UploadedFile::fake()->image('a.jpg'),
            'type' => OrderItemPhoto::TYPE_BEFORE,
        ])
        ->assertCreated()
        ->json('data.id');

    $photo = OrderItemPhoto::findOrFail($id);

    expect(Storage::disk('s3')->exists($photo->path))->toBeTrue();

    $this->actingAs($kasir, 'sanctum')
        ->deleteJson("/api/v1/order-item-photos/{$id}")
        ->assertNoContent();

    expect(OrderItemPhoto::query()->whereKey($id)->exists())->toBeFalse()
        ->and(Storage::disk('s3')->exists($photo->path))->toBeFalse()
        ->and(Storage::disk('s3')->exists($photo->thumbnail_path))->toBeFalse();

    $this->actingAs($kasir, 'sanctum')
        ->deleteJson("/api/v1/order-item-photos/{$id}")
        ->assertNotFound();
});

it('embeds photos in the order detail', function (): void {
    ['item' => $item, 'kasir' => $kasir, 'order' => $order] = photoFixtures();

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/order-items/{$item->id}/photos", [
            'photo' => UploadedFile::fake()->image('a.jpg'),
            'type' => OrderItemPhoto::TYPE_BEFORE,
        ])
        ->assertCreated();

    $this->actingAs($kasir, 'sanctum')
        ->getJson("/api/v1/orders/{$order->id}")
        ->assertOk()
        ->assertJsonCount(1, 'data.items.0.photos')
        ->assertJsonPath('data.items.0.photos.0.type', OrderItemPhoto::TYPE_BEFORE);
});

it('audits photo uploads', function (): void {
    ['item' => $item, 'kasir' => $kasir] = photoFixtures();

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/order-items/{$item->id}/photos", [
            'photo' => UploadedFile::fake()->image('a.jpg'),
            'type' => OrderItemPhoto::TYPE_DAMAGE,
        ])
        ->assertCreated();

    $this->assertDatabaseHas('audit_logs', [
        'action' => 'PHOTO_UPLOADED',
        'entity_type' => 'order_item_photo',
        'actor_user_id' => $kasir->id,
    ]);
});
