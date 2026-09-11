<?php

namespace App\Http\Resources;

use App\Support\PhoneNumber;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'phone_display' => PhoneNumber::display($this->phone),
            'email' => $this->email,
            'address' => $this->address,
            'notes' => $this->notes,
            'wa_opt_out' => (bool) $this->wa_opt_out,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
