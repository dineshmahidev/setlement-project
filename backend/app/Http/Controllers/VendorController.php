<?php

namespace App\Http\Controllers;

use App\Models\Vendor;
use App\Services\AuditService;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(Request $request)
    {
        $query = Vendor::with('defaultBranch')->orderBy('name');
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn ($q) => $q->where('name', 'like', "%$s%")->orWhere('code', 'like', "%$s%"));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->boolean('all')) {
            return response()->json($query->get());
        }
        return response()->json($query->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:30', 'unique:vendors,code'],
            'name' => ['required', 'string', 'max:200'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'max:10'],
            'gst_number' => ['nullable', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:150'],
            'pan' => ['nullable', 'string', 'max:15'],
            'po_number' => ['nullable', 'string', 'max:50'],
            'default_branch_id' => ['nullable', 'exists:branches,id'],
            'status' => ['nullable', 'in:ACTIVE,INACTIVE'],
        ]);

        $vendor = Vendor::create($data);
        $this->audit->log('CREATE', 'Vendor', $vendor->id, null, $vendor->toArray());
        return response()->json($vendor, 201);
    }

    public function show(Vendor $vendor)
    {
        return response()->json($vendor->load('defaultBranch', 'contacts'));
    }

    public function update(Request $request, Vendor $vendor)
    {
        $data = $request->validate([
            'code' => ['sometimes', 'string', 'max:30', 'unique:vendors,code,'.$vendor->id],
            'name' => ['sometimes', 'string', 'max:200'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'district' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'pincode' => ['nullable', 'string', 'max:10'],
            'gst_number' => ['nullable', 'string', 'max:20'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:150'],
            'pan' => ['nullable', 'string', 'max:15'],
            'po_number' => ['nullable', 'string', 'max:50'],
            'default_branch_id' => ['nullable', 'exists:branches,id'],
            'status' => ['nullable', 'in:ACTIVE,INACTIVE'],
        ]);

        $old = $vendor->toArray();
        $vendor->update($data);
        $this->audit->log('UPDATE', 'Vendor', $vendor->id, $old, $vendor->toArray());
        return response()->json($vendor);
    }

    public function destroy(Vendor $vendor)
    {
        $this->audit->log('ARCHIVE', 'Vendor', $vendor->id, $vendor->toArray(), ['status' => 'INACTIVE']);
        $vendor->update(['status' => 'INACTIVE']);
        return response()->json(['message' => 'Vendor archived']);
    }
}
