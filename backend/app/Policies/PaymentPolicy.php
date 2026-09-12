<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class PaymentPolicy
{
    public function recordPayment(User $actor): Response
    {
        return Response::allow();
    }

    public function recordRefund(User $actor): Response
    {
        return in_array($actor->role, [User::ROLE_OWNER, User::ROLE_ADMIN], true)
            ? Response::allow()
            : Response::deny('Only owners and admins can record refunds.');
    }
}
