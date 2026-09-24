<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(Request $request)
    {
        $query = User::with(['role', 'branches', 'defaultBranch'])->orderBy('name');
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn ($q) => $q->where('name', 'like', "%$s%")->orWhere('email', 'like', "%$s%"));
        }
        return response()->json($query->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'employee_id' => ['nullable', 'string', 'max:30', 'unique:users,employee_id'],
            'email' => ['required', 'email', 'unique:users,email'],
            'mobile' => ['nullable', 'string', 'max:20'],
            'password' => ['required', 'string', 'min:6'],
            'role_id' => ['required', 'exists:roles,id'],
            'default_branch_id' => ['nullable', 'exists:branches,id'],
            'branch_ids' => ['nullable', 'array'],
            'branch_ids.*' => ['exists:branches,id'],
            'status' => ['nullable', 'in:ACTIVE,INACTIVE'],
        ]);

        $branchIds = $data['branch_ids'] ?? [];
        if (! empty($data['default_branch_id']) && ! in_array($data['default_branch_id'], $branchIds, true)) {
            $branchIds[] = $data['default_branch_id'];
        }

        $user = User::create([
            'name' => $data['name'],
            'employee_id' => $data['employee_id'] ?? null,
            'email' => $data['email'],
            'mobile' => $data['mobile'] ?? null,
            'password' => Hash::make($data['password']),
            'role_id' => $data['role_id'],
            'default_branch_id' => $data['default_branch_id'] ?? null,
            'status' => $data['status'] ?? 'ACTIVE',
        ]);

        if ($branchIds) {
            $user->branches()->sync($branchIds);
        }

        $this->audit->log('CREATE', 'User', $user->id, null, ['email' => $user->email]);
        return response()->json($user->load(['role', 'branches']), 201);
    }

    public function show(User $user)
    {
        return response()->json($user->load(['role.permissions', 'branches', 'extraPermissions']));
    }

    public function update(Request $request, User $user)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'employee_id' => ['nullable', 'string', 'max:30', 'unique:users,employee_id,'.$user->id],
            'email' => ['sometimes', 'email', 'unique:users,email,'.$user->id],
            'mobile' => ['nullable', 'string', 'max:20'],
            'password' => ['nullable', 'string', 'min:6'],
            'role_id' => ['sometimes', 'exists:roles,id'],
            'default_branch_id' => ['nullable', 'exists:branches,id'],
            'branch_ids' => ['nullable', 'array'],
            'branch_ids.*' => ['exists:branches,id'],
            'status' => ['nullable', 'in:ACTIVE,INACTIVE'],
        ]);

        $old = $user->only(['name', 'email', 'role_id', 'status']);

        if (! empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        if (array_key_exists('branch_ids', $data)) {
            $branchIds = $data['branch_ids'] ?? [];
            if (! empty($user->default_branch_id) && ! in_array($user->default_branch_id, $branchIds, true)) {
                $branchIds[] = $user->default_branch_id;
            }
            $user->branches()->sync($branchIds);
        }

        $this->audit->log('UPDATE', 'User', $user->id, $old, $user->only(['name', 'email', 'role_id', 'status']));
        return response()->json($user->load(['role', 'branches']));
    }

    public function destroy(User $user)
    {
        if ($user->id === request()->user()->id) {
            return response()->json(['message' => 'Cannot delete yourself'], 422);
        }
        $this->audit->log('ARCHIVE', 'User', $user->id, $user->toArray(), ['status' => 'INACTIVE']);
        $user->update(['status' => 'INACTIVE']);
        return response()->json(['message' => 'User archived']);
    }
}
