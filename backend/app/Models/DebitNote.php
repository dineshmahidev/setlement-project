<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DebitNote extends Model
{
    protected $fillable = [
        'number', 'date', 'branch_id', 'vendor_id', 'settlement_bill_id',
        'invoice_number', 'invoice_date', 'lot_number', 'particulars',
        'rebate', 'invoice_value', 'gst_type', 'gst_rate',
        'cgst_amount', 'sgst_amount', 'igst_amount', 'total',
        'status', 'remarks', 'created_by', 'approved_by', 'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'invoice_date' => 'date:Y-m-d',
            'approved_at' => 'datetime',
            'rebate' => 'decimal:2',
            'invoice_value' => 'decimal:2',
            'cgst_amount' => 'decimal:2',
            'sgst_amount' => 'decimal:2',
            'igst_amount' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }

    public function branch(): BelongsTo { return $this->belongsTo(Branch::class); }
    public function vendor(): BelongsTo { return $this->belongsTo(Vendor::class); }
    public function bill(): BelongsTo { return $this->belongsTo(SettlementBill::class, 'settlement_bill_id'); }
    public function taxes(): HasMany { return $this->hasMany(DebitNoteTax::class); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
}
