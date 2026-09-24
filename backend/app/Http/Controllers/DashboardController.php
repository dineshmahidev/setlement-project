<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\DebitNote;
use App\Models\InventoryTransaction;
use App\Models\Item;
use App\Models\SettlementBill;
use App\Models\Vehicle;
use App\Models\VehicleMovement;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $branchId = $request->branch_id ? (int) $request->branch_id : null;
        $dateFrom = $request->date_from ?? now()->toDateString();
        $dateTo = $request->date_to ?? now()->toDateString();
        $allowed = $this->allowedBranchIds();

        $branchScope = function ($q) use ($branchId, $allowed) {
            if ($branchId) $q->where('branch_id', $branchId);
            elseif ($allowed) $q->whereIn('branch_id', $allowed);
            return $q;
        };

        $settlementToday = $branchScope(SettlementBill::whereDate('bill_date', '>=', $dateFrom)
            ->whereDate('bill_date', '<=', $dateTo));

        $stockIn = $branchScope(InventoryTransaction::where('type', 'STOCK_IN')->where('status', 'POSTED')
            ->whereDate('date', '>=', $dateFrom)->whereDate('date', '<=', $dateTo));

        $stockOut = $branchScope(InventoryTransaction::where('type', 'STOCK_OUT')->where('status', 'POSTED')
            ->whereDate('date', '>=', $dateFrom)->whereDate('date', '<=', $dateTo));

        // stock summary
        $stockRows = InventoryTransaction::where('status', 'POSTED')
            ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
            ->when(! $branchId && $allowed, fn ($q) => $q->whereIn('branch_id', $allowed))
            ->selectRaw('
                item_id,
                SUM(CASE WHEN type IN ("STOCK_IN","TRANSFER_IN","ADJUSTMENT_IN") THEN quantity ELSE 0 END) as total_in,
                SUM(CASE WHEN type IN ("STOCK_OUT","TRANSFER_OUT","ADJUSTMENT_OUT") THEN quantity ELSE 0 END) as total_out
            ')
            ->groupBy('item_id')
            ->get();

        $lowStock = 0;
        $currentStockValue = 0;
        foreach ($stockRows as $row) {
            $avail = (float) $row->total_in - (float) $row->total_out;
            $currentStockValue += $avail;
            $item = Item::find($row->item_id);
            if ($item && (float) $item->min_stock_level > 0 && $avail <= (float) $item->min_stock_level) {
                $lowStock++;
            }
        }

        // charts: last 7 days stock in/out
        $chartDays = collect(range(6, 0))->map(function ($i) use ($branchId, $allowed) {
            $date = now()->subDays($i)->toDateString();
            $in = InventoryTransaction::where('type', 'STOCK_IN')->where('status', 'POSTED')
                ->whereDate('date', $date)
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->when(! $branchId && $allowed, fn ($q) => $q->whereIn('branch_id', $allowed))
                ->sum('quantity');
            $out = InventoryTransaction::where('type', 'STOCK_OUT')->where('status', 'POSTED')
                ->whereDate('date', $date)
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->when(! $branchId && $allowed, fn ($q) => $q->whereIn('branch_id', $allowed))
                ->sum('quantity');
            return ['date' => substr($date, 5), 'stock_in' => (float) $in, 'stock_out' => (float) $out];
        });

        // settlement value last 7 days
        $settlementChart = collect(range(6, 0))->map(function ($i) use ($branchId, $allowed) {
            $date = now()->subDays($i)->toDateString();
            $val = SettlementBill::whereDate('bill_date', $date)
                ->where('status', '!=', 'CANCELLED')
                ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                ->when(! $branchId && $allowed, fn ($q) => $q->whereIn('branch_id', $allowed))
                ->sum('net_payable');
            return ['date' => substr($date, 5), 'value' => (float) $val];
        });

        // branch-wise stock
        $branchStock = Branch::query()->when($branchId, fn ($q) => $q->where('id', $branchId))
            ->when(! $branchId && $allowed, fn ($q) => $q->whereIn('id', $allowed))
            ->get()->map(function ($b) {
                $sum = InventoryTransaction::where('branch_id', $b->id)->where('status', 'POSTED')
                    ->sum('signed_quantity');
                return ['branch' => $b->name, 'stock' => (float) $sum];
            });

        // item-wise stock (top 8)
        $itemStock = $stockRows->map(function ($row) {
            $item = Item::with('unit')->find($row->item_id);
            return $item ? [
                'item' => $item->name,
                'stock' => round((float) $row->total_in - (float) $row->total_out, 3),
                'unit' => $item->unit?->code,
            ] : null;
        })->filter()->take(8)->values();

        return response()->json([
            'stats' => [
                'total_branches' => Branch::count(),
                'total_vendors' => Vendor::count(),
                'settlement_bills_today' => (clone $settlementToday)->count(),
                'debit_notes_today' => $branchScope(DebitNote::whereDate('date', '>=', $dateFrom)
                    ->whereDate('date', '<=', $dateTo))->count(),
                'stock_in_today' => (clone $stockIn)->sum('quantity'),
                'stock_out_today' => (clone $stockOut)->sum('quantity'),
                'current_stock' => round($currentStockValue, 3),
                'low_stock_items' => $lowStock,
                'active_vehicles' => Vehicle::where('status', 'ACTIVE')->count(),
                'vehicle_movements_today' => VehicleMovement::whereDate('date', '>=', $dateFrom)
                    ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                    ->whereDate('date', '<=', $dateTo)->count(),
            ],
            'charts' => [
                'stock_flow' => $chartDays,
                'settlement_value' => $settlementChart,
                'branch_stock' => $branchStock,
                'item_stock' => $itemStock,
            ],
        ]);
    }
}
