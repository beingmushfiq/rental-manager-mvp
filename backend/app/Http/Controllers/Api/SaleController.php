<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SaleController extends Controller
{
    public function index()
    {
        return Sale::with(['items', 'customer'])->latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customerId' => 'nullable|exists:customers,id',
            'customerName' => 'required|string',
            'date' => 'required|date',
            'items' => 'required|array',
            'items.*.itemId' => 'required|exists:items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
        ]);

        return DB::transaction(function () use ($validated) {
            $totalAmount = 0;
            foreach ($validated['items'] as $itemData) {
                $totalAmount += $itemData['price'] * $itemData['quantity'];
            }

            $sale = Sale::create([
                'customer_id' => $validated['customerId'] ?? null,
                'customer_name' => $validated['customerName'],
                'date' => $validated['date'],
                'total_amount' => $totalAmount,
            ]);

            foreach ($validated['items'] as $itemData) {
                $item = Item::find($itemData['itemId']);
                
                // Deduct Stock
                if ($item->total_quantity < $itemData['quantity']) {
                    throw new \Exception("Insufficient stock for {$item->name}");
                }
                $item->decrement('total_quantity', $itemData['quantity']);

                $sale->items()->create([
                    'item_id' => $item->id,
                    'item_name' => $item->name,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['price'],
                    'total' => $itemData['price'] * $itemData['quantity'],
                ]);
            }

            return $sale->load('items');
        });
    }

    public function show(Sale $sale)
    {
        return $sale->load(['items', 'customer']);
    }
}
