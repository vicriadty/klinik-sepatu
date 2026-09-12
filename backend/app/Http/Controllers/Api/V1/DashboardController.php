<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\DashboardService;
use App\Support\ApiResponse;
use Carbon\Carbon;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private DashboardService $dashboard)
    {
    }

    public function summary(Request $request): JsonResponse
    {
        $withRevenue = in_array($request->user()->role, [User::ROLE_OWNER, User::ROLE_ADMIN], true);

        return ApiResponse::ok($this->dashboard->summary($withRevenue));
    }

    public function revenue(Request $request): JsonResponse
    {
        $this->authorize('viewFinancials', User::class);
        [$start, $end] = $this->period($request);

        return ApiResponse::ok($this->dashboard->revenueByDay($start, $end));
    }

    public function orders(Request $request): JsonResponse
    {
        $this->authorize('viewFinancials', User::class);
        [$start, $end] = $this->period($request);

        return ApiResponse::ok($this->dashboard->ordersByDay($start, $end));
    }

    public function topServices(Request $request): JsonResponse
    {
        $this->authorize('viewFinancials', User::class);
        [$start, $end] = $this->period($request);

        $limit = max(1, min($request->integer('limit', 5), 20));

        return ApiResponse::ok($this->dashboard->topServices($start, $end, $limit));
    }

    public function paymentMethods(Request $request): JsonResponse
    {
        $this->authorize('viewFinancials', User::class);
        [$start, $end] = $this->period($request);

        return ApiResponse::ok($this->dashboard->paymentMethods($start, $end));
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function period(Request $request): array
    {
        $validated = $request->validate([
            'period' => ['sometimes', 'in:today,7d,30d,custom'],
            'start_date' => ['required_if:period,custom', 'date_format:Y-m-d'],
            'end_date' => ['required_if:period,custom', 'date_format:Y-m-d', 'after_or_equal:start_date'],
        ]);

        return match ($validated['period'] ?? '30d') {
            'today' => [today(), today()],
            '7d' => [today()->subDays(6), today()],
            'custom' => [Carbon::parse($validated['start_date']), Carbon::parse($validated['end_date'])],
            default => [today()->subDays(29), today()],
        };
    }
}
