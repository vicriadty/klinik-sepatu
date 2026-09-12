<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReportFilterRequest;
use App\Models\User;
use App\Services\ReportService;
use App\Support\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;

class ReportController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private ReportService $reports)
    {
    }

    public function transactions(ReportFilterRequest $request): JsonResponse
    {
        $this->authorize('viewFinancials', User::class);

        $filters = $request->validated();
        $paginator = $this->reports->transactionsQuery($filters)
            ->paginate(ApiResponse::perPage($request));

        $methods = $this->reports->paymentMethodsByOrder(
            collect($paginator->items())->pluck('id')->all()
        );

        $paginator->setCollection(
            $paginator->getCollection()->map(fn ($order) => $this->reports->transactionRow($order, $methods))
        );

        return ApiResponse::paginatedData($paginator);
    }

    public function revenue(ReportFilterRequest $request): JsonResponse
    {
        $this->authorize('viewFinancials', User::class);

        return ApiResponse::ok($this->reports->revenueSummary($request->validated()));
    }

    public function services(ReportFilterRequest $request): JsonResponse
    {
        $this->authorize('viewFinancials', User::class);

        return ApiResponse::ok($this->reports->servicesReport($request->validated())->all());
    }

    public function customers(ReportFilterRequest $request): JsonResponse
    {
        $this->authorize('viewFinancials', User::class);

        return ApiResponse::ok($this->reports->customersReport($request->validated())->all());
    }
}
