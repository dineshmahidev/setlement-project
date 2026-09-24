<?php

use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DebitNoteController;
use App\Http\Controllers\FieldConfigurationController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SettingController;
use App\Http\Controllers\SettlementBillController;
use App\Http\Controllers\UnitController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VehicleController;
use App\Http\Controllers\VehicleMovementController;
use App\Http\Controllers\VendorController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/me', [AuthController::class, 'me'])->middleware('auth:sanctum');

Route::middleware(['auth:sanctum', 'branch.scope'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);

    Route::apiResource('branches', BranchController::class)->middleware('permission:branches.manage');
    Route::apiResource('users', UserController::class)->middleware('permission:users.manage');
    Route::apiResource('roles', RoleController::class)->middleware('permission:users.manage');

    Route::apiResource('vendors', VendorController::class);
    Route::apiResource('vehicles', VehicleController::class);
    Route::apiResource('items', ItemController::class);
    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('units', UnitController::class);
    Route::get('/charge-types', [\App\Http\Controllers\ChargeTypeController::class, 'index']);

    Route::apiResource('settlement-bills', SettlementBillController::class);
    Route::post('/settlement-bills/{settlementBill}/approve', [SettlementBillController::class, 'approve']);
    Route::post('/settlement-bills/{settlementBill}/submit', [SettlementBillController::class, 'submit']);
    Route::post('/settlement-bills/{settlementBill}/cancel', [SettlementBillController::class, 'cancel']);
    Route::get('/settlement-bills/{settlementBill}/pdf', [SettlementBillController::class, 'pdf']);
    Route::post('/settlement-bills/calculate', [SettlementBillController::class, 'calculate']);

    Route::apiResource('debit-notes', DebitNoteController::class);
    Route::post('/debit-notes/{debitNote}/approve', [DebitNoteController::class, 'approve']);
    Route::post('/debit-notes/{debitNote}/cancel', [DebitNoteController::class, 'cancel']);
    Route::get('/debit-notes/{debitNote}/pdf', [DebitNoteController::class, 'pdf']);

    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::get('/inventory/stock', [InventoryController::class, 'stock']);
    Route::get('/inventory/ledger', [InventoryController::class, 'ledger']);
    Route::get('/inventory/low-stock', [InventoryController::class, 'lowStock']);
    Route::post('/inventory/stock-in', [InventoryController::class, 'stockIn']);
    Route::post('/inventory/stock-out', [InventoryController::class, 'stockOut']);
    Route::post('/inventory/transfer', [InventoryController::class, 'transfer']);
    Route::post('/inventory/adjustment', [InventoryController::class, 'adjustment']);

    Route::get('/vehicle-movements', [VehicleMovementController::class, 'index']);
    Route::post('/vehicle-movements', [VehicleMovementController::class, 'store']);

    Route::get('/reports/{type}', [ReportController::class, 'index']);
    Route::get('/reports/{type}/export', [ReportController::class, 'export']);

    Route::get('/field-configurations', [FieldConfigurationController::class, 'index']);
    Route::put('/field-configurations', [FieldConfigurationController::class, 'update'])->middleware('permission:settings.manage');

    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings', [SettingController::class, 'update'])->middleware('permission:settings.manage');

    Route::get('/audit-logs', [AuditLogController::class, 'index'])->middleware('permission:audit.view');
});
