<?php

use App\Models\Customer;
use App\Models\Discount;
use App\Models\Order;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Support\Str;

function orderFixtures(): array
{
    $category = ServiceCategory::factory()->create();
    $s1 = Service::factory()->create(['category_id' => $category->id, 'price' => 25000]);
    $s2 = Service::factory()->create(['category_id' => $category->id, 'price' => 60000]);
    $customer = Customer::factory()->create();
    $kasir = User::factory()->create(['role' => User::ROLE_CASHIER]);

    return compact('s1', 's2', 'customer', 'kasir', 'category');
}

function orderPayload(Customer $customer, array $serviceSets, ?int $discountId = null): array
{
    $brands = ['Nike', 'Adidas', 'Puma', 'Vans', 'Converse'];

    return [
        'customer_id' => $customer->id,
        'discount_id' => $discountId,
        'items' => array_map(
            fn ($services, $i) => [
                'brand' => $brands[$i % count($brands)],
                'model' => 'Air Test',
                'shoe_type' => 'Sneakers',
                'services' => $services,
            ],
            $serviceSets,
            array_keys($serviceSets)
        ),
    ];
}

it('creates multi-item orders with exact server-side totals', function (): void {
    ['s1' => $s1, 's2' => $s2, 'customer' => $customer, 'kasir' => $kasir] = orderFixtures();
    $discount = Discount::factory()->create(['type' => Discount::TYPE_PERCENT, 'value' => 10]);

    $response = $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/orders', orderPayload($customer, [[$s1->id, $s2->id], [$s2->id]], $discount->id));

    // subtotal = 25000 + 60000 + 60000 = 145000
    // discount = floor(145000 * 10 / 100) = 14500
    // grand total = 130500
    $response->assertCreated()
        ->assertJsonPath('data.subtotal', 145000)
        ->assertJsonPath('data.discount_value', 14500)
        ->assertJsonPath('data.grand_total', 130500)
        ->assertJsonPath('data.paid_total', 0)
        ->assertJsonPath('data.remaining_balance', 130500)
        ->assertJsonPath('data.status', Order::STATUS_RECEIVED)
        ->assertJsonPath('data.payment_status', Order::PAYMENT_UNPAID)
        ->assertJsonPath('data.items_count', 2);

    $orderNumber = $response->json('data.order_number');
    expect($orderNumber)->toMatch('/^ORD-\d{8}-\d{4,}$/');

    $order = Order::query()->where('order_number', $orderNumber)->firstOrFail();

    expect($order->statusHistories)->toHaveCount(1)
        ->and($order->statusHistories->first()->to_status)->toBe(Order::STATUS_RECEIVED)
        ->and($order->statusHistories->first()->from_status)->toBeNull();
});

it('freezes price snapshots against later master changes', function (): void {
    ['s1' => $s1, 's2' => $s2, 'customer' => $customer, 'kasir' => $kasir] = orderFixtures();
    $owner = User::factory()->create(['role' => User::ROLE_OWNER]);

    $id = $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/orders', orderPayload($customer, [[$s1->id]]))
        ->assertCreated()
        ->json('data.id');

    $this->actingAs($owner, 'sanctum')
        ->putJson("/api/v1/services/{$s1->id}", ['price' => 99999])
        ->assertOk();

    $this->actingAs($kasir, 'sanctum')
        ->getJson("/api/v1/orders/{$id}")
        ->assertOk()
        ->assertJsonPath('data.grand_total', 25000)
        ->assertJsonPath('data.items.0.services.0.unit_price', 25000);
});

it('clamps fixed discounts and marks free orders paid', function (): void {
    ['s1' => $s1, 'customer' => $customer, 'kasir' => $kasir] = orderFixtures();
    $big = Discount::factory()->create(['type' => Discount::TYPE_FIXED, 'value' => 100000, 'min_order_subtotal' => null]);
    $full = Discount::factory()->create(['type' => Discount::TYPE_PERCENT, 'value' => 100, 'min_order_subtotal' => null]);

    // subtotal 25000, FIXED 100000 -> clamped to 25000, grand 0.
    $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/orders', orderPayload($customer, [[$s1->id]], $big->id))
        ->assertCreated()
        ->assertJsonPath('data.discount_value', 25000)
        ->assertJsonPath('data.grand_total', 0)
        ->assertJsonPath('data.payment_status', Order::PAYMENT_PAID);

    // 100% percent discount -> grand 0 -> PAID as well.
    $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/orders', orderPayload($customer, [[$s1->id]], $full->id))
        ->assertCreated()
        ->assertJsonPath('data.grand_total', 0)
        ->assertJsonPath('data.payment_status', Order::PAYMENT_PAID);
});

