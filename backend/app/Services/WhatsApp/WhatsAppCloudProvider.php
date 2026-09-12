<?php

namespace App\Services\WhatsApp;

use App\Contracts\NotificationFailedException;
use App\Contracts\NotificationProvider;
use Illuminate\Support\Facades\Http;

class WhatsAppCloudProvider implements NotificationProvider
{
    public function __construct(
        private string $phoneNumberId,
        private string $accessToken,
        private string $apiVersion,
        private int $timeoutSeconds,
        private string $language,
    ) {
    }

    public static function fromConfig(): self
    {
        $config = config('notifications.whatsapp');

        return new self(
            (string) $config['phone_number_id'],
            (string) $config['access_token'],
            (string) $config['api_version'],
            (int) $config['timeout_seconds'],
            (string) $config['language'],
        );
    }

    public function send(string $to, string $template, array $parameters): string
    {
        $response = Http::timeout($this->timeoutSeconds)
            ->withToken($this->accessToken)
            ->post("https://graph.facebook.com/{$this->apiVersion}/{$this->phoneNumberId}/messages", [
                'messaging_product' => 'whatsapp',
                'to' => $to,
                'type' => 'template',
                'template' => [
                    'name' => $template,
                    'language' => ['code' => $this->language],
                    'components' => [
                        [
                            'type' => 'body',
                            'parameters' => array_map(
                                fn ($value) => ['type' => 'text', 'text' => (string) $value],
                                array_values($parameters)
                            ),
                        ],
                    ],
                ],
            ]);

        if (! $response->successful()) {
            throw new NotificationFailedException(
                'WhatsApp API error HTTP '.$response->status().': '.substr((string) $response->body(), 0, 300)
            );
        }

        $messageId = $response->json('messages.0.id');

        if (! $messageId) {
            throw new NotificationFailedException('WhatsApp API returned no message id.');
        }

        return $messageId;
    }
}
