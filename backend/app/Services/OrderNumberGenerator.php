<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

/**
 * Race-safe daily order numbers (ADR-0009): ORD-YYYYMMDD-NNNN.
 *
 * Must be called inside a database transaction held by the caller.
 * Uses SELECT … FOR UPDATE plus insertOrIgnore so two concurrent
 * creators can never receive the same counter value. Numbers may
 * have gaps (rolled-back transactions); uniqueness is guaranteed.
 */
class OrderNumberGenerator
{
    public function generate(): string
    {
        $date = today()->toDateString();

        $row = DB::table('daily_sequences')->where('date', $date)->lockForUpdate()->first();

        if ($row === null) {
            DB::table('daily_sequences')->insertOrIgnore(['date' => $date, 'last_number' => 0]);
            $row = DB::table('daily_sequences')->where('date', $date)->lockForUpdate()->first();
        }

        $next = $row->last_number + 1;

        DB::table('daily_sequences')->where('date', $date)->update(['last_number' => $next]);

        return sprintf('ORD-%s-%04d', str_replace('-', '', $date), $next);
    }
}
