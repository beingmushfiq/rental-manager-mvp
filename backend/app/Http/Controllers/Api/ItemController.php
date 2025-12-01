<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Item;
use Illuminate\Http\Request;

class ItemController extends Controller
{
    public function index()
    {
        return Item::latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'nullable|string',
            'description' => 'nullable|string',
            'daily_rent_price' => 'required|numeric|min:0',
            'selling_price' => 'nullable|numeric|min:0',
            'total_quantity' => 'required|integer|min:0',
            'photo_url' => 'nullable|string',
        ]);

        $item = Item::create($validated);
        return response()->json($item, 201);
    }

    public function show(Item $item)
    {
        return $item;
    }

    public function update(Request $request, Item $item)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'category' => 'nullable|string',
            'description' => 'nullable|string',
            'daily_rent_price' => 'sometimes|numeric|min:0',
            'selling_price' => 'nullable|numeric|min:0',
            'total_quantity' => 'sometimes|integer|min:0',
            'photo_url' => 'nullable|string',
        ]);

        $item->update($validated);
        return $item;
    }

    public function destroy(Item $item)
    {
        $item->delete();
        return response()->json(null, 204);
    }
}
