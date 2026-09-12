<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Discount;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Development seed accounts only (password: "password").
        // Provision real users (including the first production owner)
        // with `php artisan make:user`. See ADR-0003.
        User::factory()->create([
            'name' => 'Owner',
            'username' => 'owner',
            'role' => User::ROLE_OWNER,
        ]);

        User::factory()->create([
            'name' => 'Admin',
            'username' => 'admin',
            'role' => User::ROLE_ADMIN,
        ]);

        User::factory()->create([
            'name' => 'Kasir',
            'username' => 'kasir',
            'role' => User::ROLE_CASHIER,
        ]);

        Customer::factory()->count(5)->create();

        $cleaning = ServiceCategory::query()->create(['name' => 'Cleaning']);
        $repair = ServiceCategory::query()->create(['name' => 'Repair & Repaint']);
        $treatment = ServiceCategory::query()->create(['name' => 'Treatment']);

        $services = [
            [$cleaning->id, 'Fast Clean', 25000, 1],
            [$cleaning->id, 'Deep Clean', 35000, 2],
            [$treatment->id, 'Unyellowing', 60000, 3],
            [$treatment->id, 'Water Repellent', 45000, 2],
            [$repair->id, 'Repaint Upper', 120000, 5],
            [$repair->id, 'Sole Repair', 80000, 4],
        ];

        foreach ($services as [$categoryId, $name, $price, $days]) {
            Service::query()->create([
                'category_id' => $categoryId,
                'name' => $name,
                'price' => $price,
                'estimated_duration_days' => $days,
            ]);
        }

        Discount::query()->create([
            'name' => 'Grand Opening 10%',
            'type' => Discount::TYPE_PERCENT,
            'value' => 10,
        ]);

        Discount::query()->create([
            'name' => 'Member Rp15rb',
            'type' => Discount::TYPE_FIXED,
            'value' => 15000,
            'min_order_subtotal' => 100000,
        ]);
    }
}
