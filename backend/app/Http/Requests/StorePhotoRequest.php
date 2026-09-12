<?php

namespace App\Http\Requests;

use App\Models\OrderItemPhoto;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePhotoRequest extends FormRequest
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
            'photo' => ['required', 'file', 'mimes:jpeg,png,webp', 'max:5120'],
            'type' => ['required', Rule::in(OrderItemPhoto::TYPES)],
        ];
    }
}
