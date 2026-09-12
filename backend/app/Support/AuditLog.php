<?php

namespace App\Support;

use App\Models\AuditLog as AuditLogRecord;
use App\Models\User;

/**
 * Minimal audit trail writer (PRD backend §25).
 *
 * Each feature logs its own actions at the point of mutation;
 * failures to write audit must never break the business operation,
 * so callers should treat this as best-effort fire-and-forget.
 */
class AuditLog
{
    public static function record(
        string $action,
        string $entityType,
        int|string|null $entityId = null,
        ?array $before = null,
        ?array $after = null,
        ?User $actor = null,
    ): void {
        $actor ??= auth()->user();

        AuditLogRecord::query()->create([
            'actor_user_id' => $actor?->getKey(),
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'before' => $before,
            'after' => $after,
            'ip' => app()->runningInConsole() ? null : request()->ip(),
            'user_agent' => app()->runningInConsole() ? null : request()->userAgent(),
        ]);
    }
}
