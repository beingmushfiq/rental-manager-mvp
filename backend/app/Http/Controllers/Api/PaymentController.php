<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index()
    {
        return Payment::latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'rentalId' => 'nullable|exists:rentals,id',
            'saleId' => 'nullable|exists:sales,id',
            'amount' => 'required|numeric|min:0',
            'date' => 'required|date',
            'note' => 'nullable|string',
        ]);

        $payment = Payment::create([
            'rental_id' => $validated['rentalId'] ?? null,
            'sale_id' => $validated['saleId'] ?? null,
            'amount' => $validated['amount'],
            'date' => $validated['date'],
            'note' => $validated['note'] ?? null,
        ]);

        return response()->json($payment, 201);
    }

    public function show(Payment $payment)
    {
        return $payment;
    }
}
