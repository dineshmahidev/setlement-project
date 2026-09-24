<?php

namespace App\Http\Controllers;

use App\Models\CompanySetting;
use App\Services\AuditService;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function __construct(private AuditService $audit) {}

    private const KEYS = [
        'company_name', 'company_logo', 'address', 'gstin', 'cin', 'email',
        'website', 'phone', 'default_gst', 'invoice_prefix', 'debit_note_prefix',
        'bill_number_format', 'currency', 'default_branch_id', 'pdf_header',
        'pdf_footer', 'signature', 'seal', 'inventory_quantity_source',
        'allow_negative_stock',
    ];

    public function index()
    {
        $settings = CompanySetting::pluck('value', 'key')->all();
        $payload = [];
        foreach (self::KEYS as $key) {
            $payload[$key] = $settings[$key] ?? null;
        }
        return response()->json($payload);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'company_name' => ['nullable', 'string', 'max:200'],
            'company_logo' => ['nullable', 'string'],
            'address' => ['nullable', 'string'],
            'gstin' => ['nullable', 'string', 'max:20'],
            'cin' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email'],
            'website' => ['nullable', 'string', 'max:200'],
            'phone' => ['nullable', 'string', 'max:20'],
            'default_gst' => ['nullable', 'string', 'max:50'],
            'invoice_prefix' => ['nullable', 'string', 'max:20'],
            'debit_note_prefix' => ['nullable', 'string', 'max:20'],
            'bill_number_format' => ['nullable', 'string', 'max:100'],
            'currency' => ['nullable', 'string', 'max:10'],
            'default_branch_id' => ['nullable', 'exists:branches,id'],
            'pdf_header' => ['nullable', 'string'],
            'pdf_footer' => ['nullable', 'string'],
            'signature' => ['nullable', 'string'],
            'seal' => ['nullable', 'string'],
            'inventory_quantity_source' => ['nullable', 'in:FINAL_WEIGHT,NET_WEIGHT,MANUAL_QUANTITY'],
            'allow_negative_stock' => ['nullable', 'boolean'],
        ]);

        $old = [];
        foreach ($data as $key => $value) {
            $type = $key === 'allow_negative_stock' ? 'BOOLEAN' : 'TEXT';
            $old[$key] = CompanySetting::getValue($key);
            CompanySetting::setValue($key, $value === true ? '1' : ($value === false ? '0' : $value), $type);
        }

        $this->audit->log('UPDATE', 'CompanySetting', null, $old, $data);

        return response()->json($this->index()->getData(true));
    }
}
