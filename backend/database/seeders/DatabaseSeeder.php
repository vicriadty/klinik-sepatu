<?php

namespace Database\Seeders;

use App\Models\Customer;
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
    }
}
