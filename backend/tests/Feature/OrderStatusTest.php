<?php

use App\Models\Customer;
use App\Models\Discount;
use App\Models\Order;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;

function statusFixtures(): array
{
    $category = ServiceCategory::factory()->create();
    $service = Service::factory()->create(['category_id' => $category->id, 'price' => 25000]);
    $customer = Customer::factory()->create();
    $kasir = User::factory()->create(['role' => User::ROLE_CASHIER]);
    $owner = User::factory()->create(['role' => User::ROLE_OWNER]);

    $id = test()->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/orders', [
            'customer_id' => $customer->id,
            'items' => [['brand' => 'Nike', 'shoe_type' => 'Sneakers', 'services' => [$service->id]]],
        ])
        ->assertCreated()
        ->json('data.id');

    return compact('id', 'kasir', 'owner');
}

it('walks the happy-path lifecycle with history', function (): void {
    ['id' => $id, 'kasir' => $kasir] = statusFixtures();

    foreach ([Order::STATUS_ON_PROCESS, Order::STATUS_READY_FOR_PICKUP] as $next) {
        $this->actingAs($kasir, 'sanctum')
            ->postJson("/api/v1/orders/{$id}/status", ['status' => $next])
            ->assertOk()
            ->assertJsonPath('data.status', $next);
    }

    expect(Order::find($id)->statusHistories)->toHaveCount(3);
});

it('rejects status skips', function (string $from, string $to): void {
    ['id' => $id, 'kasir' => $kasir] = statusFixtures();

    if ($from !== Order::STATUS_RECEIVED) {
        $this->actingAs($kasir, 'sanctum')
            ->postJson("/api/v1/orders/{$id}/status", ['status' => $from])
            ->assertOk();
    }

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/status", ['status' => $to])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
})->with([
    'received to ready' => [Order::STATUS_RECEIVED, Order::STATUS_READY_FOR_PICKUP],
    'received to completed' => [Order::STATUS_RECEIVED, Order::STATUS_COMPLETED],
    'on-process to completed' => [Order::STATUS_ON_PROCESS, Order::STATUS_COMPLETED],
    'unknown status value' => [Order::STATUS_RECEIVED, 'DRYING'],
]);

it('requires full payment before completion', function (): void {
    ['id' => $id, 'kasir' => $kasir] = statusFixtures();

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/status", ['status' => Order::STATUS_ON_PROCESS])
        ->assertOk();

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/status", ['status' => Order::STATUS_READY_FOR_PICKUP])
        ->assertOk();

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/status", ['status' => Order::STATUS_COMPLETED])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});

it('completes free orders that are already paid', function (): void {
    $category = ServiceCategory::factory()->create();
    $service = Service::factory()->create(['category_id' => $category->id, 'price' => 20000]);
    $customer = Customer::factory()->create();
    $kasir = User::factory()->create(['role' => User::ROLE_CASHIER]);
    $discount = Discount::factory()->create(['type' => 'PERCENT', 'value' => 100]);

    $id = $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/orders', [
            'customer_id' => $customer->id,
            'discount_id' => $discount->id,
            'items' => [['brand' => 'Nike', 'shoe_type' => 'Sneakers', 'services' => [$service->id]]],
        ])
        ->assertCreated()
        ->assertJsonPath('data.payment_status', Order::PAYMENT_PAID)
        ->json('data.id');

    foreach ([Order::STATUS_ON_PROCESS, Order::STATUS_READY_FOR_PICKUP, Order::STATUS_COMPLETED] as $next) {
        $this->actingAs($kasir, 'sanctum')
            ->postJson("/api/v1/orders/{$id}/status", ['status' => $next])
            ->assertOk();
    }

    expect(Order::find($id)->status)->toBe(Order::STATUS_COMPLETED);
});

it('cancels unpaid orders with a reason in history', function (): void {
    ['id' => $id, 'kasir' => $kasir] = statusFixtures();

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/cancel", ['reason' => 'Customer membatalkan via WA.'])
        ->assertOk()
        ->assertJsonPath('data.status', Order::STATUS_CANCELLED);

    $history = Order::find($id)->statusHistories->first();

    expect($history->to_status)->toBe(Order::STATUS_CANCELLED)
        ->and($history->note)->toBe('Customer membatalkan via WA.');
});

it('rejects cancel from terminal or late statuses', function (string $from): void {
    ['id' => $id, 'kasir' => $kasir] = statusFixtures();

    $path = [Order::STATUS_ON_PROCESS, Order::STATUS_READY_FOR_PICKUP];
    $targetIndex = array_search($from, [Order::STATUS_RECEIVED, ...$path], true);

    for ($i = 0; $i < $targetIndex; $i++) {
        $next = [Order::STATUS_ON_PROCESS, Order::STATUS_READY_FOR_PICKUP][$i];
        $this->actingAs($kasir, 'sanctum')
            ->postJson("/api/v1/orders/{$id}/status", ['status' => $next])
            ->assertOk();
    }

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/cancel")
        ->assertUnprocessable();
})->with([
    'from ready for pickup' => [Order::STATUS_READY_FOR_PICKUP],
]);

it('rejects cancelling paid orders until refunds exist', function (): void {
    ['id' => $id, 'kasir' => $kasir, 'owner' => $owner] = statusFixtures();

    Order::whereKey($id)->update(['paid_total' => 50000]);

    // Cashiers cannot even attempt paid cancels; owners hit the refund guard.
    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/cancel")
        ->assertForbidden();

    $this->actingAs($owner, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/cancel")
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['status']);
});
