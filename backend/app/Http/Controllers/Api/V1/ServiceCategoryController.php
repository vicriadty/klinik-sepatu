<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceCategoryRequest;
use App\Http\Requests\UpdateServiceCategoryRequest;
use App\Http\Resources\ServiceCategoryResource;
use App\Models\ServiceCategory;
use App\Support\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ServiceCategoryController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        $query = ServiceCategory::query()->withCount('services')->latest('id');

        if ($request->filled('search')) {
            $query->whereRaw('LOWER(name) LIKE ?', ['%'.strtolower((string) $request->input('search')).'%']);
        }

        return ApiResponse::paginated(
            $query->paginate(ApiResponse::perPage($request)),
            ServiceCategoryResource::class
        );
    }

    public function store(StoreServiceCategoryRequest $request): JsonResponse
    {
        $this->authorize('manage', ServiceCategory::class);

        $category = ServiceCategory::query()->create($request->validated());

        return response()->json(
            ['data' => new ServiceCategoryResource($category->loadCount('services'))],
            Response::HTTP_CREATED
        );
    }

    public function show(ServiceCategory $category): JsonResponse
    {
        return ApiResponse::ok(new ServiceCategoryResource($category->loadCount('services')));
    }

    public function update(UpdateServiceCategoryRequest $request, ServiceCategory $category): JsonResponse
    {
        $this->authorize('manage', ServiceCategory::class);

        $category->fill($request->validated())->save();

        return ApiResponse::ok(new ServiceCategoryResource($category->refresh()->loadCount('services')));
    }

    public function destroy(ServiceCategory $category): Response
    {
        $this->authorize('manage', ServiceCategory::class);

        if ($category->services()->exists()) {
            return response()->json(
                ['message' => 'Category cannot be deleted while it still has services.'],
                Response::HTTP_CONFLICT
            );
        }

        $category->delete();

        return response()->noContent();
    }
}
