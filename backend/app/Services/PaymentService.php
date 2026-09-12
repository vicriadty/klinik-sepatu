<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Support\AuditLog;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Payment recording with server-derived balances (ADR-0002).
 *
 * Payments and refunds share one table distinguished by `type`;
 * paid_total is always recomputed (never client-supplied) and the
 * payment_status follows it. Everything runs in one transaction.
 */
class PaymentService
{
    /**
     * @param array<string, mixed> $data Validated payload.
     * @return array{0: Payment, 1: bool} The payment and whether it was created (false = idempotent replay).
     */
    public function record(Order $order, array $data, ?User $actor = null, ?string $idempotencyKey = null): array
    {
        return DB::transaction(function () use ($order, $data, $actor, $idempotencyKey) {
            if ($idempotencyKey) {
                $existing = Payment::query()->where('client_request_id', $idempotencyKey)->first();

                if ($existing) {
                    return [$existing, false];
                }
            }

            if ($order->status === Order::STATUS_CANCELLED) {
                throw ValidationException::withMessages([
                    'order' => 'Cannot record payments on a cancelled order.',
                ]);
            }

            $type = $data['type'] ?? Payment::TYPE_PAYMENT;
            $newPaid = $type === Payment::TYPE_REFUND
                ? $order->paid_total - $data['amount']
                : $order->paid_total + $data['amount'];

            if ($newPaid > $order->grand_total) {
                throw ValidationException::withMessages([
                    'amount' => "Payment exceeds the remaining balance of Rp{$order->remainingBalance()}.",
                ]);
            }

            if ($newPaid < 0) {
                throw ValidationException::withMessages([
                    'amount' => 'Refund exceeds the total amount paid.',
                ]);
            }

            $payment = $order->payments()->create([
                'type' => $type,
                'method' => $data['method'],
                'amount' => $data['amount'],
                'note' => $data['note'] ?? null,
                'received_by_user_id' => $actor?->getKey(),
                'client_request_id' => $idempotencyKey,
            ]);

            $order->forceFill([
                'paid_total' => $newPaid,
                'payment_status' => Order::derivePaymentStatus($newPaid, $order->grand_total),
            ])->save();

            AuditLog::record(
                $type === Payment::TYPE_REFUND ? 'PAYMENT_REFUNDED' : 'PAYMENT_CREATED',
                'payment',
                $payment->id,
                null,
                ['order_id' => $order->id, 'type' => $type, 'method' => $payment->method, 'amount' => $payment->amount],
                $actor
            );

            return [$payment, true];
        });
    }
}
