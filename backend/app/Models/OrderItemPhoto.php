<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'order_item_id', 'type', 'path', 'thumbnail_path', 'mime', 'size',
])]
class OrderItemPhoto extends Model
{
    public const TYPE_BEFORE = 'BEFORE';

    public const TYPE_AFTER = 'AFTER';

    public const TYPE_DAMAGE = 'DAMAGE';

    public const TYPE_QC = 'QC';

    public const TYPES = [
        self::TYPE_BEFORE,
        self::TYPE_AFTER,
        self::TYPE_DAMAGE,
        self::TYPE_QC,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'size' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<OrderItem, $this>
     */
    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }
}
