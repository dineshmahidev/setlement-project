<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use App\Services\AuditService;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index()
    {
        return response()->json(Role::with('permissions')->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:50', 'unique:roles,name'],
            'label' => ['required', 'string', 'max:100'],
            'permissions' => ['nullable', 'array'],
        ]);

        $role = Role::create($data);
        if (! empty($data['permissions'])) {
            $role->permissions()->sync($data['permissions']);
        }
        $this->audit->log('CREATE', 'Role', $role->id, null, $data);
        return response()->json($role->load('permissions'), 201);
    }

    public function show(Role $role)
    {
        return response()->json($role->load('permissions'));
    }

    public function update(Request $request, Role $role)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:50', 'unique:roles,name,'.$role->id],
            'label' => ['sometimes', 'string', 'max:100'],
            'permissions' => ['nullable', 'array'],
        ]);

        $old = $role->permissions->pluck('name')->all();
        $role->update($data);
        if (array_key_exists('permissions', $data)) {
            $role->permissions()->sync($data['permissions'] ?? []);
        }
        $this->audit->log('UPDATE', 'Role', $role->id, ['permissions' => $old], $data);
        return response()->json($role->load('permissions'));
    }

    public function destroy(Role $role)
    {
        if ($role->users()->exists()) {
            return response()->json(['message' => 'Role is in use'], 422);
        }
        $role->permissions()->detach();
        $role->delete();
        return response()->json(['message' => 'Role deleted']);
    }
}
