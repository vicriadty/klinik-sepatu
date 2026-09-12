<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'order_id', 'type', 'method', 'amount', 'note',
    'received_by_user_id', 'client_request_id',
])]
class Payment extends Model
{
    public const TYPE_PAYMENT = 'payment';

    public const TYPE_REFUND = 'refund';

    public const TYPES = [self::TYPE_PAYMENT, self::TYPE_REFUND];

    public const METHOD_CASH = 'CASH';

    public const METHOD_QRIS = 'QRIS';

    public const METHOD_TRANSFER = 'TRANSFER';

    public const METHODS = [self::METHOD_CASH, self::METHOD_QRIS, self::METHOD_TRANSFER];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by_user_id');
    }

    public function signedAmount(): int
    {
        return $this->type === self::TYPE_REFUND ? -$this->amount : $this->amount;
    }
}
