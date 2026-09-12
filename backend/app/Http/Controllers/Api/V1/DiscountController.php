<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDiscountRequest;
use App\Http\Requests\UpdateDiscountRequest;
use App\Http\Resources\DiscountResource;
use App\Models\Discount;
use App\Support\ApiResponse;
use App\Support\AuditLog;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DiscountController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        $query = Discount::query()->latest('id');

        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }

        return ApiResponse::paginated(
            $query->paginate(ApiResponse::perPage($request)),
            DiscountResource::class
        );
    }

    public function store(StoreDiscountRequest $request): JsonResponse
    {
        $this->authorize('manage', Discount::class);

        $discount = Discount::query()->create($request->validated());

        AuditLog::record('DISCOUNT_CREATED', 'discount', $discount->id, null, $discount->only([
            'name', 'type', 'value', 'active',
        ]));

        return response()->json(
            ['data' => new DiscountResource($discount->refresh())],
            Response::HTTP_CREATED
        );
    }

    public function show(Discount $discount): JsonResponse
    {
        return ApiResponse::ok(new DiscountResource($discount));
    }

    public function update(UpdateDiscountRequest $request, Discount $discount): JsonResponse
    {
        $this->authorize('manage', Discount::class);

        $discount->fill($request->validated())->save();

        AuditLog::record('DISCOUNT_UPDATED', 'discount', $discount->id, null, $discount->only([
            'name', 'type', 'value', 'active',
        ]));

        return ApiResponse::ok(new DiscountResource($discount->refresh()));
    }

    public function destroy(Discount $discount): Response
    {
        $this->authorize('manage', Discount::class);

        $discount->delete();

        return response()->noContent();
    }
}
