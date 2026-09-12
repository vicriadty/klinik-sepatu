<?php

use App\Models\Customer;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use App\Services\OrderService;
use App\Services\OrderStatusService;
use App\Services\PaymentService;

function dashboardFixtures(): array
{
    $category = ServiceCategory::factory()->create();
    $s1 = Service::factory()->create(['category_id' => $category->id, 'price' => 25000]);
    $s2 = Service::factory()->create(['category_id' => $category->id, 'price' => 60000]);
    $owner = User::factory()->create(['role' => User::ROLE_OWNER]);
    $kasir = User::factory()->create(['role' => User::ROLE_CASHIER]);
    $customers = Customer::factory()->count(4)->create();

    $orders = app(OrderService::class);
    $statuses = app(OrderStatusService::class);
    $payments = app(PaymentService::class);
    $tenDaysAgo = today()->subDays(10);

    $make = function (int $customerIndex, array $serviceSets, ?string $createdAt = null) use ($orders, $customers) {
        [$order] = $orders->create([
            'customer_id' => $customers[$customerIndex]->id,
            'items' => array_map(fn ($services) => [
                'brand' => 'Nike', 'shoe_type' => 'Sneakers', 'services' => $services,
            ], $serviceSets),
        ]);

        if ($createdAt) {
            $order->forceFill(['created_at' => $createdAt, 'updated_at' => $createdAt])->save();
        }

        return $order->refresh();
    };

    // Cancelled order: invisible to every figure.
    $cancelled = $make(0, [[$s1->id]], $tenDaysAgo->toDateString());
    $statuses->transition($cancelled, Order::STATUS_CANCELLED);

    // Old order, partially paid, in progress.
    $old = $make(1, [[$s2->id]], $tenDaysAgo->toDateString());
    $statuses->transition($old, Order::STATUS_ON_PROCESS);
    [$oldPayment] = $payments->record($old->refresh(), [
        'method' => Payment::METHOD_CASH, 'amount' => 20000,
    ], $kasir);
    $oldPayment->forceFill(['created_at' => $tenDaysAgo, 'updated_at' => $tenDaysAgo])->save();

    // Today's unpaid order.
    $today = $make(2, [[$s1->id], [$s1->id, $s2->id]]);

    // Today's paid order, ready for pickup.
    $ready = $make(3, [[$s1->id]]);
    $payments->record($ready->refresh(), [
        'method' => Payment::METHOD_QRIS, 'amount' => 25000,
    ], $kasir);
    $statuses->transition($ready->refresh(), Order::STATUS_ON_PROCESS);
    $statuses->transition($ready->refresh(), Order::STATUS_READY_FOR_PICKUP);

    return compact('s1', 's2', 'owner', 'kasir', 'tenDaysAgo');
}

it('reports exact summary KPIs', function (): void {
    ['owner' => $owner] = dashboardFixtures();

    $this->actingAs($owner, 'sanctum')
        ->getJson('/api/v1/dashboard/summary')
        ->assertOk()
        ->assertJsonPath('data.revenue_today', 135000)
        ->assertJsonPath('data.orders_today', 2)
        ->assertJsonPath('data.in_progress', 1)
        ->assertJsonPath('data.ready_for_pickup', 1)
        ->assertJsonPath('data.outstanding_payment', 150000);
});

it('hides revenue figures from cashiers', function (): void {
    ['kasir' => $kasir] = dashboardFixtures();

    $this->actingAs($kasir, 'sanctum')
        ->getJson('/api/v1/dashboard/summary')
        ->assertOk()
        ->assertJsonMissingPath('data.revenue_today')
        ->assertJsonPath('data.orders_today', 2)
        ->assertJsonPath('data.outstanding_payment', 150000);

    $this->actingAs($kasir, 'sanctum')
        ->getJson('/api/v1/dashboard/revenue')
        ->assertForbidden();

    $this->actingAs($kasir, 'sanctum')
        ->getJson('/api/v1/dashboard/top-services')
        ->assertForbidden();

    $this->actingAs($kasir, 'sanctum')
        ->getJson('/api/v1/dashboard/payment-methods')
        ->assertForbidden();

    $this->actingAs($kasir, 'sanctum')
        ->getJson('/api/v1/dashboard/orders')
        ->assertForbidden();
});

