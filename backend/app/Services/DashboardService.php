<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Operational dashboard figures (PRD backend §20, ADR-0005).
 *
 * Revenue follows the order-creation basis: grand totals of
 * non-cancelled orders created in the period, in Asia/Jakarta day
 * boundaries. Payment-method figures are receipt-based by design
 * (money actually received) and only count payment rows.
 */
class DashboardService
{
    /**
     * @return array<string, int>
     */
    public function summary(bool $withRevenue): array
    {
        $today = today()->toDateString();
        $open = Order::query()->where('status', '!=', Order::STATUS_CANCELLED);

        $data = [];

        if ($withRevenue) {
            $data['revenue_today'] = (int) (clone $open)
                ->whereDate('created_at', $today)
                ->sum('grand_total');
        }

        $data['orders_today'] = (clone $open)->whereDate('created_at', $today)->count();
        $data['in_progress'] = (clone $open)->where('status', Order::STATUS_ON_PROCESS)->count();
        $data['ready_for_pickup'] = (clone $open)->where('status', Order::STATUS_READY_FOR_PICKUP)->count();
        $data['outstanding_payment'] = (int) (clone $open)
            ->whereColumn('paid_total', '<', 'grand_total')
            ->sum(DB::raw('grand_total - paid_total'));

        return $data;
    }

    /**
     * @return list<array{date: string, revenue: int, orders: int}>
     */
    public function revenueByDay(Carbon $start, Carbon $end): array
    {
        $rows = Order::query()
            ->where('status', '!=', Order::STATUS_CANCELLED)
            ->whereBetween(DB::raw('DATE(created_at)'), [$start->toDateString(), $end->toDateString()])
            ->groupBy(DB::raw('DATE(created_at)'))
            ->selectRaw('DATE(created_at) as day, SUM(grand_total) as revenue, COUNT(*) as orders')
            ->get()
            ->keyBy('day');

        $result = [];
        for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
            $key = $date->toDateString();
            $result[] = [
                'date' => $key,
                'revenue' => (int) ($rows[$key]->revenue ?? 0),
                'orders' => (int) ($rows[$key]->orders ?? 0),
            ];
        }

        return $result;
    }

    /**
     * @return list<array{date: string, orders: int}>
     */
    public function ordersByDay(Carbon $start, Carbon $end): array
    {
        $counts = Order::query()
            ->where('status', '!=', Order::STATUS_CANCELLED)
            ->whereBetween(DB::raw('DATE(created_at)'), [$start->toDateString(), $end->toDateString()])
            ->groupBy(DB::raw('DATE(created_at)'))
            ->selectRaw('DATE(created_at) as day, COUNT(*) as orders')
            ->pluck('orders', 'day')
            ->all();

        $result = [];
        for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
            $key = $date->toDateString();
            $result[] = ['date' => $key, 'orders' => (int) ($counts[$key] ?? 0)];
        }

        return $result;
    }

    /**
     * @return list<array{service_id: int, service_name: string, orders_count: int, revenue: int}>
     */
    public function topServices(Carbon $start, Carbon $end, int $limit): array
    {
        return DB::table('order_item_services as ois')
            ->join('order_items as oi', 'oi.id', '=', 'ois.order_item_id')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->where('o.status', '!=', Order::STATUS_CANCELLED)
            ->whereBetween(DB::raw('DATE(o.created_at)'), [$start->toDateString(), $end->toDateString()])
            ->groupBy('ois.service_id', 'ois.service_name')
            ->selectRaw('ois.service_id, ois.service_name, COUNT(DISTINCT o.id) as orders_count, SUM(ois.unit_price) as revenue')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get()
            ->map(fn ($row) => [
                'service_id' => (int) $row->service_id,
                'service_name' => $row->service_name,
                'orders_count' => (int) $row->orders_count,
                'revenue' => (int) $row->revenue,
            ])
            ->all();
    }

    /**
     * @return list<array{method: string, total: int, transactions: int}>
     */
    public function paymentMethods(Carbon $start, Carbon $end): array
    {
        return Payment::query()
            ->where('type', Payment::TYPE_PAYMENT)
            ->whereBetween(DB::raw('DATE(created_at)'), [$start->toDateString(), $end->toDateString()])
            ->groupBy('method')
            ->selectRaw('method, SUM(amount) as total, COUNT(*) as transactions')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($row) => [
                'method' => $row->method,
                'total' => (int) $row->total,
                'transactions' => (int) $row->transactions,
            ])
            ->all();
    }
}
