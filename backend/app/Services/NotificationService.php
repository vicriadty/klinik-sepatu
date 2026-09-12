<?php

namespace App\Services;

use App\Jobs\SendWhatsAppNotification;
use App\Models\Customer;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Payment;

/**
 * Customer notification orchestration (ADR-0006).
 *
 * The domain calls notify*() after the business transaction content is
 * final. This service only decides, records, and queues — delivery
 * happens in SendWhatsAppNotification. Notifications must never break
 * the business operation, so callers wrap these calls defensively.
 */
class NotificationService
{
    public function notifyOrderReceived(Order $order): void
    {
        $order->loadMissing('customer');

        $this->queue(
            Notification::EVENT_ORDER_RECEIVED,
            $order->customer,
            $order,
            [
                config('app.name'),
                $order->order_number,
                (string) $order->items()->count(),
                (string) $order->grand_total,
            ]
        );
    }

    public function notifyPaymentReceived(Order $order, Payment $payment): void
    {
        $order->loadMissing('customer');

        $this->queue(
            Notification::EVENT_PAYMENT_RECEIVED,
            $order->customer,
            $order,
            [
                $order->order_number,
                (string) $payment->amount,
                $payment->method,
                (string) $order->remainingBalance(),
            ]
        );
    }

    public function notifyReadyForPickup(Order $order): void
    {
        $order->loadMissing('customer');

        $this->queue(
            Notification::EVENT_READY_FOR_PICKUP,
            $order->customer,
            $order,
            [$order->order_number]
        );
    }

    public function notifyCompleted(Order $order): void
    {
        $order->loadMissing('customer');

        $this->queue(
            Notification::EVENT_COMPLETED,
            $order->customer,
            $order,
            [$order->order_number]
        );
    }

    private function queue(string $event, ?Customer $customer, ?Order $order, array $parameters): void
    {
        if (! config('notifications.whatsapp.enabled')) {
            return;
        }

        if (! $customer || ! $customer->phone || $customer->wa_opt_out) {
            Notification::query()->create([
                'event' => $event,
                'channel' => Notification::CHANNEL_WHATSAPP,
                'recipient_phone' => $customer?->phone ?? '-',
                'order_id' => $order?->id,
                'payload' => ['parameters' => $parameters],
                'status' => Notification::STATUS_SKIPPED,
            ]);

            return;
        }

        $notification = Notification::query()->create([
            'event' => $event,
            'channel' => Notification::CHANNEL_WHATSAPP,
            'recipient_phone' => $customer->phone,
            'order_id' => $order?->id,
            'payload' => ['parameters' => $parameters],
            'status' => Notification::STATUS_PENDING,
        ]);

        SendWhatsAppNotification::dispatch($notification->id);
    }
}
