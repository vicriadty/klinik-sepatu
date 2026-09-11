<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Requests\UpdateUserStatusRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UserController extends Controller
{
    use AuthorizesRequests;
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $query = User::query()->latest('id');

        if ($request->filled('search')) {
            $search = '%'.strtolower((string) $request->input('search')).'%';
            $query->where(function ($q) use ($search): void {
                $q->whereRaw('LOWER(name) LIKE ?', [$search])
                    ->orWhereRaw('LOWER(username) LIKE ?', [$search]);
            });
        }

        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }

        return ApiResponse::paginated(
            $query->paginate(ApiResponse::perPage($request)),
            UserResource::class
        );
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $this->authorize('create', [User::class, $validated['role']]);

        $user = User::query()->create($validated);

        return response()->json(['data' => new UserResource($user->refresh())], Response::HTTP_CREATED);
    }

    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return ApiResponse::ok(new UserResource($user));
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $validated = $request->validated();

        $this->authorize('update', [$user, $validated['role'] ?? null]);

        $user->fill($validated)->save();

        return ApiResponse::ok(new UserResource($user->refresh()));
    }

    public function updateStatus(UpdateUserStatusRequest $request, User $user): JsonResponse
    {
        $validated = $request->validated();

        $this->authorize('updateStatus', [$user, (bool) $validated['is_active']]);

        if (! $validated['is_active']) {
            $user->tokens()->delete();
        }

        $user->forceFill(['is_active' => $validated['is_active']])->save();

        return ApiResponse::ok(new UserResource($user->refresh()));
    }

    public function destroy(User $user): Response
    {
        $this->authorize('delete', $user);

        $user->tokens()->delete();
        $user->delete();

        return response()->noContent();
    }
}
