<?php

use App\Support\PhoneNumber;

it('normalizes Indonesian mobile numbers to canonical 62 form', function (string $input, ?string $expected): void {
    expect(PhoneNumber::normalize($input))->toBe($expected);
})->with([
    'leading zero' => ['081234567890', '6281234567890'],
    'with dashes and spaces' => ['0812-3456-7890', '6281234567890'],
    'with spaces' => ['0812 3456 7890', '6281234567890'],
    'plus 62' => ['+6281234567890', '6281234567890'],
    'plus 62 with separators' => ['+62 812-3456-7890', '6281234567890'],
    'already canonical' => ['6281234567890', '6281234567890'],
    'bare mobile without trunk' => ['8123456789', '628123456789'],
    'landline rejected' => ['0211234567', null],
    'landline with plus rejected' => ['+62211234567', null],
    'foreign number rejected' => ['+6581234567', null],
    'foreign digits rejected' => ['65812345678', null],
    'too short rejected' => ['0812', null],
    'garbage rejected' => ['budi-sepatu', null],
    'empty rejected' => ['', null],
    'blank rejected' => ['   ', null],
]);

it('formats canonical numbers for display', function (): void {
    expect(PhoneNumber::display('6281234567890'))->toBe('+6281234567890');
});
