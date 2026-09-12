<?php

namespace App\Services;

use App\Models\Order;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Read-model queries for reports and XLSX exports (PRD backend §21-22).
 *
 * One order-date basis everywhere (ADR-0005): non-cancelled orders
 * created in the period. Cancelled orders never contribute.
 */
class ReportService
{
    /**
     * @param array<string, mixed> $filters
     * @return array{Carbon, Carbon}
     */
    public function period(array $filters): array
    {
        if (! empty($filters['start_date']) && ! empty($filters['end_date'])) {
            return [Carbon::parse($filters['start_date'])->startOfDay(), Carbon::parse($filters['end_date'])->endOfDay()];
        }

        return [today()->subDays(29)->startOfDay(), today()->endOfDay()];
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function transactionsQuery(array $filters): Builder
    {
        [$start, $end] = $this->period($filters);

        $query = Order::query()
            ->where('status', '!=', Order::STATUS_CANCELLED)
            ->whereBetween('created_at', [$start, $end])
            ->with(['customer', 'items.itemServices'])
            ->latest('id');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['payment_status'])) {
            $query->where('payment_status', $filters['payment_status']);
        }

        if (! empty($filters['service_id'])) {
            $query->whereHas('items.itemServices', fn ($q) => $q->where('service_id', $filters['service_id']));
        }

        if (! empty($filters['payment_method'])) {
            $query->whereHas('payments', fn ($q) => $q
                ->where('type', 'payment')
                ->where('method', $filters['payment_method']));
        }

        if (! empty($filters['search'])) {
            $search = '%'.strtolower((string) $filters['search']).'%';
            $query->where(function ($q) use ($search): void {
                $q->whereRaw('LOWER(order_number) LIKE ?', [$search])
                    ->orWhereHas('customer', function ($cq) use ($search): void {
                        $cq->whereRaw('LOWER(name) LIKE ?', [$search])
                            ->orWhere('phone', 'like', $search);
                    });
            });
        }

