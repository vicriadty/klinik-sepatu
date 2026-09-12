<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class ServiceCategoryPolicy
{
    public function manage(User $actor): Response
    {
        return in_array($actor->role, [User::ROLE_OWNER, User::ROLE_ADMIN], true)
            ? Response::allow()
            : Response::deny('Only owners and admins can manage service categories.');
    }
}
