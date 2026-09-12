<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'brand' => $this->brand,
            'model' => $this->model,
            'color' => $this->color,
            'shoe_type' => $this->shoe_type,
            'customer_note' => $this->customer_note,
            'internal_note' => $this->internal_note,
            'photos' => PhotoResource::collection($this->whenLoaded('photos')),
            'services' => $this->whenLoaded('itemServices', fn () => $this->itemServices->map(
                fn ($row) => [
                    'service_id' => $row->service_id,
                    'service_name' => $row->service_name,
                    'unit_price' => (int) $row->unit_price,
                ]
            )),
            'item_subtotal' => $this->whenLoaded('itemServices', fn () => (int) $this->itemServices->sum('unit_price')),
        ];
    }
}
