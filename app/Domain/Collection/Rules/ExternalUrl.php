<?php

namespace App\Domain\Collection\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class ExternalUrl implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || ! filter_var($value, FILTER_VALIDATE_URL)) {
            $fail('Informe uma URL pública HTTP ou HTTPS válida.');

            return;
        }
        $parts = parse_url($value);
        $host = strtolower($parts['host'] ?? '');
        if (! in_array(strtolower($parts['scheme'] ?? ''), ['http', 'https'], true)
            || isset($parts['user']) || isset($parts['pass'])
            || $host === 'localhost' || str_ends_with($host, '.localhost') || str_ends_with($host, '.local')
            || (! str_contains($host, '.') && ! str_contains($host, ':'))
            || (filter_var(trim($host, '[]'), FILTER_VALIDATE_IP)
                && ! filter_var(trim($host, '[]'), FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE))) {
            $fail('Use uma URL pública HTTP ou HTTPS, sem credenciais.');
        }
    }
}
