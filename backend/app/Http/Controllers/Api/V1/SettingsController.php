<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSettingsRequest;
use App\Models\User;
use App\Services\SettingsService;
use App\Support\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;

class SettingsController extends Controller
{
    use AuthorizesRequests;

    public function __construct(private SettingsService $settings)
    {
    }

    public function show(): JsonResponse
    {
        $this->authorize('manageSettings', User::class);

        return ApiResponse::ok([
            'settings' => $this->settings->all(),
            'notifications' => $this->settings->notificationStatus(),
        ]);
    }

    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        $this->authorize('manageSettings', User::class);

        return ApiResponse::ok([
            'settings' => $this->settings->set($request->validated()),
            'notifications' => $this->settings->notificationStatus(),
        ]);
    }
}
