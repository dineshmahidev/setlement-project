<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Models\Branch;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CoreSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'dashboard.view' => 'View Dashboard',
            'branches.manage' => 'Manage Branches',
            'users.manage' => 'Manage Users & Roles',
            'vendors.view' => 'View Vendors',
            'vendors.create' => 'Create Vendors',
            'vendors.edit' => 'Edit Vendors',
            'vendors.delete' => 'Delete Vendors',
            'vehicles.view' => 'View Vehicles',
            'vehicles.create' => 'Create Vehicles',
            'vehicles.edit' => 'Edit Vehicles',
            'vehicles.delete' => 'Delete Vehicles',
            'items.view' => 'View Items',
            'items.create' => 'Create Items',
            'items.edit' => 'Edit Items',
            'items.delete' => 'Delete Items',
            'settlement.view' => 'View Settlement Bills',
            'settlement.create' => 'Create Settlement Bills',
            'settlement.edit' => 'Edit Settlement Bills',
            'settlement.approve' => 'Approve Settlement Bills',
            'settlement.cancel' => 'Cancel Settlement Bills',
            'debitnote.view' => 'View Debit Notes',
            'debitnote.create' => 'Create Debit Notes',
            'debitnote.approve' => 'Approve Debit Notes',
            'inventory.view' => 'View Inventory',
            'inventory.stock_in' => 'Stock In',
            'inventory.stock_out' => 'Stock Out',
            'inventory.transfer' => 'Stock Transfer',
            'inventory.adjust' => 'Stock Adjustment',
            'vehicle.view' => 'View Vehicle Movements',
            'reports.view' => 'View Reports',
            'settings.manage' => 'Manage Settings & Field Config',
            'audit.view' => 'View Audit Logs',
        ];

        foreach ($permissions as $name => $label) {
            Permission::updateOrCreate(['name' => $name], ['label' => $label]);
        }

        $all = Permission::pluck('id', 'name');

        $rolePerms = [
            'SUPER ADMIN' => $all->keys()->all(),
            'ADMIN' => array_diff($all->keys()->all(), []),
            'BRANCH MANAGER' => [
                'dashboard.view', 'vendors.view', 'vendors.create', 'vendors.edit',
                'vehicles.view', 'items.view', 'settlement.view', 'settlement.create',
                'settlement.edit', 'settlement.approve', 'debitnote.view', 'debitnote.create',
                'inventory.view', 'inventory.stock_in', 'inventory.stock_out', 'inventory.transfer',
                'vehicle.view', 'reports.view',
            ],
            'BILLING STAFF' => [
                'dashboard.view', 'vendors.view', 'vehicles.view', 'items.view',
                'settlement.view', 'settlement.create', 'settlement.edit',
                'debitnote.view', 'debitnote.create', 'reports.view',
            ],
            'INVENTORY STAFF' => [
                'dashboard.view', 'items.view', 'vehicles.view', 'inventory.view',
                'inventory.stock_in', 'inventory.stock_out', 'inventory.transfer',
                'inventory.adjust', 'vehicle.view', 'reports.view',
            ],
            'ACCOUNTS STAFF' => [
                'dashboard.view', 'vendors.view', 'settlement.view', 'settlement.edit',
                'debitnote.view', 'debitnote.create', 'debitnote.approve', 'reports.view',
            ],
            'VIEWER' => [
                'dashboard.view', 'vendors.view', 'vehicles.view', 'items.view',
                'settlement.view', 'debitnote.view', 'inventory.view', 'vehicle.view',
                'reports.view',
            ],
        ];

        foreach ($rolePerms as $roleName => $perms) {
            $role = Role::updateOrCreate(['name' => $roleName], ['label' => str_replace(' ', '', ucwords(strtolower($roleName)))]);
            $ids = collect($perms)->map(fn ($p) => $all[$p])->filter()->all();
            $role->permissions()->sync($ids);
        }

        // Branches
        $tiruppur = Branch::updateOrCreate(['code' => 'TPR'], [
            'name' => 'Tiruppur',
            'address' => 'Industrial Estate, Tiruppur',
            'city' => 'Tiruppur',
            'district' => 'Tiruppur',
            'state' => 'Tamil Nadu',
            'pincode' => '641604',
            'gstin' => '33AABCS1429B1Z0',
            'phone' => '0421-2200000',
            'email' => 'tiruppur@svmaagro.com',
            'status' => 'ACTIVE',
        ]);

        $dindigul = Branch::updateOrCreate(['code' => 'DGL'], [
            'name' => 'Dindigul',
            'address' => 'Main Road, Dindigul',
            'city' => 'Dindigul',
            'district' => 'Dindigul',
            'state' => 'Tamil Nadu',
            'pincode' => '624001',
            'gstin' => '33AABCS1429B1Z1',
            'phone' => '0451-2000000',
            'email' => 'dindigul@svmaagro.com',
            'status' => 'ACTIVE',
        ]);

        // Admin user
        User::updateOrCreate(['email' => 'admin@svmaagro.com'], [
            'name' => 'Super Admin',
            'employee_id' => 'EMP001',
            'mobile' => '9999999999',
            'password' => Hash::make('password'),
            'role_id' => Role::where('name', 'SUPER ADMIN')->first()->id,
            'default_branch_id' => $tiruppur->id,
            'status' => 'ACTIVE',
        ]);

        $bm = User::updateOrCreate(['email' => 'manager@svmaagro.com'], [
            'name' => 'Branch Manager',
            'employee_id' => 'EMP002',
            'mobile' => '9888888888',
            'password' => Hash::make('password'),
            'role_id' => Role::where('name', 'BRANCH MANAGER')->first()->id,
            'default_branch_id' => $tiruppur->id,
            'status' => 'ACTIVE',
        ]);
        $bm->branches()->sync([$tiruppur->id]);

        $inv = User::updateOrCreate(['email' => 'inventory@svmaagro.com'], [
            'name' => 'Inventory Staff',
            'employee_id' => 'EMP003',
            'mobile' => '9777777777',
            'password' => Hash::make('password'),
            'role_id' => Role::where('name', 'INVENTORY STAFF')->first()->id,
            'default_branch_id' => $tiruppur->id,
            'status' => 'ACTIVE',
        ]);
        $inv->branches()->sync([$tiruppur->id]);
    }
}
