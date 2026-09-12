<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceRequest;
use App\Http\Requests\UpdateServiceRequest;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use App\Support\ApiResponse;
use App\Support\AuditLog;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ServiceController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request): JsonResponse
    {
        $query = Service::query()->with('category')->latest('id');

        if ($request->filled('search')) {
            $query->whereRaw('LOWER(name) LIKE ?', ['%'.strtolower((string) $request->input('search')).'%']);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        if ($request->filled('active')) {
            $query->where('active', $request->boolean('active'));
        }

        return ApiResponse::paginated(
            $query->paginate(ApiResponse::perPage($request)),
            ServiceResource::class
        );
    }

    public function store(StoreServiceRequest $request): JsonResponse
    {
        $this->authorize('manage', Service::class);

        $service = Service::query()->create($request->validated());

        AuditLog::record('SERVICE_CREATED', 'service', $service->id, null, $service->only([
            'name', 'category_id', 'price', 'active',
        ]));

        return response()->json(
            ['data' => new ServiceResource($service->refresh()->load('category'))],
            Response::HTTP_CREATED
        );
    }

    public function show(Service $service): JsonResponse
    {
        return ApiResponse::ok(new ServiceResource($service->load('category')));
    }

    public function update(UpdateServiceRequest $request, Service $service): JsonResponse
    {
        $this->authorize('manage', Service::class);

        $oldPrice = $service->price;
        $service->fill($request->validated());

        $priceChanged = $service->isDirty('price');
        $service->save();

        AuditLog::record('SERVICE_UPDATED', 'service', $service->id, null, $service->only([
            'name', 'category_id', 'price', 'active',
        ]));

        if ($priceChanged) {
            AuditLog::record('SERVICE_PRICE_CHANGED', 'service', $service->id, ['price' => $oldPrice], ['price' => $service->price]);
        }

        return ApiResponse::ok(new ServiceResource($service->refresh()->load('category')));
    }

    public function updateStatus(Request $request, Service $service): JsonResponse
    {
        $this->authorize('manage', Service::class);

        $validated = $request->validate(['active' => ['required', 'boolean']]);

        $service->forceFill(['active' => $validated['active']])->save();

        AuditLog::record('SERVICE_UPDATED', 'service', $service->id, null, $service->only(['active']));

        return ApiResponse::ok(new ServiceResource($service->refresh()->load('category')));
    }

    public function destroy(Service $service): Response
    {
        $this->authorize('manage', Service::class);

        $service->delete();

        return response()->noContent();
    }
}
