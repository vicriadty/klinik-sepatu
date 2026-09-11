<?php

namespace App\Http\Requests;

use App\Support\PhoneNumber;
use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->filled('phone')) {
            $normalized = PhoneNumber::normalize((string) $this->input('phone'));

            if ($normalized !== null) {
                $this->merge(['phone' => $normalized]);
            }
        }
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            // Canonical 62… mobile format; un-normalizable input fails here.
            // Uniqueness is checked in the controller to return 409 + record.
            'phone' => ['required', 'string', 'regex:/^628\d{7,12}$/'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'wa_opt_out' => ['sometimes', 'boolean'],
        ];
    }
}
