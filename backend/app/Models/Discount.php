<?php

namespace App\Models;

use Database\Factories\DiscountFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name', 'type', 'value', 'active', 'min_order_subtotal'])]
class Discount extends Model
{
    /** @use HasFactory<DiscountFactory> */
    use HasFactory, SoftDeletes;

    public const TYPE_PERCENT = 'PERCENT';

    public const TYPE_FIXED = 'FIXED';

    public const TYPES = [self::TYPE_PERCENT, self::TYPE_FIXED];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'integer',
            'active' => 'boolean',
            'min_order_subtotal' => 'integer',
        ];
    }
}
