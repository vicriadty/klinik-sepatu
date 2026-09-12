<?php

namespace App\Http\Requests;

use App\Services\SettingsService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSettingsRequest extends FormRequest
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
            SettingsService::KEY_STORE_NAME => ['sometimes', 'required', 'string', 'max:255'],
            SettingsService::KEY_STORE_PHONE => ['sometimes', 'nullable', 'string', 'max:50'],
            SettingsService::KEY_STORE_ADDRESS => ['sometimes', 'nullable', 'string', 'max:500'],
            SettingsService::KEY_RECEIPT_FOOTER => ['sometimes', 'nullable', 'string', 'max:500'],
            SettingsService::KEY_TIMEZONE => ['sometimes', 'required', 'timezone:all'],
        ];
    }
}
