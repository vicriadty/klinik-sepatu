<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Orders are immutable after creation (ADR-0004): only order-level
     * notes may change. Corrections go through cancel + re-create.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'notes' => ['nullable', 'string', 'max:1000'],
            'customer_id' => ['sometimes', 'prohibited'],
            'discount_id' => ['sometimes', 'prohibited'],
            'items' => ['sometimes', 'prohibited'],
            'status' => ['sometimes', 'prohibited'],
        ];
    }
}
