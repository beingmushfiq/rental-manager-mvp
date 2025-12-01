<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rental;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RentalController extends Controller
{
    public function index()
    {
        return Rental::with(['items', 'customer'])->latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customerId' => 'required|exists:customers,id',
            'customerName' => 'required|string',
            'rentDate' => 'required|date',
            'expectedReturnDate' => 'required|date',
            'items' => 'required|array',
            'items.*.itemId' => 'required|exists:items,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        return DB::transaction(function () use ($validated) {
            $rental = Rental::create([
                'customer_id' => $validated['customerId'],
                'customer_name' => $validated['customerName'],
                'rent_date' => $validated['rentDate'],
                'expected_return_date' => $validated['expectedReturnDate'],
                'total_amount' => 0,
                'status' => 'Active',
            ]);

            $totalAmount = 0;
            $duration = max(1, now()->parse($validated['rentDate'])->diffInDays($validated['expectedReturnDate']));

            foreach ($validated['items'] as $itemData) {
                $item = Item::find($itemData['itemId']);
                $lineTotal = $item->daily_rent_price * $itemData['quantity'] * $duration;
                $totalAmount += $lineTotal;

                $rental->items()->create([
                    'item_id' => $item->id,
                    'item_name' => $item->name,
                    'quantity' => $itemData['quantity'],
                    'daily_rent_price' => $item->daily_rent_price,
                ]);
            }

            $rental->update(['total_amount' => $totalAmount]);
            return $rental->load('items');
        });
    }

    public function show(Rental $rental)
    {
        return $rental->load(['items', 'customer', 'payments']);
    }

    public function update(Request $request, Rental $rental)
    {
        // Implement update logic if needed
        return $rental;
    }

    public function destroy(Rental $rental)
    {
        $rental->delete();
        return response()->json(null, 204);
    }

    public function returnItems(Request $request, Rental $rental)
    {
        $validated = $request->validate([
            'itemIds' => 'required|array',
            'itemIds.*' => 'exists:rental_items,item_id'
        ]);

        $rental->items()
            ->whereIn('item_id', $validated['itemIds'])
            ->update(['returned' => true, 'returned_date' => now()]);

        // Check if all items returned
        if ($rental->items()->where('returned', false)->count() === 0) {
            $rental->update(['status' => 'Returned']);
        } else {
            $rental->update(['status' => 'Partial Return']);
        }

        return $rental->load('items');
    }
}
