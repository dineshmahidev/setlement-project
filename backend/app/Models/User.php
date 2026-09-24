<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'employee_id',
        'email',
        'mobile',
        'password',
        'role_id',
        'default_branch_id',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function branches(): BelongsToMany
    {
        return $this->belongsToMany(Branch::class, 'user_branches');
    }

    public function extraPermissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'user_permissions')->withPivot('granted');
    }

    public function defaultBranch(): BelongsTo
    {
        return $this->belongsTo(Branch::class, 'default_branch_id');
    }

    public function isSuperAdmin(): bool
    {
        return $this->role?->name === 'SUPER ADMIN';
    }

    public function canPermission(string $permission): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        $override = $this->extraPermissions->firstWhere('name', $permission);
        if ($override) {
            return (bool) $override->pivot->granted;
        }

        return $this->role?->hasPermission($permission) ?? false;
    }

    public function allowedBranchIds(): ?array
    {
        if ($this->isSuperAdmin()) {
            return null; // null = all branches
        }

        $ids = $this->branches->pluck('id')->all();
        if ($this->default_branch_id && ! in_array($this->default_branch_id, $ids, true)) {
            $ids[] = $this->default_branch_id;
        }

        return $ids ?: [];
    }
}
