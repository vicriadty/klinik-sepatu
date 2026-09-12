<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    public function viewAny(User $actor): Response
    {
        return $this->isStaffManager($actor)
            ? Response::allow()
            : Response::deny('Only owners and admins can manage users.');
    }

    public function viewFinancials(User $actor): Response
    {
        return $this->isStaffManager($actor)
            ? Response::allow()
            : Response::deny('Only owners and admins can view financial figures.');
    }

    public function view(User $actor, User $target): Response
    {
        return $this->viewAny($actor);
    }

    public function create(User $actor, string $role): Response
    {
        if (! $this->isStaffManager($actor)) {
            return Response::deny('Only owners and admins can manage users.');
        }

        if ($role === User::ROLE_OWNER && ! $this->isOwner($actor)) {
            return Response::deny('Only owners can manage owner accounts.');
        }

        return Response::allow();
    }

    public function update(User $actor, User $target, ?string $newRole = null): Response
    {
        if (! $this->isStaffManager($actor)) {
            return Response::deny('Only owners and admins can manage users.');
        }

        if ($this->isOwner($target) && ! $this->isOwner($actor)) {
            return Response::deny('Only owners can manage owner accounts.');
        }

        if ($newRole === User::ROLE_OWNER && ! $this->isOwner($actor)) {
            return Response::deny('Only owners can grant the owner role.');
        }

        if ($newRole !== null && $newRole !== User::ROLE_OWNER && $this->isLastActiveOwner($target)) {
            return Response::deny('Cannot demote the last active owner.');
        }

        return Response::allow();
    }

    public function updateStatus(User $actor, User $target, bool $active): Response
    {
        if (! $this->isStaffManager($actor)) {
            return Response::deny('Only owners and admins can manage users.');
        }

        if ($this->isOwner($target) && ! $this->isOwner($actor)) {
            return Response::deny('Only owners can manage owner accounts.');
        }

        if ($target->is($actor)) {
            return Response::deny('You cannot change your own status.');
        }

        if (! $active && $this->isLastActiveOwner($target)) {
            return Response::deny('Cannot deactivate the last active owner.');
        }

        return Response::allow();
    }

    public function delete(User $actor, User $target): Response
    {
        if (! $this->isStaffManager($actor)) {
            return Response::deny('Only owners and admins can manage users.');
        }

        if (! $this->isOwner($actor) && $target->role !== User::ROLE_CASHIER) {
            return Response::deny('Admins can only delete cashier accounts.');
        }

        if ($target->is($actor)) {
            return Response::deny('You cannot delete your own account.');
        }

        if ($this->isLastActiveOwner($target)) {
            return Response::deny('Cannot delete the last active owner.');
        }

        return Response::allow();
    }

    private function isOwner(User $user): bool
    {
        return $user->role === User::ROLE_OWNER;
    }

    private function isStaffManager(User $user): bool
    {
        return in_array($user->role, [User::ROLE_OWNER, User::ROLE_ADMIN], true);
    }

    private function isLastActiveOwner(User $target): bool
    {
        return $target->role === User::ROLE_OWNER
            && $target->is_active
            && User::query()->where('role', User::ROLE_OWNER)->where('is_active', true)->count() <= 1;
    }
}