it('deduplicates retried order creation by idempotency key', function (): void {
    ['s1' => $s1, 'customer' => $customer, 'kasir' => $kasir] = orderFixtures();
    $key = (string) Str::uuid();

    $first = $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/orders', orderPayload($customer, [[$s1->id]]), ['Idempotency-Key' => $key])
        ->assertCreated();

    $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/orders', orderPayload($customer, [[$s1->id]]), ['Idempotency-Key' => $key])
        ->assertOk()
        ->assertJsonPath('data.id', $first->json('data.id'))
        ->assertJsonPath('data.order_number', $first->json('data.order_number'));

    expect(Order::count())->toBe(1);
});

it('rejects discount below minimum order subtotal', function (): void {
    ['s1' => $s1, 'customer' => $customer, 'kasir' => $kasir] = orderFixtures();
    $discount = Discount::factory()->create([
        'type' => Discount::TYPE_FIXED, 'value' => 5000, 'min_order_subtotal' => 100000,
    ]);

    $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/orders', orderPayload($customer, [[$s1->id]], $discount->id))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['discount_id']);
});

it('validates order payloads', function (array $mutate, string $field): void {
    ['s1' => $s1, 's2' => $s2, 'customer' => $customer, 'kasir' => $kasir] = orderFixtures();
    $inactiveService = Service::factory()->create(['active' => false]);
    $inactiveDiscount = Discount::factory()->create(['active' => false]);

    $payload = orderPayload($customer, [[$s1->id]]);

    foreach ($mutate as $key => $value) {
        data_set($payload, $key, $value);
    }

    // Resolve factory placeholders used by the dataset.
    $payload = json_decode(str_replace(
        ['@S1@', '@S2@', '@INACTIVE_SERVICE@', '@INACTIVE_DISCOUNT@', '@CUSTOMER@'],
        [$s1->id, $s2->id, $inactiveService->id, $inactiveDiscount->id, $customer->id],
        json_encode($payload)
    ), true);

    $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/orders', $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors([$field]);
})->with([
    'empty items' => [['items' => []], 'items'],
    'unknown customer' => [['customer_id' => 999999], 'customer_id'],
    'unknown service' => [['items.0.services' => [999999]], 'items.0.services.0'],
    'inactive service' => [['items.0.services' => ['@INACTIVE_SERVICE@']], 'items.0.services.0'],
    'duplicate service in item' => [['items.0.services' => ['@S1@', '@S1@']], 'items.0.services'],
    'inactive discount' => [['discount_id' => '@INACTIVE_DISCOUNT@'], 'discount_id'],
    'missing brand' => [['items.0.brand' => null], 'items.0.brand'],
]);

it('rejects unauthenticated order access', function (): void {
    $this->getJson('/api/v1/orders')->assertUnauthorized();
    $this->postJson('/api/v1/orders', [])->assertUnauthorized();
});

it('keeps orders immutable except notes', function (): void {
    ['s1' => $s1, 'customer' => $customer, 'kasir' => $kasir] = orderFixtures();

    $id = $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/orders', orderPayload($customer, [[$s1->id]]))
        ->assertCreated()
        ->json('data.id');

    $this->actingAs($kasir, 'sanctum')
        ->putJson("/api/v1/orders/{$id}", ['items' => [['brand' => 'Sneaky']]])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['items']);

    $this->actingAs($kasir, 'sanctum')
        ->putJson("/api/v1/orders/{$id}", ['notes' => 'Prioritas, diambil Jumat.'])
        ->assertOk()
        ->assertJsonPath('data.notes', 'Prioritas, diambil Jumat.');
});

it('filters and searches the order list', function (): void {
    ['s1' => $s1, 'customer' => $customer, 'kasir' => $kasir] = orderFixtures();

    $first = $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/orders', orderPayload($customer, [[$s1->id]]))
        ->json('data');

    $this->actingAs($kasir, 'sanctum')
        ->getJson('/api/v1/orders?status=RECEIVED')
        ->assertOk()
        ->assertJsonPath('meta.total', 1);

    $this->actingAs($kasir, 'sanctum')
        ->getJson('/api/v1/orders?status=COMPLETED')
        ->assertOk()
        ->assertJsonPath('meta.total', 0);

    $this->actingAs($kasir, 'sanctum')
        ->getJson('/api/v1/orders?search='.$first['order_number'])
        ->assertOk()
        ->assertJsonPath('meta.total', 1);

    $this->actingAs($kasir, 'sanctum')
        ->getJson('/api/v1/orders?search='.urlencode(substr($customer->name, 0, 4)))
        ->assertOk()
        ->assertJsonPath('meta.total', 1);
});
