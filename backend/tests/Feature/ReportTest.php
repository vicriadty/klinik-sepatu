<?php

use App\Models\Customer;
use App\Models\Discount;
use App\Models\Order;
use App\Models\Payment;
use App\Models\ReportExport;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use App\Services\OrderService;
use App\Services\OrderStatusService;
use App\Services\PaymentService;
use Illuminate\Support\Facades\Storage;

function reportFixtures(): array
{
    $category = ServiceCategory::factory()->create();
    $s1 = Service::factory()->create(['category_id' => $category->id, 'price' => 25000]);
    $s2 = Service::factory()->create(['category_id' => $category->id, 'price' => 60000]);
    $owner = User::factory()->create(['role' => User::ROLE_OWNER]);
    $kasir = User::factory()->create(['role' => User::ROLE_CASHIER]);
    $andi = Customer::factory()->create(['name' => 'Andi Laporan']);
    $sari = Customer::factory()->create(['name' => 'Sari Laporan']);
    $discount = Discount::factory()->create(['type' => Discount::TYPE_PERCENT, 'value' => 10, 'min_order_subtotal' => null]);

    $orders = app(OrderService::class);
    $statuses = app(OrderStatusService::class);
    $payments = app(PaymentService::class);
    $twelveDaysAgo = today()->subDays(12);
    $threeDaysAgo = today()->subDays(3);

    $backdate = function (Order $order, $date): Order {
        $order->forceFill(['created_at' => $date, 'updated_at' => $date])->save();

        return $order->refresh();
    };

    $pay = function (Order $order, string $method, int $amount, User $actor, $date = null) use ($payments): void {
        [$payment] = $payments->record($order, ['method' => $method, 'amount' => $amount], $actor);

        if ($date) {
            $payment->forceFill(['created_at' => $date, 'updated_at' => $date])->save();
        }
    };

    // Old partially-paid order, in progress.
    [$o1] = $orders->create([
        'customer_id' => $andi->id,
        'items' => [['brand' => 'Nike', 'shoe_type' => 'Sneakers', 'services' => [$s1->id]]],
    ], $kasir);
    $o1 = $backdate($o1, $twelveDaysAgo);
    $statuses->transition($o1, Order::STATUS_ON_PROCESS);
    $pay($o1->refresh(), Payment::METHOD_CASH, 10000, $kasir, $twelveDaysAgo);

    // Older fully-paid order with discount, ready for pickup.
    [$o2] = $orders->create([
        'customer_id' => $sari->id,
        'discount_id' => $discount->id,
        'items' => [['brand' => 'Adidas', 'shoe_type' => 'Sneakers', 'services' => [$s1->id, $s2->id]]],
    ], $kasir);
    $o2 = $backdate($o2, $threeDaysAgo);
    $statuses->transition($o2, Order::STATUS_ON_PROCESS);
    $statuses->transition($o2->refresh(), Order::STATUS_READY_FOR_PICKUP);
    $pay($o2->refresh(), Payment::METHOD_TRANSFER, 76500, $kasir, $threeDaysAgo);

    // Today's unpaid order.
    [$o3] = $orders->create([
        'customer_id' => $andi->id,
        'items' => [['brand' => 'Vans', 'shoe_type' => 'Sneakers', 'services' => [$s2->id]]],
    ], $kasir);

    // Today's cancelled order: invisible everywhere.
    [$o4] = $orders->create([
        'customer_id' => $sari->id,
        'items' => [['brand' => 'Puma', 'shoe_type' => 'Sneakers', 'services' => [$s1->id]]],
    ], $kasir);
    $statuses->transition($o4, Order::STATUS_CANCELLED);

    return compact('s1', 's2', 'owner', 'kasir', 'o1', 'o2', 'o3');
}

it('lists transactions with exact row shape', function (): void {
    ['owner' => $owner, 's1' => $s1, 's2' => $s2] = reportFixtures();

    $response = $this->actingAs($owner, 'sanctum')
        ->getJson('/api/v1/reports/transactions')
        ->assertOk()
        ->assertJsonPath('meta.total', 3);

    $rows = collect($response->json('data'))->keyBy('order_number');

    expect(array_keys($rows->first()))
        ->toBe(['order_number', 'date', 'customer', 'service', 'qty', 'subtotal', 'discount', 'grand_total', 'payment_method', 'payment_status', 'order_status']);

    $o2 = $rows->firstWhere('grand_total', 76500);

    expect($o2['subtotal'])->toBe(85000)
        ->and($o2['discount'])->toBe(8500)
        ->and($o2['qty'])->toBe(1)
        ->and($o2['payment_method'])->toBe('TRANSFER')
        ->and($o2['payment_status'])->toBe('PAID')
        ->and($o2['customer'])->toBe('Sari Laporan')
        ->and($o2['service'])->toContain($s1->name)
        ->and($o2['service'])->toContain($s2->name)
        ->and($o2['date'])->toBe(today()->subDays(3)->toDateString());
});

