<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class OrderPolicy
{
    public function viewAny(User $actor): Response
    {
        return Response::allow();
    }

    public function view(User $actor, Order $order): Response
    {
        return Response::allow();
    }

    public function create(User $actor): Response
    {
        return Response::allow();
    }

    public function update(User $actor, Order $order): Response
    {
        return Response::allow();
    }

    public function transition(User $actor, Order $order, string $to): Response
    {
        if ($to === Order::STATUS_CANCELLED) {
            return $this->cancel($actor, $order);
        }

        return Response::allow();
    }

    public function cancel(User $actor, Order $order): Response
    {
        if ($order->paid_total > 0 && ! in_array($actor->role, [User::ROLE_OWNER, User::ROLE_ADMIN], true)) {
            return Response::deny('Only owners and admins can cancel paid orders.');
        }

        return Response::allow();
    }
}
