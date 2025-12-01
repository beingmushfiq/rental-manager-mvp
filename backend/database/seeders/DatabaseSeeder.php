<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;
use App\Models\Item;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed Customers
        Customer::create([
            'id' => Str::uuid(),
            'name' => 'John Doe',
            'phone' => '01700000000',
            'address' => 'Dhaka, Bangladesh'
        ]);

        Customer::create([
            'id' => Str::uuid(),
            'name' => 'Event Pro Ltd',
            'phone' => '01800000000',
            'address' => 'Chittagong'
        ]);

        // Seed Inventory Items
        Item::create([
            'id' => Str::uuid(),
            'name' => 'LED Par Light',
            'daily_rent_price' => 500,
            'selling_price' => 2500,
            'total_quantity' => 20,
            'category' => 'Lights'
        ]);

        Item::create([
            'id' => Str::uuid(),
            'name' => 'Wireless Mic',
            'daily_rent_price' => 1000,
            'selling_price' => 15000,
            'total_quantity' => 5,
            'category' => 'Audio'
        ]);

        Item::create([
            'id' => Str::uuid(),
            'name' => 'Projector 4K',
            'daily_rent_price' => 5000,
            'selling_price' => 80000,
            'total_quantity' => 2,
            'category' => 'Visual'
        ]);
    }
}