        return $query;
    }

    /**
     * One report row per order — money columns sum correctly in Excel.
     *
     * @return array<string, mixed>
     */
    public function transactionRow(Order $order, array $methodsByOrder): array
    {
        $serviceNames = $order->items
            ->flatMap(fn ($item) => $item->itemServices->pluck('service_name'))
            ->unique()
            ->values()
            ->all();

        return [
            'order_number' => $order->order_number,
            'date' => $order->created_at->timezone('Asia/Jakarta')->toDateString(),
            'customer' => $order->customer?->name,
            'service' => implode(', ', $serviceNames),
            'qty' => $order->items->count(),
            'subtotal' => (int) $order->subtotal,
            'discount' => (int) $order->discount_value,
            'grand_total' => (int) $order->grand_total,
            'payment_method' => implode(', ', $methodsByOrder[$order->id] ?? []),
            'payment_status' => $order->payment_status,
            'order_status' => $order->status,
        ];
    }

    /**
     * Distinct payment methods per order in one query (no N+1).
     *
     * @param list<int> $orderIds
     * @return array<int, list<string>>
     */
    public function paymentMethodsByOrder(array $orderIds): array
    {
        if ($orderIds === []) {
            return [];
        }

        return DB::table('payments')
            ->whereIn('order_id', $orderIds)
            ->where('type', 'payment')
            ->selectRaw('order_id, method')
            ->distinct()
            ->get()
            ->groupBy('order_id')
            ->map(fn ($rows) => $rows->pluck('method')->sort()->values()->all())
            ->all();
    }

    /**
     * @param array<string, mixed> $filters
     * @return array<string, int|string>
     */
    public function revenueSummary(array $filters): array
    {
        [$start, $end] = $this->period($filters);

        $row = Order::query()
            ->where('status', '!=', Order::STATUS_CANCELLED)
            ->whereBetween('created_at', [$start, $end])
            ->selectRaw('COUNT(*) as orders, COALESCE(SUM(subtotal), 0) as subtotal, COALESCE(SUM(discount_value), 0) as discount, COALESCE(SUM(grand_total), 0) as revenue, COALESCE(SUM(paid_total), 0) as collected')
            ->first();

        $revenue = (int) $row->revenue;
        $collected = (int) $row->collected;

        return [
            'period_start' => $start->toDateString(),
            'period_end' => $end->toDateString(),
            'total_revenue' => $revenue,
            'total_orders' => (int) $row->orders,
            'total_discount' => (int) $row->discount,
            'total_collected' => $collected,
            'total_outstanding' => $revenue - $collected,
        ];
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function servicesReport(array $filters): \Illuminate\Support\Collection
    {
        [$start, $end] = $this->period($filters);

        return DB::table('order_item_services as ois')
            ->join('order_items as oi', 'oi.id', '=', 'ois.order_item_id')
            ->join('orders as o', 'o.id', '=', 'oi.order_id')
            ->leftJoin('services as s', 's.id', '=', 'ois.service_id')
            ->leftJoin('service_categories as sc', 'sc.id', '=', 's.category_id')
            ->where('o.status', '!=', Order::STATUS_CANCELLED)
            ->whereBetween('o.created_at', [$start, $end])
            ->groupBy('ois.service_id', 'ois.service_name', 'sc.name')
            ->selectRaw('ois.service_id, ois.service_name, sc.name as category_name, COUNT(DISTINCT o.id) as orders_count, COUNT(*) as items_count, SUM(ois.unit_price) as revenue')
            ->orderByDesc('revenue')
            ->get()
            ->map(fn ($row) => [
                'service_id' => (int) $row->service_id,
                'service_name' => $row->service_name,
                'category_name' => $row->category_name,
                'orders_count' => (int) $row->orders_count,
                'items_count' => (int) $row->items_count,
                'revenue' => (int) $row->revenue,
            ]);
    }

    /**
     * @param array<string, mixed> $filters
     */
    public function customersReport(array $filters): \Illuminate\Support\Collection
    {
        [$start, $end] = $this->period($filters);

        return DB::table('customers as c')
            ->join('orders as o', 'o.customer_id', '=', 'c.id')
            ->where('o.status', '!=', Order::STATUS_CANCELLED)
            ->whereBetween('o.created_at', [$start, $end])
            ->groupBy('c.id', 'c.name', 'c.phone')
            ->selectRaw('c.id as customer_id, c.name, c.phone, COUNT(o.id) as orders_count, SUM(o.grand_total) as total_spent')
            ->orderByDesc('total_spent')
            ->get()
            ->map(fn ($row) => [
                'customer_id' => (int) $row->customer_id,
                'name' => $row->name,
                'phone' => $row->phone,
                'orders_count' => (int) $row->orders_count,
                'total_spent' => (int) $row->total_spent,
            ]);
    }

    /**
     * Headings + rows for one XLSX sheet per export type.
     *
     * @param array<string, mixed> $filters
     * @return array{0: list<string>, 1: list<list<mixed>>}
     */
    public function exportData(string $type, array $filters): array
    {
        return match ($type) {
            'transactions' => $this->transactionExport($filters),
            'revenue' => [[
                'period_start', 'period_end', 'total_revenue', 'total_orders',
                'total_discount', 'total_collected', 'total_outstanding',
            ], [array_values($this->revenueSummary($filters))]],
            'services' => [
                ['service', 'category', 'orders', 'items', 'revenue'],
                $this->servicesReport($filters)->map(fn ($r) => [
                    $r['service_name'], $r['category_name'], $r['orders_count'], $r['items_count'], $r['revenue'],
                ])->all(),
            ],
            'customers' => [
                ['customer', 'phone', 'orders', 'total_spent'],
                $this->customersReport($filters)->map(fn ($r) => [
                    $r['name'], $r['phone'], $r['orders_count'], $r['total_spent'],
                ])->all(),
            ],
            default => throw new \InvalidArgumentException("Unknown export type: {$type}"),
        };
    }

    /**
     * @param array<string, mixed> $filters
     * @return array{0: list<string>, 1: list<list<mixed>>}
     */
    private function transactionExport(array $filters): array
    {
        $headings = [
            'order_number', 'date', 'customer', 'service', 'qty', 'subtotal',
            'discount', 'grand_total', 'payment_method', 'payment_status', 'order_status',
        ];

        $rows = [];
        $this->transactionsQuery($filters)->orderBy('id')->chunk(500, function ($orders) use (&$rows): void {
            $methods = $this->paymentMethodsByOrder($orders->pluck('id')->all());

            foreach ($orders as $order) {
                $rows[] = array_values($this->transactionRow($order, $methods));
            }
        });

        return [$headings, $rows];
    }
}
