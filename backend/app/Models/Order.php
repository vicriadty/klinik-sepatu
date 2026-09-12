<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'order_number', 'customer_id', 'status', 'payment_status',
    'discount_id', 'subtotal', 'discount_value', 'grand_total',
    'paid_total', 'client_request_id', 'notes',
])]
class Order extends Model
{
    public const STATUS_RECEIVED = 'RECEIVED';

    public const STATUS_ON_PROCESS = 'ON_PROCESS';

    public const STATUS_READY_FOR_PICKUP = 'READY_FOR_PICKUP';

    public const STATUS_COMPLETED = 'COMPLETED';

    public const STATUS_CANCELLED = 'CANCELLED';

    public const STATUSES = [
        self::STATUS_RECEIVED,
        self::STATUS_ON_PROCESS,
        self::STATUS_READY_FOR_PICKUP,
        self::STATUS_COMPLETED,
        self::STATUS_CANCELLED,
    ];

    public const TRANSITIONS = [
        self::STATUS_RECEIVED => [self::STATUS_ON_PROCESS, self::STATUS_CANCELLED],
        self::STATUS_ON_PROCESS => [self::STATUS_READY_FOR_PICKUP, self::STATUS_CANCELLED],
        self::STATUS_READY_FOR_PICKUP => [self::STATUS_COMPLETED],
        self::STATUS_COMPLETED => [],
        self::STATUS_CANCELLED => [],
    ];

    public const PAYMENT_UNPAID = 'UNPAID';

    public const PAYMENT_PARTIAL = 'PARTIAL';

    public const PAYMENT_PAID = 'PAID';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subtotal' => 'integer',
            'discount_value' => 'integer',
            'grand_total' => 'integer',
            'paid_total' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Customer, $this>
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * @return BelongsTo<Discount, $this>
     */
    public function discount(): BelongsTo
    {
        return $this->belongsTo(Discount::class);
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * @return HasMany<OrderStatusHistory, $this>
     */
    public function statusHistories(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class)->latest('id');
    }

    /**
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->oldest('id');
    }

    public function remainingBalance(): int
    {
        return $this->grand_total - $this->paid_total;
    }

    public static function derivePaymentStatus(int $paidTotal, int $grandTotal): string
    {
        if ($paidTotal >= $grandTotal) {
            return self::PAYMENT_PAID;
        }

        return $paidTotal > 0 ? self::PAYMENT_PARTIAL : self::PAYMENT_UNPAID;
    }
}
