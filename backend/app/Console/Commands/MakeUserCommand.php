<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

use function Laravel\Prompts\password;

class MakeUserCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'make:user
        {name : Full name}
        {username : Unique login identifier (lowercased)}
        {role=admin : Role (owner, admin, cashier)}
        {--email= : Optional contact email}
        {--password= : Set password non-interactively (dev/CI only)}
        {--inactive : Create the account deactivated}';

    /**
     * @var string
     */
    protected $description = 'Provision a user account (used for the first owner and real staff)';

    public function handle(): int
    {
        $data = [
            'name' => $this->argument('name'),
            'username' => strtolower((string) $this->argument('username')),
            'role' => strtolower((string) $this->argument('role')),
            'email' => $this->option('email'),
        ];

        $validator = Validator::make($data, [
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'min:3', 'max:50', 'alpha_dash', 'unique:users,username'],
            'role' => ['required', Rule::in(User::ROLES)],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $plainPassword = (string) ($this->option('password') ?? password('Password') ?: '');

        if ($plainPassword === '') {
            $this->error('Password is required.');

            return self::FAILURE;
        }

        $user = User::query()->create([
            'name' => $data['name'],
            'username' => $data['username'],
            'email' => $data['email'],
            'password' => Hash::make($plainPassword),
            'role' => $data['role'],
            'is_active' => ! (bool) $this->option('inactive'),
        ]);

        $this->info("User {$user->username} ({$user->role}) created with id {$user->getKey()}.");

        return self::SUCCESS;
    }
}
