<?php

namespace App\Http\Controllers;

use App\Models\InventoryTransaction;
use App\Services\InventoryService;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(private InventoryService $service) {}

    public function index(Request $request)
    {
        $query = InventoryTransaction::with(['item.unit', 'branch', 'vendor', 'vehicle'])
            ->orderByDesc('date')->orderByDesc('id');

        $this->scopeBranches($query);

        if ($request->filled('type')) $query->where('type', $request->type);
        if ($request->filled('item_id')) $query->where('item_id', $request->item_id);
        if ($request->filled('branch_id')) $query->where('branch_id', $request->branch_id);
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn ($q) => $q
                ->where('transaction_number', 'like', "%$s%")
                ->orWhere('lot_number', 'like', "%$s%"));
        }
        if ($request->filled('date_from')) $query->whereDate('date', '>=', $request->date_from);
        if ($request->filled('date_to')) $query->whereDate('date', '<=', $request->date_to);

        return response()->json($query->paginate($request->get('per_page', 15)));
    }

    public function stock(Request $request)
    {
        $branchId = $request->branch_id ? (int) $request->branch_id : null;
        if (! $branchId && $ids = $this->allowedBranchIds()) {
            // aggregate across allowed branches
            $all = $this->service->currentStock(null);
            // filter: recompute limited to allowed branches
            $filtered = [];
            foreach ($all as $row) {
                $inq = InventoryTransaction::where('item_id', $row['item_id'])
                    ->whereIn('branch_id', $ids)->where('status', 'POSTED');
                $in = (clone $inq)->where('type', 'STOCK_IN')->sum('quantity')
                    + (clone $inq)->where('type', 'TRANSFER_IN')->sum('quantity')
                    + (clone $inq)->where('type', 'ADJUSTMENT_IN')->sum('quantity');
                $out = (clone $inq)->where('type', 'STOCK_OUT')->sum('quantity')
                    + (clone $inq)->where('type', 'TRANSFER_OUT')->sum('quantity')
                    + (clone $inq)->where('type', 'ADJUSTMENT_OUT')->sum('quantity');
                $avail = round((float) $in - (float) $out, 3);
                $min = (float) $row['min_stock_level'];
                $status = $avail <= 0 ? 'Out of Stock' : ($min > 0 && $avail <= $min ? 'Low Stock' : 'Normal');
                $filtered[] = $row + ['available' => $avail, 'total_in' => round((float)$in,3), 'total_out' => round((float)$out,3), 'status' => $status];
            }
            return response()->json($filtered);
        }

        return response()->json($this->service->currentStock($branchId));
    }

    public function ledger(Request $request)
    {
        $query = InventoryTransaction::with(['item.unit', 'branch', 'vendor', 'vehicle'])
            ->orderBy('date')->orderBy('id')
            ->where('status', 'POSTED');

        $this->scopeBranches($query);

        if ($request->filled('item_id')) $query->where('item_id', $request->item_id);
        if ($request->filled('branch_id')) $query->where('branch_id', $request->branch_id);
        if ($request->filled('date_from')) $query->whereDate('date', '>=', $request->date_from);
        if ($request->filled('date_to')) $query->whereDate('date', '<=', $request->date_to);

        $txs = $query->get();

        $running = [];
        $rows = $txs->map(function ($tx) use (&$running) {
            $key = $tx->branch_id.'_'.$tx->item_id;
            $opening = $running[$key] ?? 0;
            $closing = $opening + (float) $tx->signed_quantity;
            $running[$key] = $closing;

            $map = [
                'STOCK_IN' => ['in' => $tx->quantity, 'out' => 0],
                'TRANSFER_IN' => ['tin' => $tx->quantity, 'out' => 0],
                'STOCK_OUT' => ['out' => $tx->quantity],
                'TRANSFER_OUT' => ['tout' => $tx->quantity],
                'ADJUSTMENT_IN' => ['adj' => $tx->quantity],
                'ADJUSTMENT_OUT' => ['adj' => -$tx->quantity],
                'OPENING' => ['in' => $tx->quantity],
            ];
            $cols = $map[$tx->type] ?? [];

            return [
                'date' => $tx->date->toDateString(),
                'transaction_number' => $tx->transaction_number,
                'branch' => $tx->branch?->name,
                'branch_id' => $tx->branch_id,
                'item' => $tx->item?->name,
                'item_id' => $tx->item_id,
                'unit' => $tx->item?->unit?->code,
                'type' => $tx->type,
                'opening_balance' => round($opening, 3),
                'stock_in' => round((float) ($cols['in'] ?? 0), 3),
                'stock_out' => round((float) ($cols['out'] ?? 0), 3),
                'transfer_in' => round((float) ($cols['tin'] ?? 0), 3),
                'transfer_out' => round((float) ($cols['tout'] ?? 0), 3),
                'adjustment' => round((float) ($cols['adj'] ?? 0), 3),
                'closing_balance' => round($closing, 3),
                'vehicle' => $tx->vehicle?->number,
                'vendor_customer' => $tx->vendor?->name ?? $tx->customer,
                'lot' => $tx->lot_number,
                'reference' => $tx->source_reference ?? $tx->reference_type,
            ];
        });

        return response()->json([
            'data' => $rows->values(),
            'links' => null,
            'meta' => ['total' => $rows->count()],
        ]);
    }

    public function lowStock(Request $request)
    {
        $branchId = $request->branch_id ? (int) $request->branch_id : null;
        if (($ids = $this->allowedBranchIds()) && ! $branchId) {
            $rows = collect($this->service->currentStock(null));
            // sum across allowed branches per item
            $aggregated = [];
            foreach ($rows as $r) {
                $id = $r['item_id'];
                if (! isset($aggregated[$id])) {
                    $aggregated[$id] = $r;
                    $aggregated[$id]['available'] = 0;
                    $aggregated[$id]['total_in'] = 0;
                    $aggregated[$id]['total_out'] = 0;
                }
                $inq = InventoryTransaction::where('item_id', $id)->whereIn('branch_id', $ids)->where('status', 'POSTED');
                $in = (clone $inq)->where('type', 'STOCK_IN')->sum('quantity')
                    + (clone $inq)->where('type', 'TRANSFER_IN')->sum('quantity')
                    + (clone $inq)->where('type', 'ADJUSTMENT_IN')->sum('quantity');
                $out = (clone $inq)->where('type', 'STOCK_OUT')->sum('quantity')
                    + (clone $inq)->where('type', 'TRANSFER_OUT')->sum('quantity')
                    + (clone $inq)->where('type', 'ADJUSTMENT_OUT')->sum('quantity');
                $aggregated[$id]['available'] = round((float)$in - (float)$out, 3);
                $aggregated[$id]['total_in'] = round((float)$in, 3);
                $aggregated[$id]['total_out'] = round((float)$out, 3);
            }
            $low = array_values(array_filter($aggregated, fn ($r) => in_array($r['status'], ['Low Stock', 'Out of Stock'], true)));
            foreach ($low as &$row) {
                $avail = $row['available'];
                $min = (float) $row['min_stock_level'];
                $row['status'] = $avail <= 0 ? 'Out of Stock' : ($min > 0 && $avail <= $min ? 'Low Stock' : 'Normal');
            }
            return response()->json($low);
        }

        return response()->json(collect($this->service->currentStock($branchId))
            ->filter(fn ($r) => in_array($r['status'], ['Low Stock', 'Out of Stock'], true))
            ->values());
    }

    public function stockIn(Request $request)
    {
        $data = $request->validate([
            'date' => ['required', 'date'],
            'branch_id' => ['required', 'exists:branches,id'],
            'item_id' => ['required', 'exists:items,id'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'unit_id' => ['nullable', 'exists:units,id'],
            'vehicle_id' => ['nullable', 'exists:vehicles,id'],
            'driver_name' => ['nullable', 'string', 'max:150'],
            'driver_mobile' => ['nullable', 'string', 'max:20'],
            'vendor_id' => ['nullable', 'exists:vendors,id'],
            'lot_number' => ['nullable', 'string', 'max:100'],
            'reference_type' => ['nullable', 'in:Settlement Bill,Purchase,Return,Opening Stock,Manual,Other,SETTLEMENT_BILL,PURCHASE,RETURN,OPENING,MANUAL,OTHER'],
            'reference_id' => ['nullable', 'integer'],
            'source_reference' => ['nullable', 'string', 'max:100'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $map = [
                'Settlement Bill' => 'SETTLEMENT_BILL',
                'Purchase' => 'PURCHASE',
                'Return' => 'RETURN',
                'Opening Stock' => 'OPENING',
                'Manual' => 'MANUAL',
                'Other' => 'OTHER',
            ];
            if (isset($map[$data['reference_type'] ?? ''])) {
                $data['reference_type'] = $map[$data['reference_type']];
            }
            $tx = $this->service->stockIn($data, $request->user()->id);
            return response()->json($tx, 201);
        } catch (\Throwable $e) {
            return $this->error($e, 422);
        }
    }

    public function stockOut(Request $request)
    {
        $data = $request->validate([
            'date' => ['required', 'date'],
            'branch_id' => ['required', 'exists:branches,id'],
            'item_id' => ['required', 'exists:items,id'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'unit_id' => ['nullable', 'exists:units,id'],
            'vehicle_id' => ['nullable', 'exists:vehicles,id'],
            'driver_name' => ['nullable', 'string', 'max:150'],
            'driver_mobile' => ['nullable', 'string', 'max:20'],
            'destination' => ['nullable', 'string', 'max:200'],
            'customer' => ['nullable', 'string', 'max:200'],
            'lot_number' => ['nullable', 'string', 'max:100'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $tx = $this->service->stockOut($data, $request->user()->id);
            return response()->json($tx, 201);
        } catch (\Throwable $e) {
            return $this->error($e, 422);
        }
    }

    public function transfer(Request $request)
    {
        $data = $request->validate([
            'date' => ['required', 'date'],
            'from_branch_id' => ['required', 'exists:branches,id'],
            'to_branch_id' => ['required', 'exists:branches,id', 'different:from_branch_id'],
            'item_id' => ['required', 'exists:items,id'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'unit_id' => ['nullable', 'exists:units,id'],
            'vehicle_id' => ['nullable', 'exists:vehicles,id'],
            'driver_name' => ['nullable', 'string', 'max:150'],
            'driver_mobile' => ['nullable', 'string', 'max:20'],
            'lot_number' => ['nullable', 'string', 'max:100'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $transfer = $this->service->transfer($data, $request->user()->id);
            return response()->json($transfer, 201);
        } catch (\Throwable $e) {
            return $this->error($e, 422);
        }
    }

    public function adjustment(Request $request)
    {
        $data = $request->validate([
            'date' => ['required', 'date'],
            'branch_id' => ['required', 'exists:branches,id'],
            'item_id' => ['required', 'exists:items,id'],
            'direction' => ['required', 'in:IN,OUT'],
            'quantity' => ['required', 'numeric', 'gt:0'],
            'unit_id' => ['nullable', 'exists:units,id'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $adj = $this->service->adjust($data, $request->user()->id);
            return response()->json($adj, 201);
        } catch (\Throwable $e) {
            return $this->error($e, 422);
        }
    }
}
