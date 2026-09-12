<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'event', 'channel', 'recipient_phone', 'order_id', 'payload',
    'status', 'provider_message_id', 'error', 'attempts',
])]
class Notification extends Model
{
    public const EVENT_ORDER_RECEIVED = 'ORDER_RECEIVED_RECEIPT';

    public const EVENT_PAYMENT_RECEIVED = 'PAYMENT_RECEIVED';

    public const EVENT_READY_FOR_PICKUP = 'ORDER_READY_FOR_PICKUP';

    public const EVENT_COMPLETED = 'ORDER_COMPLETED';

    public const EVENTS = [
        self::EVENT_ORDER_RECEIVED,
        self::EVENT_PAYMENT_RECEIVED,
        self::EVENT_READY_FOR_PICKUP,
        self::EVENT_COMPLETED,
    ];

    public const CHANNEL_WHATSAPP = 'whatsapp';

    public const STATUS_PENDING = 'PENDING';

    public const STATUS_PROCESSING = 'PROCESSING';

    public const STATUS_SENT = 'SENT';

    public const STATUS_FAILED = 'FAILED';

    public const STATUS_SKIPPED = 'SKIPPED';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'attempts' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
