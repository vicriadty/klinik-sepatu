<?php

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'phone' => '628'.fake()->unique()->numerify('##########'),
            'email' => fake()->optional()->safeEmail(),
            'address' => fake()->optional()->address(),
            'notes' => fake()->optional()->sentence(),
            'wa_opt_out' => false,
        ];
    }
}
