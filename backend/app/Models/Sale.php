<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory; // Added for HasFactory trait
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Customer;

class Sale extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = [];

    protected $casts = [
        'date' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }
}
