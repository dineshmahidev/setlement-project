<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Branch extends Model
{
    protected $fillable = [
        'code', 'name', 'address', 'city', 'district', 'state',
        'pincode', 'gstin', 'phone', 'email', 'status',
    ];

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'default_branch_id');
    }
}
