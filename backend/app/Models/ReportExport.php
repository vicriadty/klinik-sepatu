<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'type', 'filters', 'status', 'file_path', 'error'])]
class ReportExport extends Model
{
    public const TYPE_TRANSACTIONS = 'transactions';

    public const TYPE_REVENUE = 'revenue';

    public const TYPE_SERVICES = 'services';

    public const TYPE_CUSTOMERS = 'customers';

    public const TYPES = [
        self::TYPE_TRANSACTIONS,
        self::TYPE_REVENUE,
        self::TYPE_SERVICES,
        self::TYPE_CUSTOMERS,
    ];

    public const STATUS_PENDING = 'PENDING';

    public const STATUS_PROCESSING = 'PROCESSING';

    public const STATUS_COMPLETED = 'COMPLETED';

    public const STATUS_FAILED = 'FAILED';

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'filters' => 'array',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
