<?php

namespace App\Http\Controllers;

use App\Models\Vendor;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    /**
     * Display a listing of vendors.
     */
    public function index()
    {
        return response()->json(Vendor::orderBy('name')->get());
    }

    /**
     * Store a newly created vendor.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'tax_id' => 'nullable|string|max:20',
            'bank_name' => 'nullable|string|max:255',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_account_name' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'contact_person' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
        ]);

        $vendor = Vendor::create($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'เพิ่มข้อมูลร้านค้าเรียบร้อยแล้ว',
                'vendor' => $vendor
            ]);
        }

        return redirect()->back()->with('message', 'เพิ่มข้อมูลร้านค้า "' . $vendor->name . '" เรียบร้อยแล้ว');
    }

    /**
     * Update the specified vendor.
     */
    public function update(Request $request, Vendor $vendor)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'tax_id' => 'nullable|string|max:20',
            'bank_name' => 'nullable|string|max:255',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_account_name' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:50',
            'contact_person' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:255',
        ]);

        $vendor->update($validated);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'บันทึกการแก้ไขร้านค้าเรียบร้อยแล้ว',
                'vendor' => $vendor
            ]);
        }

        return redirect()->back()->with('message', 'บันทึกการแก้ไขร้านค้าเรียบร้อยแล้ว');
    }

    /**
     * Remove the specified vendor.
     */
    public function destroy(Vendor $vendor)
    {
        $name = $vendor->name;
        $vendor->delete();

        return redirect()->back()->with('message', 'ลบข้อมูลร้านค้า "' . $name . '" เรียบร้อยแล้ว');
    }
}
