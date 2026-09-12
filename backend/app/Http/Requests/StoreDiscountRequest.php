<?php

namespace App\Http\Requests;

use App\Models\Discount;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDiscountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        $valueRules = ['required', 'integer', 'min:1'];

        if ($this->input('type') === Discount::TYPE_PERCENT) {
            $valueRules[] = 'max:100';
        }

        return [
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', Rule::in(Discount::TYPES)],
            'value' => $valueRules,
            'active' => ['sometimes', 'boolean'],
            'min_order_subtotal' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