it('reports revenue by day excluding cancelled orders', function (): void {
    ['owner' => $owner, 'tenDaysAgo' => $tenDaysAgo] = dashboardFixtures();
    $today = today()->toDateString();

    $response = $this->actingAs($owner, 'sanctum')
        ->getJson("/api/v1/dashboard/revenue?period=custom&start_date={$tenDaysAgo->toDateString()}&end_date={$today}")
        ->assertOk();

    $days = $response->json('data');

    expect($days)->toHaveCount(11)
        ->and($days[0])->toBe(['date' => $tenDaysAgo->toDateString(), 'revenue' => 60000, 'orders' => 1])
        ->and($days[10])->toBe(['date' => $today, 'revenue' => 135000, 'orders' => 2])
        ->and($days[5])->toBe(['date' => $tenDaysAgo->copy()->addDays(5)->toDateString(), 'revenue' => 0, 'orders' => 0]);
});

it('ranks top services by snapshot revenue', function (): void {
    ['owner' => $owner, 's1' => $s1, 's2' => $s2, 'tenDaysAgo' => $tenDaysAgo] = dashboardFixtures();

    $this->actingAs($owner, 'sanctum')
        ->getJson("/api/v1/dashboard/top-services?period=custom&start_date={$tenDaysAgo->toDateString()}&end_date=".today()->toDateString())
        ->assertOk()
        ->assertJsonPath('data.0.service_id', $s2->id)
        ->assertJsonPath('data.0.revenue', 120000)
        ->assertJsonPath('data.0.orders_count', 2)
        ->assertJsonPath('data.1.service_id', $s1->id)
        ->assertJsonPath('data.1.revenue', 75000)
        ->assertJsonPath('data.1.orders_count', 2);
});

it('reports payment methods on receipt basis excluding refunds', function (): void {
    ['owner' => $owner, 'tenDaysAgo' => $tenDaysAgo] = dashboardFixtures();

    $base = "/api/v1/dashboard/payment-methods?period=custom&start_date={$tenDaysAgo->toDateString()}&end_date=".today()->toDateString();

    $this->actingAs($owner, 'sanctum')
        ->getJson($base)
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.method', Payment::METHOD_QRIS)
        ->assertJsonPath('data.0.total', 25000)
        ->assertJsonPath('data.0.transactions', 1)
        ->assertJsonPath('data.1.method', Payment::METHOD_CASH)
        ->assertJsonPath('data.1.total', 20000);

    // A later refund must not move receipt-basis figures.
    $paidOrder = Order::query()->where('payment_status', Order::PAYMENT_PAID)->firstOrFail();

    $this->actingAs($owner, 'sanctum')
        ->postJson("/api/v1/orders/{$paidOrder->id}/payments", [
            'type' => Payment::TYPE_REFUND, 'method' => Payment::METHOD_CASH, 'amount' => 5000,
        ])
        ->assertCreated();

    $this->actingAs($owner, 'sanctum')
        ->getJson($base)
        ->assertOk()
        ->assertJsonPath('data.0.total', 25000)
        ->assertJsonPath('data.1.total', 20000);
});

it('validates dashboard filters and requires auth', function (): void {
    ['owner' => $owner] = dashboardFixtures();

    $this->getJson('/api/v1/dashboard/summary')->assertUnauthorized();

    $this->actingAs($owner, 'sanctum')
        ->getJson('/api/v1/dashboard/revenue?period=bogus')
        ->assertUnprocessable();

    $this->actingAs($owner, 'sanctum')
        ->getJson('/api/v1/dashboard/revenue?period=custom')
        ->assertUnprocessable();

    $this->actingAs($owner, 'sanctum')
        ->getJson('/api/v1/dashboard/revenue?period=today')
        ->assertOk()
        ->assertJsonCount(1, 'data');
});
