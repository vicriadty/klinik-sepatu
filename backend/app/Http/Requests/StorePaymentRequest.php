<?php

namespace App\Http\Requests;

use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
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
            'type' => ['sometimes', Rule::in(Payment::TYPES)],
            'method' => ['required', Rule::in(Payment::METHODS)],
            'amount' => ['required', 'integer', 'min:1'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
