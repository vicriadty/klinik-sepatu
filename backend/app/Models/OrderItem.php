<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'order_id', 'brand', 'model', 'color', 'shoe_type',
    'customer_note', 'internal_note',
])]
class OrderItem extends Model
{
    /**
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * @return HasMany<OrderItemService, $this>
     */
    public function itemServices(): HasMany
    {
        return $this->hasMany(OrderItemService::class);
    }

    public function subtotal(): int
    {
        return $this->itemServices->sum('unit_price');
    }
}
