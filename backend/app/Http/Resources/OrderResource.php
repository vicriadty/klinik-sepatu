<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'customer_id' => $this->customer_id,
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'items_count' => $this->whenCounted('items'),
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'subtotal' => (int) $this->subtotal,
            'discount_id' => $this->discount_id,
            'discount' => new DiscountResource($this->whenLoaded('discount')),
            'discount_value' => (int) $this->discount_value,
            'grand_total' => (int) $this->grand_total,
            'paid_total' => (int) $this->paid_total,
            'remaining_balance' => (int) ($this->grand_total - $this->paid_total),
            'notes' => $this->notes,
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'status_histories' => $this->whenLoaded('statusHistories', fn () => $this->statusHistories->map(
                fn ($h) => [
                    'from_status' => $h->from_status,
                    'to_status' => $h->to_status,
                    'actor_user_id' => $h->actor_user_id,
                    'note' => $h->note,
                    'created_at' => $h->created_at?->toISOString(),
                ]
            )),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
