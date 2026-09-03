<?php

namespace App\Http\Controllers;

use App\Models\StandardItem;
use Illuminate\Http\Request;

class StandardItemController extends Controller
{
    /**
     * Search standard items for live autocomplete.
     */
    public function search(Request $request)
    {
        $query = trim($request->input('q', ''));
        
        $itemsQuery = StandardItem::query();

        if ($query !== '') {
            $itemsQuery->where('name', 'like', "%{$query}%")
                       ->orWhere('category', 'like', "%{$query}%");
        }

        $items = $itemsQuery->orderBy('usage_count', 'desc')
                            ->orderBy('name', 'asc')
                            ->limit(30)
                            ->get(['id', 'name', 'unit', 'standard_price', 'category']);

        return response()->json([
            'success' => true,
            'items' => $items,
        ]);
    }

    /**
     * Get paginated standard items for management.
     */
    public function index(Request $request)
    {
        $query = trim($request->input('search', ''));
        $category = trim($request->input('category', ''));

        $itemsQuery = StandardItem::query();

        if ($query !== '') {
            $itemsQuery->where('name', 'like', "%{$query}%");
        }

        if ($category !== '') {
            $itemsQuery->where('category', $category);
        }

        $items = $itemsQuery->orderBy('name', 'asc')
                            ->paginate(50);

        $categories = StandardItem::distinct()->whereNotNull('category')->pluck('category');

        return response()->json([
            'success' => true,
            'items' => $items,
            'categories' => $categories,
        ]);
    }

    /**
     * Store a new standard item in catalog.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'standard_price' => 'required|numeric|min:0',
            'category' => 'nullable|string|max:100',
        ]);

        $item = StandardItem::updateOrCreate(
            ['name' => trim($validated['name'])],
            [
                'unit' => trim($validated['unit']),
                'standard_price' => $validated['standard_price'],
                'category' => $validated['category'] ? trim($validated['category']) : 'วัสดุทั่วไป',
                'usage_count' => \DB::raw('usage_count + 1'),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'บันทึกข้อมูลรายการวัสดุมาตรฐานเรียบร้อยแล้ว',
            'item' => $item,
        ]);
    }

    /**
     * Update standard item.
     */
    public function update(Request $request, StandardItem $standardItem)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'unit' => 'required|string|max:50',
            'standard_price' => 'required|numeric|min:0',
            'category' => 'nullable|string|max:100',
        ]);

        $standardItem->update([
            'name' => trim($validated['name']),
            'unit' => trim($validated['unit']),
            'standard_price' => $validated['standard_price'],
            'category' => $validated['category'] ? trim($validated['category']) : 'วัสดุทั่วไป',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'อัปเดตข้อมูลรายการวัสดุเรียบร้อยแล้ว',
            'item' => $standardItem,
        ]);
    }

    /**
     * Remove standard item.
     */
    public function destroy(StandardItem $standardItem)
    {
        $standardItem->delete();

        return response()->json([
            'success' => true,
            'message' => 'ลบรายการวัสดุเรียบร้อยแล้ว',
        ]);
    }
}
