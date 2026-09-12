<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Order;
use App\Models\Payment;
use App\Services\PaymentService;
use App\Support\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PaymentController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private PaymentService $payments)
    {
    }

    public function index(Request $request, Order $order): JsonResponse
    {
        $payments = $order->payments()->with('receiver')->paginate(
            ApiResponse::perPage($request)
        );

        return ApiResponse::paginated($payments, PaymentResource::class);
    }

    public function store(StorePaymentRequest $request, Order $order): JsonResponse
    {
        $validated = $request->validated();
        $type = $validated['type'] ?? Payment::TYPE_PAYMENT;

        $this->authorize($type === Payment::TYPE_REFUND ? 'recordRefund' : 'recordPayment', Payment::class);

        [$payment, $created] = $this->payments->record(
            $order,
            $validated,
            $request->user(),
            $request->header('Idempotency-Key')
        );

        $payment->load('receiver');

        return response()->json(
            ['data' => new PaymentResource($payment)],
            $created ? Response::HTTP_CREATED : Response::HTTP_OK
        );
    }
}