it('filters transactions by status, payment, service, and search', function (): void {
    ['owner' => $owner, 's1' => $s1, 'o3' => $o3] = reportFixtures();
    $get = fn (string $q) => $this->actingAs($owner, 'sanctum')->getJson("/api/v1/reports/transactions?{$q}");

    $get('status=RECEIVED')->assertOk()->assertJsonPath('meta.total', 1);
    $get('payment_status=PAID')->assertOk()->assertJsonPath('meta.total', 1);
    $get('payment_status=PARTIAL')->assertOk()->assertJsonPath('meta.total', 1);
    $get("service_id={$s1->id}")->assertOk()->assertJsonPath('meta.total', 2);
    $get('search='.$o3->order_number)->assertOk()->assertJsonPath('meta.total', 1);
    $get('search=andi')->assertOk()->assertJsonPath('meta.total', 2);
});

it('summarizes revenue on order-date basis', function (): void {
    ['owner' => $owner] = reportFixtures();

    $this->actingAs($owner, 'sanctum')
        ->getJson('/api/v1/reports/revenue')
        ->assertOk()
        ->assertJsonPath('data.total_revenue', 161500)
        ->assertJsonPath('data.total_orders', 3)
        ->assertJsonPath('data.total_discount', 8500)
        ->assertJsonPath('data.total_collected', 86500)
        ->assertJsonPath('data.total_outstanding', 75000);

    // Today only: the single unpaid order.
    $today = today()->toDateString();

    $this->actingAs($owner, 'sanctum')
        ->getJson("/api/v1/reports/revenue?start_date={$today}&end_date={$today}")
        ->assertOk()
        ->assertJsonPath('data.total_revenue', 60000)
        ->assertJsonPath('data.total_orders', 1);
});

it('ranks service performance', function (): void {
    ['owner' => $owner, 's1' => $s1, 's2' => $s2] = reportFixtures();

    $this->actingAs($owner, 'sanctum')
        ->getJson('/api/v1/reports/services')
        ->assertOk()
        ->assertJsonPath('data.0.service_id', $s2->id)
        ->assertJsonPath('data.0.revenue', 120000)
        ->assertJsonPath('data.0.orders_count', 2)
        ->assertJsonPath('data.1.service_id', $s1->id)
        ->assertJsonPath('data.1.revenue', 50000)
        ->assertJsonPath('data.1.orders_count', 2);
});

it('ranks customers by spend', function (): void {
    ['owner' => $owner] = reportFixtures();

    $this->actingAs($owner, 'sanctum')
        ->getJson('/api/v1/reports/customers')
        ->assertOk()
        ->assertJsonPath('data.0.name', 'Andi Laporan')
        ->assertJsonPath('data.0.orders_count', 2)
        ->assertJsonPath('data.0.total_spent', 85000)
        ->assertJsonPath('data.1.name', 'Sari Laporan')
        ->assertJsonPath('data.1.total_spent', 76500);
});

it('runs the full export flow to download', function (): void {
    ['owner' => $owner] = reportFixtures();

    $id = $this->actingAs($owner, 'sanctum')
        ->postJson('/api/v1/reports/exports', ['type' => 'transactions'])
        ->assertAccepted()
        ->assertJsonPath('data.status', 'COMPLETED')
        ->json('data.id');

    $export = \App\Models\ReportExport::findOrFail($id);

    expect($export->file_path)->not->toBeNull()
        ->and(Storage::disk('local')->exists($export->file_path))->toBeTrue();

    $this->actingAs($owner, 'sanctum')
        ->getJson("/api/v1/reports/exports/{$id}")
        ->assertOk()
        ->assertJsonPath('data.download_url', url("/api/v1/reports/exports/{$id}/download"));

    $this->actingAs($owner, 'sanctum')
        ->getJson('/api/v1/reports/exports')
        ->assertOk()
        ->assertJsonPath('meta.total', 1);

    $download = $this->actingAs($owner, 'sanctum')
        ->get("/api/v1/reports/exports/{$id}/download")
        ->assertOk();

    expect($download->headers->get('Content-Type'))
        ->toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
});

it('validates export requests and guards access', function (): void {
    ['owner' => $owner, 'kasir' => $kasir] = reportFixtures();

    $this->getJson('/api/v1/reports/revenue')->assertUnauthorized();

    $this->actingAs($owner, 'sanctum')
        ->postJson('/api/v1/reports/exports', ['type' => 'bogus'])
        ->assertUnprocessable();

    $this->actingAs($kasir, 'sanctum')
        ->getJson('/api/v1/reports/transactions')
        ->assertForbidden();

    $this->actingAs($kasir, 'sanctum')
        ->postJson('/api/v1/reports/exports', ['type' => 'transactions'])
        ->assertForbidden();
});
