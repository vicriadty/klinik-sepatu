<?php

namespace App\Support;

/**
 * Indonesian customer phone normalization (ADR-0008).
 *
 * Canonical storage: digits only, `62` country prefix, no `+`
 * (e.g. 0812-3456-7890 -> 6281234567890).
 *
 * Only mobile numbers are accepted (must start with 628 after
 * normalization); landlines and foreign numbers return null.
 */
class PhoneNumber
{
    public static function normalize(string $input): ?string
    {
        $input = trim($input);

        if ($input === '') {
            return null;
        }

        if (str_starts_with($input, '+') && ! str_starts_with($input, '+62')) {
            return null;
        }

        $digits = (string) preg_replace('/\D/', '', $input);

        if (str_starts_with($digits, '0')) {
            $digits = '62'.substr($digits, 1);
        } elseif (str_starts_with($digits, '8')) {
            $digits = '62'.$digits;
        }

        if (! preg_match('/^628\d{7,12}$/', $digits)) {
            return null;
        }

        return $digits;
    }

    public static function display(string $canonical): string
    {
        return '+'.$canonical;
    }
}
