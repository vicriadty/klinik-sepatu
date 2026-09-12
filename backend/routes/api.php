<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DiscountController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\PaymentController;
use App\Http\Controllers\Api\V1\PhotoController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\ReportExportController;
use App\Http\Controllers\Api\V1\SettingsController;
use App\Http\Controllers\Api\V1\ServiceCategoryController;
use App\Http\Controllers\Api\V1\ServiceController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login'])
    ->middleware('throttle:10,1');

Route::middleware('auth:sanctum')->group(function (): void {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::patch('/users/{user}/status', [UserController::class, 'updateStatus']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);

    Route::get('/customers', [CustomerController::class, 'index']);
    Route::post('/customers', [CustomerController::class, 'store']);
    Route::get('/customers/{customer}', [CustomerController::class, 'show']);
    Route::put('/customers/{customer}', [CustomerController::class, 'update']);

    Route::get('/service-categories', [ServiceCategoryController::class, 'index']);
    Route::post('/service-categories', [ServiceCategoryController::class, 'store']);
    Route::get('/service-categories/{category}', [ServiceCategoryController::class, 'show']);
    Route::put('/service-categories/{category}', [ServiceCategoryController::class, 'update']);
    Route::delete('/service-categories/{category}', [ServiceCategoryController::class, 'destroy']);

    Route::get('/services', [ServiceController::class, 'index']);
    Route::post('/services', [ServiceController::class, 'store']);
    Route::get('/services/{service}', [ServiceController::class, 'show']);
    Route::put('/services/{service}', [ServiceController::class, 'update']);
    Route::delete('/services/{service}', [ServiceController::class, 'destroy']);
    Route::patch('/services/{service}/status', [ServiceController::class, 'updateStatus']);

    Route::get('/discounts', [DiscountController::class, 'index']);
    Route::post('/discounts', [DiscountController::class, 'store']);
    Route::get('/discounts/{discount}', [DiscountController::class, 'show']);
    Route::put('/discounts/{discount}', [DiscountController::class, 'update']);
    Route::delete('/discounts/{discount}', [DiscountController::class, 'destroy']);

    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::put('/orders/{order}', [OrderController::class, 'update']);
    Route::post('/orders/{order}/status', [OrderController::class, 'transition']);
    Route::post('/orders/{order}/cancel', [OrderController::class, 'cancel']);

    Route::get('/orders/{order}/payments', [PaymentController::class, 'index']);
    Route::post('/orders/{order}/payments', [PaymentController::class, 'store']);

    Route::get('/order-items/{item}/photos', [PhotoController::class, 'index']);
    Route::post('/order-items/{item}/photos', [PhotoController::class, 'store']);
    Route::delete('/order-item-photos/{photo}', [PhotoController::class, 'destroy']);

    Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('/dashboard/revenue', [DashboardController::class, 'revenue']);
    Route::get('/dashboard/orders', [DashboardController::class, 'orders']);
    Route::get('/dashboard/top-services', [DashboardController::class, 'topServices']);
    Route::get('/dashboard/payment-methods', [DashboardController::class, 'paymentMethods']);

    Route::get('/reports/transactions', [ReportController::class, 'transactions']);
    Route::get('/reports/revenue', [ReportController::class, 'revenue']);
    Route::get('/reports/services', [ReportController::class, 'services']);
    Route::get('/reports/customers', [ReportController::class, 'customers']);
    Route::post('/reports/exports', [ReportExportController::class, 'store']);
    Route::get('/reports/exports', [ReportExportController::class, 'index']);
    Route::get('/reports/exports/{export}', [ReportExportController::class, 'show']);
    Route::get('/reports/exports/{export}/download', [ReportExportController::class, 'download']);

    Route::get('/settings', [SettingsController::class, 'show']);
    Route::put('/settings', [SettingsController::class, 'update']);
});
