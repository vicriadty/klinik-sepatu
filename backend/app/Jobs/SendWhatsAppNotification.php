<?php

namespace App\Jobs;

use App\Contracts\NotificationFailedException;
use App\Models\Notification;
use App\Services\WhatsApp\WhatsAppCloudProvider;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class SendWhatsAppNotification implements ShouldQueue
{
    use Queueable;

    public $tries = 3;

    public $backoff = [60, 300];

    public function __construct(public int $notificationId)
    {
    }

    public function handle(): void
    {
        $notification = Notification::query()->find($this->notificationId);

        if (! $notification || $notification->status !== Notification::STATUS_PENDING) {
            return;
        }

        if (! config('notifications.whatsapp.enabled')) {
            $notification->forceFill([
                'status' => Notification::STATUS_SKIPPED,
                'error' => 'WhatsApp channel disabled.',
            ])->save();

            return;
        }

        $notification->forceFill([
            'status' => Notification::STATUS_PROCESSING,
            'attempts' => $this->attempts(),
        ])->save();

        try {
            $templates = config('notifications.whatsapp.templates', []);
            $template = $templates[$notification->event] ?? null;

            if (! $template) {
                throw new NotificationFailedException("No template configured for event {$notification->event}.");
            }

            $messageId = WhatsAppCloudProvider::fromConfig()->send(
                $notification->recipient_phone,
                $template,
                $notification->payload['parameters'] ?? []
            );

            $notification->forceFill([
                'status' => Notification::STATUS_SENT,
                'provider_message_id' => $messageId,
                'error' => null,
            ])->save();
        } catch (\Throwable $e) {
            report($e);

            if ($this->attempts() >= 3) {
                $notification->forceFill([
                    'status' => Notification::STATUS_FAILED,
                    'error' => substr($e->getMessage(), 0, 500),
                ])->save();

                return;
            }

            throw $e;
        }
    }

    public function failed(\Throwable $exception): void
    {
        if ($notification = Notification::query()->find($this->notificationId)) {
            $notification->forceFill([
                'status' => Notification::STATUS_FAILED,
                'error' => substr($exception->getMessage(), 0, 500),
            ])->save();
        }
    }
}
