<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Vehicle extends Model
{
    protected $fillable = [
        'number', 'type', 'owner_name', 'driver_name', 'driver_mobile',
        'rc_number', 'insurance_expiry', 'permit_expiry', 'fitness_expiry',
        'branch_id', 'status',
    ];

    protected function casts(): array
    {
        return [
            'insurance_expiry' => 'date:Y-m-d',
            'permit_expiry' => 'date:Y-m-d',
            'fitness_expiry' => 'date:Y-m-d',
        ];
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }
}
