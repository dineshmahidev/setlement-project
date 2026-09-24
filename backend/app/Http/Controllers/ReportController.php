<?php

namespace App\Http\Controllers;

use App\Models\DebitNote;
use App\Models\InventoryTransaction;
use App\Models\SettlementBill;
use App\Models\VehicleMovement;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function __construct(private InventoryService $inventory) {}

    private const TYPES = [
        'settlement', 'debit-note', 'vendor', 'qc', 'current-stock',
        'stock-ledger', 'stock-in', 'stock-out', 'branch-stock',
        'vehicle-movement', 'vehicle-wise', 'gst', 'low-stock', 'date-wise',
    ];

    public function index(Request $request, string $type)
    {
        if (! in_array($type, self::TYPES, true)) {
            return response()->json(['message' => 'Unknown report: '.$type], 404);
        }

        $rows = $this->build($type, $request);
        $total = is_array($rows) ? count($rows) : 0;

        return response()->json([
            'type' => $type,
            'total' => $total,
            'data' => $rows,
        ]);
    }

    public function export(Request $request, string $type)
    {
        if (! in_array($type, self::TYPES, true)) {
            return response()->json(['message' => 'Unknown report: '.$type], 404);
        }

        $format = $request->get('format', 'csv');
        $rows = $this->build($type, $request);

        if ($format === 'csv' || $format === 'excel') {
            if (! $rows) {
                return response()->csv("{$type}.csv", []);
            }
            $headers = array_keys((array) $rows[0]);
            $callback = function () use ($rows, $headers) {
                $out = fopen('php://output', 'w');
                fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM
                fputcsv($out, $headers);
                foreach ($rows as $row) {
                    fputcsv($out, array_map(fn ($v) => is_scalar($v) || $v === null ? $v : json_encode($v), array_values((array) $row)));
                }
                fclose($out);
            };
            $ext = $format === 'excel' ? 'xls' : 'csv';
            return response()->streamDownload($callback, "{$type}.".now()->format('Ymd_His').".{$ext}", [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]);
        }

        if ($format === 'pdf') {
            $pdf = \Barryvdh\DomPDF\Facade\PdF::loadView('pdf.report', [
                'title' => ucfirst(str_replace('-', ' ', $type)).' Report',
                'rows' => $rows,
                'settings' => \App\Models\CompanySetting::pluck('value', 'key')->all(),
                'generatedAt' => now()->format('d-m-Y H:i'),
            ]);
            return $pdf->stream($type.'-report.pdf');
        }

        return response()->json(['data' => $rows]);
    }

    private function build(string $type, Request $request): array
    {
        $branchId = $request->branch_id ?: null;
        $allowed = $this->allowedBranchIds();
        $dateFrom = $request->date_from;
        $dateTo = $request->date_to;

        $scope = function ($q) use ($branchId, $allowed) {
            if ($branchId) $q->where('branch_id', $branchId);
            elseif ($allowed) $q->whereIn('branch_id', $allowed);
            return $q;
        };

        switch ($type) {
            case 'settlement':
                return $scope(SettlementBill::with(['vendor', 'branch', 'item', 'vehicle'])
                    ->when($dateFrom, fn ($q) => $q->whereDate('bill_date', '>=', $dateFrom))
                    ->when($dateTo, fn ($q) => $q->whereDate('bill_date', '<=', $dateTo))
                    ->when($request->vendor_id, fn ($q) => $q->where('vendor_id', $request->vendor_id))
                    ->when($request->bill_number, fn ($q) => $q->where('bill_number', 'like', '%'.$request->bill_number.'%'))
                    ->when($request->lot_number, fn ($q) => $q->where('lot_number', 'like', '%'.$request->lot_number.'%'))
                    ->when($request->status, fn ($q) => $q->where('status', $request->status))
                    ->orderByDesc('bill_date')->get())
                    ->map(fn ($b) => [
                        'Bill Number' => $b->bill_number,
                        'Date' => $b->bill_date?->toDateString(),
                        'Branch' => $b->branch?->name,
                        'Vendor' => $b->vendor?->name,
                        'Item' => $b->item?->name,
                        'Lot' => $b->lot_number,
                        'Vehicle' => $b->vehicle?->number,
                        'Net Weight' => $b->net_weight,
                        'Final Weight' => $b->final_weight,
                        'Rate' => $b->final_unit_rate,
                        'Total Value' => $b->total_value,
                        'GST Type' => $b->gst_type,
                        'Net Payable' => $b->net_payable,
                        'Status' => $b->status,
                    ])->all();

            case 'debit-note':
                return $scope(DebitNote::with(['vendor', 'branch'])
                    ->when($dateFrom, fn ($q) => $q->whereDate('date', '>=', $dateFrom))
                    ->when($dateTo, fn ($q) => $q->whereDate('date', '<=', $dateTo))
                    ->when($request->vendor_id, fn ($q) => $q->where('vendor_id', $request->vendor_id))
                    ->orderByDesc('date')->get())
                    ->map(fn ($n) => [
                        'Number' => $n->number,
                        'Date' => $n->date?->toDateString(),
                        'Branch' => $n->branch?->name,
                        'Vendor' => $n->vendor?->name,
                        'Invoice' => $n->invoice_number,
                        'Rebate' => $n->rebate,
                        'Invoice Value' => $n->invoice_value,
                        'CGST' => $n->cgst_amount,
                        'SGST' => $n->sgst_amount,
                        'IGST' => $n->igst_amount,
                        'Total' => $n->total,
                        'Status' => $n->status,
                    ])->all();

            case 'vendor':
                return \App\Models\Vendor::orderBy('name')->get()
                    ->map(fn ($v) => [
                        'Code' => $v->code,
                        'Name' => $v->name,
                        'City' => $v->city,
                        'State' => $v->state,
                        'GST' => $v->gst_number,
                        'Phone' => $v->phone,
                        'PO Number' => $v->po_number,
                        'Status' => $v->status,
                    ])->all();

            case 'qc':
                return $scope(SettlementBill::with(['qc', 'vendor', 'branch'])
                    ->whereHas('qc')
                    ->when($dateFrom, fn ($q) => $q->whereDate('bill_date', '>=', $dateFrom))
                    ->when($dateTo, fn ($q) => $q->whereDate('bill_date', '<=', $dateTo))
                    ->orderByDesc('bill_date')->get())
                    ->flatMap(fn ($b) => $b->qc->map(fn ($q) => [
                        'Bill Number' => $b->bill_number,
                        'Date' => $b->bill_date?->toDateString(),
                        'Vendor' => $b->vendor?->name,
                        'QC Field' => $q->name,
                        'Value' => $q->value,
                        'Unit' => $q->unit,
                        'Remarks' => $q->remarks,
                    ]))->values()->all();

            case 'current-stock':
                return collect($this->inventory->currentStock($branchId ? (int) $branchId : null))
                    ->map(fn ($r) => [
                        'Item Code' => $r['item_code'],
                        'Item' => $r['item_name'],
                        'Unit' => $r['unit'],
                        'Total In' => $r['total_in'],
                        'Total Out' => $r['total_out'],
                        'Available' => $r['available'],
                        'Min Level' => $r['min_stock_level'],
                        'Status' => $r['status'],
                    ])->all();

            case 'stock-ledger':
                $resp = $this->ledgerRows($request, $scope);
                return $resp;

            case 'stock-in':
            case 'stock-out':
                $typeVal = $type === 'stock-in' ? 'STOCK_IN' : 'STOCK_OUT';
                return $scope(InventoryTransaction::with(['item', 'branch', 'vendor', 'vehicle'])
                    ->where('type', $typeVal)->where('status', 'POSTED')
                    ->when($dateFrom, fn ($q) => $q->whereDate('date', '>=', $dateFrom))
                    ->when($dateTo, fn ($q) => $q->whereDate('date', '<=', $dateTo))
                    ->when($request->item_id, fn ($q) => $q->where('item_id', $request->item_id))
                    ->orderByDesc('date')->get())
                    ->map(fn ($t) => [
                        'Txn Number' => $t->transaction_number,
                        'Date' => $t->date?->toDateString(),
                        'Branch' => $t->branch?->name,
                        'Item' => $t->item?->name,
                        'Quantity' => $t->quantity,
                        'Vehicle' => $t->vehicle?->number,
                        'Vendor/Customer' => $t->vendor?->name ?? $t->customer,
                        'Lot' => $t->lot_number,
                        'Reference' => $t->source_reference ?? $t->reference_type,
                    ])->all();

            case 'branch-stock':
                $stock = $this->inventory->currentStock(null);
                $byBranch = [];
                $txs = InventoryTransaction::where('status', 'POSTED')
                    ->when($branchId, fn ($q) => $q->where('branch_id', $branchId))
                    ->when(! $branchId && $allowed, fn ($q) => $q->whereIn('branch_id', $allowed))
                    ->get(['branch_id', 'item_id', 'signed_quantity']);
                foreach ($txs as $tx) {
                    $byBranch[$tx->branch_id] = ($byBranch[$tx->branch_id] ?? 0) + (float) $tx->signed_quantity;
                }
                return collect($byBranch)->map(function ($qty, $bid) {
                    $b = \App\Models\Branch::find($bid);
                    return ['Branch' => $b?->name, 'Stock' => round($qty, 3)];
                })->values()->all();

            case 'vehicle-movement':
                return $scope(VehicleMovement::with(['vehicle', 'branch', 'vendor', 'item'])
                    ->when($dateFrom, fn ($q) => $q->whereDate('date', '>=', $dateFrom))
                    ->when($dateTo, fn ($q) => $q->whereDate('date', '<=', $dateTo))
                    ->when($request->vehicle_id, fn ($q) => $q->where('vehicle_id', $request->vehicle_id))
                    ->orderByDesc('date')->get())
                    ->map(fn ($m) => [
                        'Date' => $m->date?->toDateString(),
                        'Vehicle' => $m->vehicle?->number,
                        'Driver' => $m->driver_name ?? $m->vehicle?->driver_name,
                        'Branch' => $m->branch?->name,
                        'Type' => $m->transaction_type,
                        'Vendor' => $m->vendor?->name,
                        'Customer' => $m->customer,
                        'Item' => $m->item?->name,
                        'Quantity' => $m->quantity,
                        'Lot' => $m->lot_number,
                        'Reference' => $m->reference_number,
                    ])->all();

            case 'vehicle-wise':
                return VehicleMovement::with(['vehicle'])
                    ->when($request->vehicle_id, fn ($q) => $q->where('vehicle_id', $request->vehicle_id))
                    ->when($dateFrom, fn ($q) => $q->whereDate('date', '>=', $dateFrom))
                    ->when($dateTo, fn ($q) => $q->whereDate('date', '<=', $dateTo))
                    ->get()
                    ->groupBy(fn ($m) => $m->vehicle?->number ?? 'N/A')
                    ->map(function ($group, $vno) {
                        return [
                            'Vehicle' => $vno,
                            'Movements' => $group->count(),
                            'Total Quantity' => round($group->sum('quantity'), 3),
                            'Types' => $group->pluck('transaction_type')->unique()->implode(', '),
                        ];
                    })->values()->all();

            case 'gst':
                return $scope(SettlementBill::with(['vendor', 'branch'])
                    ->where('gst_type', '!=', 'NONE')
                    ->when($dateFrom, fn ($q) => $q->whereDate('bill_date', '>=', $dateFrom))
                    ->when($dateTo, fn ($q) => $q->whereDate('bill_date', '<=', $dateTo))
                    ->orderByDesc('bill_date')->get())
                    ->map(fn ($b) => [
                        'Bill Number' => $b->bill_number,
                        'Date' => $b->bill_date?->toDateString(),
                        'Vendor' => $b->vendor?->name,
                        'GST Type' => $b->gst_type,
                        'GST Rate' => $b->gst_rate,
                        'Taxable' => $b->taxable_amount,
                        'CGST' => $b->cgst_amount,
                        'SGST' => $b->sgst_amount,
                        'IGST' => $b->igst_amount,
                        'Net Payable' => $b->net_payable,
                    ])->all();

            case 'low-stock':
                return collect($this->inventory->currentStock($branchId ? (int) $branchId : null))
                    ->filter(fn ($r) => in_array($r['status'], ['Low Stock', 'Out of Stock'], true))
                    ->map(fn ($r) => [
                        'Item Code' => $r['item_code'],
                        'Item' => $r['item_name'],
                        'Available' => $r['available'],
                        'Min Level' => $r['min_stock_level'],
                        'Unit' => $r['unit'],
                        'Status' => $r['status'],
                    ])->values()->all();

            case 'date-wise':
                $settlements = $scope(SettlementBill::where('status', '!=', 'CANCELLED')
                    ->when($dateFrom, fn ($q) => $q->whereDate('bill_date', '>=', $dateFrom))
                    ->when($dateTo, fn ($q) => $q->whereDate('bill_date', '<=', $dateTo))
                    ->get(['bill_date', 'net_payable']));
                $stocks = $scope(InventoryTransaction::where('status', 'POSTED')
                    ->when($dateFrom, fn ($q) => $q->whereDate('date', '>=', $dateFrom))
                    ->when($dateTo, fn ($q) => $q->whereDate('date', '<=', $dateTo))
                    ->get(['date', 'type', 'quantity']));

                $grouped = [];
                foreach ($settlements as $s) {
                    $d = $s->bill_date->toDateString();
                    $grouped[$d] = $grouped[$d] ?? ['Date' => $d, 'Bills' => 0, 'Settlement Value' => 0, 'Stock In' => 0, 'Stock Out' => 0];
                    $grouped[$d]['Bills']++;
                    $grouped[$d]['Settlement Value'] += (float) $s->net_payable;
                }
                foreach ($stocks as $st) {
                    $d = $st->date->toDateString();
                    $grouped[$d] = $grouped[$d] ?? ['Date' => $d, 'Bills' => 0, 'Settlement Value' => 0, 'Stock In' => 0, 'Stock Out' => 0];
                    if ($st->type === 'STOCK_IN') $grouped[$d]['Stock In'] += (float) $st->quantity;
                    if ($st->type === 'STOCK_OUT') $grouped[$d]['Stock Out'] += (float) $st->quantity;
                }
                ksort($grouped);
                return array_values($grouped);
        }

        return [];
    }

    private function ledgerRows(Request $request, callable $scope): array
    {
        $txs = $scope(InventoryTransaction::with(['item', 'branch', 'vendor', 'vehicle'])
            ->where('status', 'POSTED')
            ->when($request->item_id, fn ($q) => $q->where('item_id', $request->item_id))
            ->when($request->date_from, fn ($q) => $q->whereDate('date', '>=', $request->date_from))
            ->when($request->date_to, fn ($q) => $q->whereDate('date', '<=', $request->date_to))
            ->orderBy('date')->orderBy('id')->get());

        $running = [];
        return $txs->map(function ($tx) use (&$running) {
            $key = $tx->branch_id.'_'.$tx->item_id;
            $opening = $running[$key] ?? 0;
            $closing = $opening + (float) $tx->signed_quantity;
            $running[$key] = $closing;
            return [
                'Date' => $tx->date->toDateString(),
                'Txn' => $tx->transaction_number,
                'Branch' => $tx->branch?->name,
                'Item' => $tx->item?->name,
                'Type' => $tx->type,
                'Opening' => round($opening, 3),
                'In' => $tx->type === 'STOCK_IN' || $tx->type === 'TRANSFER_IN' || $tx->type === 'ADJUSTMENT_IN' ? (float) $tx->quantity : 0,
                'Out' => $tx->type === 'STOCK_OUT' || $tx->type === 'TRANSFER_OUT' || $tx->type === 'ADJUSTMENT_OUT' ? (float) $tx->quantity : 0,
                'Closing' => round($closing, 3),
                'Vehicle' => $tx->vehicle?->number,
                'Lot' => $tx->lot_number,
                'Reference' => $tx->source_reference ?? $tx->reference_type,
            ];
        })->all();
    }
}
