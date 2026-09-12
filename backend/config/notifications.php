<?php

return [

    /*
    |--------------------------------------------------------------------------
    | WhatsApp Cloud API (ADR-0006)
    |--------------------------------------------------------------------------
    |
    | Official Meta channel for customer notifications. Credentials come
    | from the environment only. Until the Meta Business verification
    | and the four message templates are approved, keep WHATSAPP_ENABLED
    | false: the domain keeps working, queues stay idle, and nothing is
    | sent. Template names below are placeholders until approval fixes
    | the real names and parameter layouts.
    |
    */

    'whatsapp' => [
        'enabled' => env('WHATSAPP_ENABLED', false),
        'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
        'access_token' => env('WHATSAPP_ACCESS_TOKEN'),
        'api_version' => env('WHATSAPP_API_VERSION', 'v21.0'),
        'timeout_seconds' => env('WHATSAPP_TIMEOUT', 15),
        'language' => env('WHATSAPP_TEMPLATE_LANGUAGE', 'id'),
        'templates' => [
            \App\Models\Notification::EVENT_ORDER_RECEIVED => env('WHATSAPP_TEMPLATE_RECEIPT', 'struk_order'),
            \App\Models\Notification::EVENT_PAYMENT_RECEIVED => env('WHATSAPP_TEMPLATE_PAYMENT', 'konfirmasi_payment'),
            \App\Models\Notification::EVENT_READY_FOR_PICKUP => env('WHATSAPP_TEMPLATE_READY', 'siap_diambil'),
            \App\Models\Notification::EVENT_COMPLETED => env('WHATSAPP_TEMPLATE_DONE', 'order_selesai'),
        ],
    ],

];
