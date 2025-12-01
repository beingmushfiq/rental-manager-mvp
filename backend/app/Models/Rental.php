<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Customer;
use App\Models\RentalItem;
use App\Models\Payment;

class Rental extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = [];

    protected $casts = [
        'rent_date' => 'datetime',
        'expected_return_date' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(RentalItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
