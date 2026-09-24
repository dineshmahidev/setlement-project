<?php

namespace App\Http\Controllers;

use App\Models\DebitNote;
use App\Services\DebitNoteService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class DebitNoteController extends Controller
{
    public function __construct(private DebitNoteService $service) {}

    public function index(Request $request)
    {
        $query = DebitNote::with(['vendor', 'branch', 'bill'])
            ->orderByDesc('date')->orderByDesc('id');

        $this->scopeBranches($query);

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn ($q) => $q
                ->where('number', 'like', "%$s%")
                ->orWhere('invoice_number', 'like', "%$s%")
                ->orWhere('lot_number', 'like', "%$s%"));
        }
        if ($request->filled('status')) $query->where('status', $request->status);
        if ($request->filled('vendor_id')) $query->where('vendor_id', $request->vendor_id);
        if ($request->filled('date_from')) $query->whereDate('date', '>=', $request->date_from);
        if ($request->filled('date_to')) $query->whereDate('date', '<=', $request->date_to);

        return response()->json($query->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'number' => ['nullable', 'string', 'max:50', 'unique:debit_notes,number'],
            'date' => ['required', 'date'],
            'branch_id' => ['required', 'exists:branches,id'],
            'vendor_id' => ['required', 'exists:vendors,id'],
            'settlement_bill_id' => ['nullable', 'exists:settlement_bills,id'],
            'invoice_number' => ['nullable', 'string', 'max:50'],
            'invoice_date' => ['nullable', 'date'],
            'lot_number' => ['nullable', 'string', 'max:100'],
            'particulars' => ['nullable', 'string', 'max:500'],
            'rebate' => ['nullable', 'numeric', 'min:0'],
            'invoice_value' => ['required', 'numeric', 'min:0'],
            'gst_type' => ['nullable', 'in:CGST_SGST,IGST,NONE'],
            'gst_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'remarks' => ['nullable', 'string'],
        ]);

        try {
            $note = $this->service->create($data, $request->user()->id);
            return response()->json($note, 201);
        } catch (\Throwable $e) {
            return $this->error($e, 422);
        }
    }

    public function show(DebitNote $debitNote)
    {
        return response()->json($debitNote->load(['vendor', 'branch', 'bill', 'taxes', 'creator', 'approver']));
    }

    public function update(Request $request, DebitNote $debitNote)
    {
        if ($debitNote->status !== 'DRAFT') {
            return response()->json(['message' => 'Only Draft debit notes can be edited'], 422);
        }

        $data = $request->validate([
            'number' => ['sometimes', 'string', 'max:50', 'unique:debit_notes,number,'.$debitNote->id],
            'date' => ['sometimes', 'date'],
            'branch_id' => ['sometimes', 'exists:branches,id'],
            'vendor_id' => ['sometimes', 'exists:vendors,id'],
            'settlement_bill_id' => ['nullable', 'exists:settlement_bills,id'],
            'invoice_number' => ['nullable', 'string', 'max:50'],
            'invoice_date' => ['nullable', 'date'],
            'lot_number' => ['nullable', 'string', 'max:100'],
            'particulars' => ['nullable', 'string', 'max:500'],
            'rebate' => ['nullable', 'numeric', 'min:0'],
            'invoice_value' => ['sometimes', 'numeric', 'min:0'],
            'gst_type' => ['nullable', 'in:CGST_SGST,IGST,NONE'],
            'gst_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'remarks' => ['nullable', 'string'],
        ]);

        $debitNote->update($data);

        // Recalculate taxes
        $base = round((float) $debitNote->invoice_value - (float) $debitNote->rebate, 2);
        $gst = app(\App\Services\SettlementCalculationService::class)
            ->calculateGst($debitNote->gst_type, $base, (float) $debitNote->gst_rate);
        $debitNote->update([
            'cgst_amount' => $gst['cgst_amount'],
            'sgst_amount' => $gst['sgst_amount'],
            'igst_amount' => $gst['igst_amount'],
            'total' => round($base + $gst['cgst_amount'] + $gst['sgst_amount'] + $gst['igst_amount'], 2),
        ]);
        $debitNote->taxes()->delete();
        foreach ($gst['taxes'] as $t) $debitNote->taxes()->create($t);

        return response()->json($debitNote->fresh('taxes'));
    }

    public function approve(Request $request, DebitNote $debitNote)
    {
        try {
            return response()->json($this->service->approve($debitNote, $request->user()->id));
        } catch (\Throwable $e) {
            return $this->error($e, 422);
        }
    }

    public function cancel(Request $request, DebitNote $debitNote)
    {
        try {
            return response()->json($this->service->cancel($debitNote, $request->user()->id));
        } catch (\Throwable $e) {
            return $this->error($e, 422);
        }
    }

    public function pdf(DebitNote $debitNote)
    {
        $note = $debitNote->load(['vendor', 'branch', 'bill', 'taxes']);
        $settings = \App\Models\CompanySetting::pluck('value', 'key')->all();
        $pdf = Pdf::loadView('pdf.debit-note', ['note' => $note, 'settings' => $settings]);
        return $pdf->stream('debit-note-'.str_replace(['/', '\\'], '-', $note->number).'.pdf');
    }
}
