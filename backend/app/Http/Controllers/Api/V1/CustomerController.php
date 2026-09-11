<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCustomerRequest;
use App\Http\Requests\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use App\Models\Customer;
use App\Support\ApiResponse;
use App\Support\PhoneNumber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Customer::query()->latest('id');

        if ($request->filled('search')) {
            $raw = trim((string) $request->input('search'));
            $normalizedPhone = PhoneNumber::normalize($raw);

            $query->where(function ($q) use ($raw, $normalizedPhone): void {
                $q->whereRaw('LOWER(name) LIKE ?', ['%'.strtolower($raw).'%']);

                if ($normalizedPhone !== null) {
                    $q->orWhere('phone', 'like', $normalizedPhone.'%');
                } elseif (preg_match('/\d{3,}/', $raw, $m)) {
                    // Partial local-format input (e.g. "0812"): strip the trunk
                    // zeros so it matches the canonical 62… storage.
                    $digits = ltrim($m[0], '0');

                    if ($digits !== '') {
                        $q->orWhere('phone', 'like', '%'.$digits.'%');
                    }
                }
            });
        }

        return ApiResponse::paginated(
            $query->paginate(ApiResponse::perPage($request)),
            CustomerResource::class
        );
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $existing = Customer::query()->where('phone', $validated['phone'])->first();

        if ($existing) {
            return $this->duplicateResponse($existing);
        }

        $customer = Customer::query()->create($validated);

        return response()->json(['data' => new CustomerResource($customer)], Response::HTTP_CREATED);
    }

    public function show(Customer $customer): JsonResponse
    {
        return ApiResponse::ok(new CustomerResource($customer));
    }

    public function update(UpdateCustomerRequest $request, Customer $customer): JsonResponse
    {
        $validated = $request->validated();

        if (isset($validated['phone'])) {
            $existing = Customer::query()
                ->where('phone', $validated['phone'])
                ->where('id', '!=', $customer->id)
                ->first();

            if ($existing) {
                return $this->duplicateResponse($existing);
            }
        }

        $customer->fill($validated)->save();

        return ApiResponse::ok(new CustomerResource($customer->refresh()));
    }

    private function duplicateResponse(Customer $existing): JsonResponse
    {
        return response()->json([
            'message' => 'Customer with this phone number already exists.',
            'data' => ['customer' => new CustomerResource($existing)],
        ], Response::HTTP_CONFLICT);
    }
}
