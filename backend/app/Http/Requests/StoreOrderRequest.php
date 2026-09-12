<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOrderRequest extends FormRequest
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
        return [
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'discount_id' => [
                'nullable', 'integer',
                Rule::exists('discounts', 'id')->where('active', true),
            ],
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.brand' => ['required', 'string', 'max:100'],
            'items.*.model' => ['nullable', 'string', 'max:100'],
            'items.*.color' => ['nullable', 'string', 'max:50'],
            'items.*.shoe_type' => ['required', 'string', 'max:50'],
            'items.*.customer_note' => ['nullable', 'string', 'max:1000'],
            'items.*.internal_note' => ['nullable', 'string', 'max:1000'],
            'items.*.services' => ['required', 'array', 'min:1', function ($attribute, $value, $fail): void {
                if (count($value) !== count(array_unique($value))) {
                    $fail('Duplicate services are not allowed within one shoe.');
                }
            }],
            'items.*.services.*' => [
                'integer',
                Rule::exists('services', 'id')->where('active', true),
            ],
        ];
    }
}
