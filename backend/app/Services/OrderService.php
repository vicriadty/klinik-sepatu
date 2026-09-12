<?php

namespace App\Services;

use App\Models\Discount;
use App\Models\Order;
use App\Models\Service;
use App\Models\User;
use App\Support\AuditLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Order creation with server-side pricing (ADR-0002, ADR-0004).
 *
 * Everything happens inside one transaction: idempotency check, order
 * number allocation, price snapshots, totals, and the initial history
 * row. Either the whole order exists or nothing does.
 */
class OrderService
{
    public function __construct(private OrderNumberGenerator $numbers)
    {
    }

    /**
     * @param array<string, mixed> $data Validated payload.
     * @return array{0: Order, 1: bool} The order and whether it was created (false = idempotent replay).
     */
    public function create(array $data, ?User $actor = null, ?string $idempotencyKey = null): array
    {
        return DB::transaction(function () use ($data, $actor, $idempotencyKey) {
            if ($idempotencyKey) {
                $existing = Order::query()->where('client_request_id', $idempotencyKey)->first();

                if ($existing) {
                    return [$existing, false];
                }
            }

            $serviceIds = collect($data['items'])->pluck('services')->flatten()->unique()->values();
            $services = Service::query()->whereIn('id', $serviceIds)->get()->keyBy('id');

            $discount = isset($data['discount_id'])
                ? Discount::query()->findOrFail($data['discount_id'])
                : null;

            $subtotal = 0;
            foreach ($data['items'] as $item) {
                foreach ($item['services'] as $serviceId) {
                    $subtotal += $services->get($serviceId)->price;
                }
            }

            if ($discount && $discount->min_order_subtotal !== null && $subtotal < $discount->min_order_subtotal) {
                throw ValidationException::withMessages([
                    'discount_id' => "Discount requires a minimum order subtotal of Rp{$discount->min_order_subtotal}.",
                ]);
            }

            $discountValue = $this->discountValue($discount, $subtotal);
            $grandTotal = $subtotal - $discountValue;

            $order = Order::query()->create([
                'order_number' => $this->numbers->generate(),
                'customer_id' => $data['customer_id'],
                'status' => Order::STATUS_RECEIVED,
                'payment_status' => Order::derivePaymentStatus(0, $grandTotal),
                'discount_id' => $discount?->id,
                'subtotal' => $subtotal,
                'discount_value' => $discountValue,
                'grand_total' => $grandTotal,
                'paid_total' => 0,
                'client_request_id' => $idempotencyKey,
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $orderItem = $order->items()->create([
                    'brand' => $item['brand'],
                    'model' => $item['model'] ?? null,
                    'color' => $item['color'] ?? null,
                    'shoe_type' => $item['shoe_type'],
                    'customer_note' => $item['customer_note'] ?? null,
                    'internal_note' => $item['internal_note'] ?? null,
                ]);

                foreach ($item['services'] as $serviceId) {
                    $service = $services->get($serviceId);

                    $orderItem->itemServices()->create([
                        'service_id' => $service->id,
                        'service_name' => $service->name,
                        'unit_price' => $service->price,
                    ]);
                }
            }

            $order->statusHistories()->create([
                'from_status' => null,
                'to_status' => Order::STATUS_RECEIVED,
                'actor_user_id' => $actor?->getKey(),
            ]);

            AuditLog::record('ORDER_CREATED', 'order', $order->id, null, [
                'order_number' => $order->order_number,
                'grand_total' => $order->grand_total,
            ], $actor);

            return [$order, true];
        });
    }

    private function discountValue(?Discount $discount, int $subtotal): int
    {
        if ($discount === null) {
            return 0;
        }

        if ($discount->type === Discount::TYPE_PERCENT) {
            return intdiv($subtotal * $discount->value, 100);
        }

        return min($discount->value, $subtotal);
    }
}
