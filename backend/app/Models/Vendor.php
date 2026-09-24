<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vendor extends Model
{
    protected $fillable = [
        'code', 'name', 'address', 'city', 'district', 'state', 'pincode',
        'gst_number', 'phone', 'email', 'pan', 'po_number',
        'default_branch_id', 'status',
    ];

    public function contacts(): HasMany
    {
        return $this->hasMany(VendorContact::class);
    }

    public function defaultBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'default_branch_id');
    }
}
