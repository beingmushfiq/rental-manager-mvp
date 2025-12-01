<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\ItemController;
use App\Http\Controllers\Api\RentalController;
use App\Http\Controllers\Api\SaleController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\UploadController;

// Public Routes
Route::post('/login', [AuthController::class, 'login']);
Route::get('/documentation', function() { return view('l5-swagger::index'); });

// Public test routes (for verification)
Route::get('/test', function() {
    return response()->json(['message' => 'Backend API is working!', 'timestamp' => now()]);
});

Route::get('/customers-public', [CustomerController::class, 'index']);
Route::get('/items-public', [ItemController::class, 'index']);

// Protected Routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::apiResource('customers', CustomerController::class);
    Route::apiResource('items', ItemController::class);
    
    Route::apiResource('rentals', RentalController::class);
    Route::post('rentals/{rental}/return', [RentalController::class, 'returnItems']);
    
    Route::apiResource('sales', SaleController::class);
    Route::apiResource('payments', PaymentController::class);
    
    Route::post('/upload', [UploadController::class, 'store']);
});
