<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Setting;

/**
 * Business configuration store (PRD backend §20a).
 *
 * Simple key/value rows with code defaults — no migration is ever
 * needed to add a setting. The notification health block is derived
 * live (never stored) so the settings page always shows the truth.
 */
class SettingsService
{
    public const KEY_STORE_NAME = 'store_name';

    public const KEY_STORE_PHONE = 'store_phone';

    public const KEY_STORE_ADDRESS = 'store_address';

    public const KEY_RECEIPT_FOOTER = 'receipt_footer';

    public const KEY_TIMEZONE = 'timezone';

    public function all(): array
    {
        $stored = Setting::query()->pluck('value', 'key')->all();

        return [
            self::KEY_STORE_NAME => $stored[self::KEY_STORE_NAME] ?? config('app.name'),
            self::KEY_STORE_PHONE => $stored[self::KEY_STORE_PHONE] ?? null,
            self::KEY_STORE_ADDRESS => $stored[self::KEY_STORE_ADDRESS] ?? null,
            self::KEY_RECEIPT_FOOTER => $stored[self::KEY_RECEIPT_FOOTER] ?? null,
            self::KEY_TIMEZONE => $stored[self::KEY_TIMEZONE] ?? 'Asia/Jakarta',
        ];
    }

    /**
     * @param array<string, mixed> $values
     */
    public function set(array $values): array
    {
        foreach ($values as $key => $value) {
            Setting::query()->updateOrCreate(
                ['key' => $key],
                ['value' => $value === null ? null : (string) $value]
            );
        }

        return $this->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function notificationStatus(): array
    {
        $config = config('notifications.whatsapp', []);
        $since = now()->subDay();

        return [
            'whatsapp' => [
                'enabled' => (bool) ($config['enabled'] ?? false),
                'configured' => ! empty($config['phone_number_id']) && ! empty($config['access_token']),
                'last_24h' => [
                    'sent' => Notification::query()
                        ->where('status', Notification::STATUS_SENT)
                        ->where('created_at', '>=', $since)
                        ->count(),
                    'failed' => Notification::query()
                        ->where('status', Notification::STATUS_FAILED)
                        ->where('created_at', '>=', $since)
                        ->count(),
                ],
            ],
        ];
    }
}
