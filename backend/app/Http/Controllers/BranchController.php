<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Services\AuditService;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(Request $request)
    {
        $query = Branch::orderBy('name');
        if ($ids = $this->allowedBranchIds()) {
            $query->whereIn('id', $ids);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn ($q) => $q->where('name', 'like', "%$s%")->orWhere('code', 'like', "%$s%"));
        }
        return response()->json($query->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:30', 'unique:branches,code'],
            'name' => ['required', 'string', 'max:150'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'max:10'],
            'gstin' => ['nullable', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:150'],
            'status' => ['nullable', 'in:ACTIVE,INACTIVE'],
        ]);

        $branch = Branch::create($data);
        $this->audit->log('CREATE', 'Branch', $branch->id, null, $branch->toArray());
        return response()->json($branch, 201);
    }

    public function show(Branch $branch)
    {
        return response()->json($branch);
    }

    public function update(Request $request, Branch $branch)
    {
        $data = $request->validate([
            'code' => ['sometimes', 'string', 'max:30', 'unique:branches,code,'.$branch->id],
            'name' => ['sometimes', 'string', 'max:150'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'max:10'],
            'gstin' => ['nullable', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:150'],
            'status' => ['nullable', 'in:ACTIVE,INACTIVE'],
        ]);

        $old = $branch->toArray();
        $branch->update($data);
        $this->audit->log('UPDATE', 'Branch', $branch->id, $old, $branch->toArray());
        return response()->json($branch);
    }

    public function destroy(Branch $branch)
    {
        $this->audit->log('ARCHIVE', 'Branch', $branch->id, $branch->toArray(), ['status' => 'INACTIVE']);
        $branch->update(['status' => 'INACTIVE']);
        return response()->json(['message' => 'Branch archived']);
    }
}
