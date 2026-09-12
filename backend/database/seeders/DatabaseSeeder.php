<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Discount;
use App\Models\Order;
use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\User;
use App\Services\OrderService;
use App\Services\OrderStatusService;
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
        // Master catalog is safe and required in every environment.
        $this->seedCatalog();

        // Demo credentials and sample transactions only ever in local dev.
        // Production gets its first owner via `php artisan make:user`.
        if (app()->isLocal()) {
            $this->seedDemoStaff();
            Customer::factory()->count(5)->create();
            $this->seedDemoOrders();
        }
    }

    private function seedDemoStaff(): void
    {
        // Development seed accounts only (password: "password").
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
    }

    private function seedCatalog(): void
    {
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

    private function seedDemoOrders(): void
    {
        $orders = app(OrderService::class);
        $statuses = app(OrderStatusService::class);
        $customers = Customer::query()->take(3)->get();
        $serviceIds = Service::query()->orderBy('id')->take(3)->pluck('id')->all();
        $discount = Discount::query()->first();

        if ($customers->count() < 3 || count($serviceIds) < 3 || ! $discount) {
            return;
        }

        $payload = fn (int $customerIndex, array $shoes) => [
            'customer_id' => $customers[$customerIndex]->id,
            'discount_id' => $discount->id,
            'items' => array_map(fn (string $brand) => [
                'brand' => $brand,
                'model' => 'Demo',
                'shoe_type' => 'Sneakers',
                'services' => [$serviceIds[0], $serviceIds[1]],
            ], $shoes),
        ];

        [$o1] = $orders->create($payload(0, ['Nike']));
        [$o2] = $orders->create($payload(1, ['Adidas', 'Puma']));
        [$o3] = $orders->create($payload(2, ['Vans']));

        $statuses->transition($o2, Order::STATUS_ON_PROCESS);
        $statuses->transition($o3, Order::STATUS_ON_PROCESS);
        $statuses->transition($o3->refresh(), Order::STATUS_READY_FOR_PICKUP);
    }
}
