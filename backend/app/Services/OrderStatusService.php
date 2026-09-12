<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\Support\AuditLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Order status transitions (ADR-0001).
 *
 * Enforces the transition matrix plus the settlement guards:
 * COMPLETED requires PAID; CANCELLED on a paid order requires the
 * refund flow (which lands with the payments feature — until then
 * cancelling a paid order is rejected).
 */
class OrderStatusService
{
    public function transition(Order $order, string $to, ?User $actor = null, ?string $note = null): Order
    {
        $from = $order->status;

        if (! in_array($to, Order::TRANSITIONS[$from] ?? [], true)) {
            throw ValidationException::withMessages([
                'status' => "Cannot transition order from {$from} to {$to}.",
            ]);
        }

        if ($to === Order::STATUS_COMPLETED && $order->payment_status !== Order::PAYMENT_PAID) {
            throw ValidationException::withMessages([
                'status' => 'Order must be fully paid before it can be completed.',
            ]);
        }

        if ($to === Order::STATUS_CANCELLED && $order->paid_total > 0) {
            throw ValidationException::withMessages([
                'status' => 'Order has payments; record a refund before cancelling.',
            ]);
        }

        return DB::transaction(function () use ($order, $from, $to, $actor, $note) {
            $order->forceFill(['status' => $to])->save();

            $order->statusHistories()->create([
                'from_status' => $from,
                'to_status' => $to,
                'actor_user_id' => $actor?->getKey(),
                'note' => $note,
            ]);

            AuditLog::record('STATUS_CHANGED', 'order', $order->id,
                ['status' => $from], ['status' => $to], $actor);

            if ($to === Order::STATUS_CANCELLED) {
                AuditLog::record('ORDER_CANCELLED', 'order', $order->id,
                    ['status' => $from], ['status' => $to], $actor);
            }

            return $order;
        });
    }
}
