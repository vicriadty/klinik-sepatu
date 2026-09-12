<?php

use App\Models\Customer;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Support\Str;

function paymentFixtures(): array
{
    $category = ServiceCategory::factory()->create();
    $service = Service::factory()->create(['category_id' => $category->id, 'price' => 40000]);
    $customer = Customer::factory()->create();
    $kasir = User::factory()->create(['role' => User::ROLE_CASHIER]);
    $owner = User::factory()->create(['role' => User::ROLE_OWNER]);

    // Built via the domain service (not HTTP) so no auth state leaks
    // into the shared test app before unauthenticated assertions.
    [$order] = app(\App\Services\OrderService::class)->create([
        'customer_id' => $customer->id,
        'items' => [['brand' => 'Nike', 'shoe_type' => 'Sneakers', 'services' => [$service->id]]],
    ], $kasir);

    return ['id' => $order->id, 'kasir' => $kasir, 'owner' => $owner];
}

it('records partial then full payments with derived statuses', function (): void {
    ['id' => $id, 'kasir' => $kasir] = paymentFixtures();

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/payments", [
            'method' => Payment::METHOD_CASH,
            'amount' => 15000,
        ])
        ->assertCreated()
        ->assertJsonPath('data.type', Payment::TYPE_PAYMENT)
        ->assertJsonPath('data.amount', 15000)
        ->assertJsonPath('data.received_by_user_id', $kasir->id);

    $this->actingAs($kasir, 'sanctum')
        ->getJson("/api/v1/orders/{$id}")
        ->assertOk()
        ->assertJsonPath('data.payment_status', Order::PAYMENT_PARTIAL)
        ->assertJsonPath('data.paid_total', 15000)
        ->assertJsonPath('data.remaining_balance', 25000);

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/payments", [
            'method' => Payment::METHOD_QRIS,
            'amount' => 25000,
        ])
        ->assertCreated();

    $this->actingAs($kasir, 'sanctum')
        ->getJson("/api/v1/orders/{$id}")
        ->assertOk()
        ->assertJsonPath('data.payment_status', Order::PAYMENT_PAID)
        ->assertJsonPath('data.remaining_balance', 0);
});

it('rejects overpayments', function (): void {
    ['id' => $id, 'kasir' => $kasir] = paymentFixtures();

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/payments", [
            'method' => Payment::METHOD_CASH,
            'amount' => 40001,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['amount']);
});

it('processes refunds within the paid balance', function (): void {
    ['id' => $id, 'kasir' => $kasir, 'owner' => $owner] = paymentFixtures();

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/payments", [
            'method' => Payment::METHOD_TRANSFER,
            'amount' => 40000,
        ])
        ->assertCreated();

    // Cashiers cannot refund; owners can.
    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/payments", [
            'type' => Payment::TYPE_REFUND,
            'method' => Payment::METHOD_CASH,
            'amount' => 10000,
        ])
        ->assertForbidden();

    $this->actingAs($owner, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/payments", [
            'type' => Payment::TYPE_REFUND,
            'method' => Payment::METHOD_CASH,
            'amount' => 10000,
            'note' => 'Double charge correction.',
        ])
        ->assertCreated()
        ->assertJsonPath('data.type', Payment::TYPE_REFUND);

    $this->actingAs($owner, 'sanctum')
        ->getJson("/api/v1/orders/{$id}")
        ->assertOk()
        ->assertJsonPath('data.payment_status', Order::PAYMENT_PARTIAL)
        ->assertJsonPath('data.paid_total', 30000);

    // Refunding more than paid is rejected.
    $this->actingAs($owner, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/payments", [
            'type' => Payment::TYPE_REFUND,
            'method' => Payment::METHOD_CASH,
            'amount' => 30001,
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['amount']);
});

