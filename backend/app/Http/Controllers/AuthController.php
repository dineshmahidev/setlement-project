<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::with(['role.permissions', 'branches', 'defaultBranch', 'extraPermissions'])
            ->where('email', $data['email'])
            ->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials.'],
            ]);
        }

        if ($user->status !== 'ACTIVE') {
            throw ValidationException::withMessages([
                'email' => ['Account is inactive.'],
            ]);
        }

        $user->tokens()->delete();
        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load(['role.permissions', 'branches', 'defaultBranch', 'extraPermissions']);
        return response()->json(['user' => $this->userPayload($user)]);
    }

    private function userPayload(User $user): array
    {
        $rolePerms = $user->role?->permissions->pluck('name') ?? collect();
        $overrides = $user->extraPermissions->mapWithKeys(fn ($p) => [$p->name => (bool) $p->pivot->granted]);
        $permissions = [];
        foreach ($rolePerms as $p) {
            $permissions[$p] = true;
        }
        foreach ($overrides as $k => $v) {
            $permissions[$k] = $v;
        }
        $permissions = array_keys(array_filter($permissions));

        if ($user->isSuperAdmin()) {
            $permissions = ['*'];
        }

        return [
            'id' => $user->id,
            'name' => $user->name,
            'employee_id' => $user->employee_id,
            'email' => $user->email,
            'mobile' => $user->mobile,
            'role' => $user->role?->name,
            'role_label' => $user->role?->label,
            'status' => $user->status,
            'default_branch_id' => $user->default_branch_id,
            'default_branch' => $user->defaultBranch,
            'branches' => $user->isSuperAdmin()
                ? \App\Models\Branch::orderBy('name')->get()
                : $user->branches,
            'all_branches' => $user->isSuperAdmin(),
            'permissions' => $permissions,
        ];
    }
}
