<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'type' => $this->type,
            'method' => $this->method,
            'amount' => (int) $this->amount,
            'note' => $this->note,
            'received_by_user_id' => $this->received_by_user_id,
            'receiver' => $this->whenLoaded('receiver', fn () => [
                'id' => $this->receiver->id,
                'name' => $this->receiver->name,
                'username' => $this->receiver->username,
            ]),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
