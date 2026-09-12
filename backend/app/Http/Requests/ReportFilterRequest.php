<?php

namespace App\Http\Requests;

use App\Models\Order;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReportFilterRequest extends FormRequest
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
            'start_date' => ['sometimes', 'date_format:Y-m-d'],
            'end_date' => ['sometimes', 'date_format:Y-m-d', 'after_or_equal:start_date'],
            'status' => ['sometimes', Rule::in(Order::STATUSES)],
            'payment_status' => ['sometimes', Rule::in([Order::PAYMENT_UNPAID, Order::PAYMENT_PARTIAL, Order::PAYMENT_PAID])],
            'payment_method' => ['sometimes', Rule::in(\App\Models\Payment::METHODS)],
            'service_id' => ['sometimes', 'integer', 'exists:services,id'],
            'search' => ['sometimes', 'string', 'max:100'],
        ];
    }
}
