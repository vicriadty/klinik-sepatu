<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\CancelOrderRequest;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\TransitionOrderStatusRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use App\Services\OrderStatusService;
use App\Support\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OrderController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private OrderService $orders,
        private OrderStatusService $statuses,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Order::class);

        $query = Order::query()->with('customer')->withCount('items')->latest('id');

        if ($request->filled('search')) {
            $search = '%'.strtolower((string) $request->input('search')).'%';
            $query->where(function ($q) use ($search): void {
                $q->whereRaw('LOWER(order_number) LIKE ?', [$search])
                    ->orWhereHas('customer', function ($cq) use ($search): void {
                        $cq->whereRaw('LOWER(name) LIKE ?', [$search])
                            ->orWhere('phone', 'like', $search);
                    });
            });
        }

        foreach (['status', 'payment_status', 'customer_id'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->input($filter));
            }
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        return ApiResponse::paginated(
            $query->paginate(ApiResponse::perPage($request)),
            OrderResource::class
        );
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $this->authorize('create', Order::class);

        [$order, $created] = $this->orders->create(
            $request->validated(),
            $request->user(),
            $request->header('Idempotency-Key')
        );

        $order->load(['customer', 'items.itemServices', 'discount', 'statusHistories'])->loadCount('items');

        return response()->json(
            ['data' => new OrderResource($order)],
            $created ? Response::HTTP_CREATED : Response::HTTP_OK
        );
    }

    public function show(Order $order): JsonResponse
    {
        $this->authorize('view', $order);

        $order->load(['customer', 'items.itemServices', 'items.photos', 'discount', 'statusHistories', 'payments.receiver'])->loadCount('items');

        return ApiResponse::ok(new OrderResource($order));
    }

    public function update(UpdateOrderRequest $request, Order $order): JsonResponse
    {
        $this->authorize('update', $order);

        $order->fill($request->validated())->save();

        return ApiResponse::ok(new OrderResource($order->refresh()->load('customer')));
    }

    public function transition(TransitionOrderStatusRequest $request, Order $order): JsonResponse
    {
        $validated = $request->validated();

        $this->authorize('transition', [$order, $validated['status']]);

        $order = $this->statuses->transition(
            $order,
            $validated['status'],
            $request->user(),
            $validated['note'] ?? null
        );

        return ApiResponse::ok(new OrderResource($order->refresh()->load(['customer', 'items.itemServices', 'statusHistories'])->loadCount('items')));
    }

    public function cancel(CancelOrderRequest $request, Order $order): JsonResponse
    {
        $this->authorize('cancel', $order);

        $order = $this->statuses->transition(
            $order,
            Order::STATUS_CANCELLED,
            $request->user(),
            $request->validated()['reason'] ?? null
        );

        return ApiResponse::ok(new OrderResource($order->refresh()->load(['customer', 'statusHistories'])->loadCount('items')));
    }
}
