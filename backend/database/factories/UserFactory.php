<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'password' => static::$password ??= Hash::make('password'),
            'role' => 'USER',
        ];
    }

    public function admin(): static
    {
        return $this->state(fn (array $attrs) => ['role' => 'ADMIN']);
    }

    public function superadmin(): static
    {
        return $this->state(fn (array $attrs) => ['role' => 'SUPERADMIN']);
    }
}
