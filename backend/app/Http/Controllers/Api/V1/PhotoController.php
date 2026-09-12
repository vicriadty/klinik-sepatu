<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePhotoRequest;
use App\Http\Resources\PhotoResource;
use App\Models\OrderItem;
use App\Models\OrderItemPhoto;
use App\Services\PhotoService;
use App\Support\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

class PhotoController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private PhotoService $photos)
    {
    }

    public function index(OrderItem $item): JsonResponse
    {
        return ApiResponse::ok(PhotoResource::collection($item->photos));
    }

    public function store(StorePhotoRequest $request, OrderItem $item): JsonResponse
    {
        $validated = $request->validated();

        $photo = $this->photos->store(
            $item,
            $validated['photo'],
            $validated['type'],
            $request->user()
        );

        return response()->json(
            ['data' => new PhotoResource($photo->refresh())],
            Response::HTTP_CREATED
        );
    }

    public function destroy(OrderItemPhoto $photo): Response
    {
        $this->photos->delete($photo);

        return response()->noContent();
    }
}
