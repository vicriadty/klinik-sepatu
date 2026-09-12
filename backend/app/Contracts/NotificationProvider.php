<?php

namespace App\Contracts;

/**
 * Customer notification channel (PRD backend §23).
 *
 * The domain only knows this contract; vendor SDKs and HTTP details
 * live in the implementations. PushProvider is a future implementor.
 */
interface NotificationProvider
{
    /**
     * Send a pre-approved template message.
     *
     * @param string $to Recipient phone in canonical 62… form.
     * @param string $template Approved template name.
     * @param list<string> $parameters Ordered template variables.
     * @return string Provider-side message id.
     *
     * @throws NotificationFailedException
     */
    public function send(string $to, string $template, array $parameters): string;
}
