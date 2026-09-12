<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class DiscountPolicy
{
    public function manage(User $actor): Response
    {
        return $actor->role === User::ROLE_OWNER
            ? Response::allow()
            : Response::deny('Only owners can manage discounts.');
    }
}
