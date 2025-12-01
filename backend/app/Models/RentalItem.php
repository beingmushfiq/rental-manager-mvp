<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Rental;
use App\Models\Item;

class RentalItem extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'returned' => 'boolean',
        'returned_date' => 'datetime',
    ];

    public function rental()
    {
        return $this->belongsTo(Rental::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
