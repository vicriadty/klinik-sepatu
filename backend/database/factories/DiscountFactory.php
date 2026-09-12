<?php

namespace Database\Factories;

use App\Models\Discount;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Discount>
 */
class DiscountFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = fake()->randomElement(Discount::TYPES);

        return [
            'name' => ucfirst(fake()->unique()->words(3, true)),
            'type' => $type,
            'value' => $type === Discount::TYPE_PERCENT
                ? fake()->numberBetween(5, 25)
                : fake()->randomElement([5000, 10000, 15000, 25000]),
            'active' => true,
            'min_order_subtotal' => fake()->optional()->randomElement([50000, 100000]),
        ];
    }
}