it('deduplicates retried payments by idempotency key', function (): void {
    ['id' => $id, 'kasir' => $kasir] = paymentFixtures();
    $key = (string) Str::uuid();
    $payload = ['method' => Payment::METHOD_CASH, 'amount' => 10000];

    $first = $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/payments", $payload, ['Idempotency-Key' => $key])
        ->assertCreated();

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/payments", $payload, ['Idempotency-Key' => $key])
        ->assertOk()
        ->assertJsonPath('data.id', $first->json('data.id'));

    expect(Payment::where('order_id', $id)->count())->toBe(1);
});

it('validates payment input', function (): void {
    ['id' => $id, 'kasir' => $kasir] = paymentFixtures();

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/payments", ['method' => 'VOUCHER', 'amount' => 1000])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['method']);

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/payments", ['method' => 'CASH', 'amount' => 0])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['amount']);

    $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/orders/999999/payments', ['method' => 'CASH', 'amount' => 1000])
        ->assertNotFound();
});

it('rejects payments on cancelled orders', function (): void {
    ['id' => $id, 'kasir' => $kasir] = paymentFixtures();

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/cancel")
        ->assertOk();

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/payments", ['method' => 'CASH', 'amount' => 1000])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['order']);
});

it('lists payments chronologically and requires auth', function (): void {
    ['id' => $id, 'kasir' => $kasir, 'owner' => $owner] = paymentFixtures();

    $this->getJson("/api/v1/orders/{$id}/payments")->assertUnauthorized();

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/payments", ['method' => 'CASH', 'amount' => 40000])
        ->assertCreated();

    $this->actingAs($owner, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/payments", [
            'type' => Payment::TYPE_REFUND, 'method' => 'CASH', 'amount' => 5000,
        ])
        ->assertCreated();

    $this->actingAs($kasir, 'sanctum')
        ->getJson("/api/v1/orders/{$id}/payments")
        ->assertOk()
        ->assertJsonPath('meta.total', 2)
        ->assertJsonPath('data.0.type', Payment::TYPE_PAYMENT)
        ->assertJsonPath('data.1.type', Payment::TYPE_REFUND)
        ->assertJsonPath('data.0.receiver.username', $kasir->username);
});

it('completes fully paid orders end to end', function (): void {
    ['id' => $id, 'kasir' => $kasir] = paymentFixtures();

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/payments", ['method' => 'CASH', 'amount' => 40000])
        ->assertCreated();

    foreach ([Order::STATUS_ON_PROCESS, Order::STATUS_READY_FOR_PICKUP, Order::STATUS_COMPLETED] as $next) {
        $this->actingAs($kasir, 'sanctum')
            ->postJson("/api/v1/orders/{$id}/status", ['status' => $next])
            ->assertOk();
    }

    expect(Order::find($id)->status)->toBe(Order::STATUS_COMPLETED);
});

it('cancels paid orders only after full refund', function (): void {
    ['id' => $id, 'kasir' => $kasir, 'owner' => $owner] = paymentFixtures();

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/payments", ['method' => 'CASH', 'amount' => 40000])
        ->assertCreated();

    // Still blocked while balance remains.
    $this->actingAs($owner, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/cancel")
        ->assertUnprocessable();

    $this->actingAs($owner, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/payments", [
            'type' => Payment::TYPE_REFUND, 'method' => 'CASH', 'amount' => 40000,
        ])
        ->assertCreated();

    $this->actingAs($owner, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/cancel", ['reason' => 'Refunded in full.'])
        ->assertOk()
        ->assertJsonPath('data.status', Order::STATUS_CANCELLED);
});

it('ignores spoofed receiver ids', function (): void {
    ['id' => $id, 'kasir' => $kasir, 'owner' => $owner] = paymentFixtures();

    $this->actingAs($kasir, 'sanctum')
        ->postJson("/api/v1/orders/{$id}/payments", [
            'method' => 'CASH',
            'amount' => 5000,
            'received_by_user_id' => $owner->id,
        ])
        ->assertCreated()
        ->assertJsonPath('data.received_by_user_id', $kasir->id);
});
