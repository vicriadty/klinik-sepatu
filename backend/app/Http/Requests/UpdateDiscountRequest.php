<?php

namespace App\Http\Requests;

use App\Models\Discount;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDiscountRequest extends FormRequest
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
        // Percent cap applies to the effective type: incoming, else stored.
        $type = $this->input('type', $this->route('discount')?->type);

        $valueRules = ['sometimes', 'required', 'integer', 'min:1'];

        if ($type === Discount::TYPE_PERCENT) {
            $valueRules[] = 'max:100';
        }

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'type' => ['sometimes', 'required', Rule::in(Discount::TYPES)],
            'value' => $valueRules,
            'active' => ['sometimes', 'boolean'],
            'min_order_subtotal' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
