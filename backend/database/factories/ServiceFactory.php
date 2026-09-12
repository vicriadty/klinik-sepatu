<?php

namespace Database\Factories;

use App\Models\Service;
use App\Models\ServiceCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Service>
 */
class ServiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'category_id' => ServiceCategory::factory(),
            'name' => ucfirst(fake()->unique()->words(3, true)),
            'description' => fake()->optional()->sentence(),
            'price' => fake()->randomElement([15000, 25000, 35000, 50000, 60000, 80000, 120000]),
            'estimated_duration_days' => fake()->optional()->numberBetween(1, 7),
            'active' => true,
        ];
    }
}
