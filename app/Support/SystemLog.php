<?php

namespace App\Support;

use App\Models\SiteSetting;
use Illuminate\Support\Facades\Log;

class SystemLog
{
    protected static ?bool $enabled = null;

    public static function enabled(): bool
    {
        if (self::$enabled !== null) {
            return self::$enabled;
        }
        try {
            $settings = SiteSetting::query()->first(['system_logs_enabled']);
            self::$enabled = (bool) ($settings?->system_logs_enabled ?? false);
        } catch (\Throwable $e) {
            self::$enabled = false;
        }
        return self::$enabled;
    }

    public static function info(string $event, array $context = []): void
    {
        if (!self::enabled()) return;
        Log::info($event, $context);
    }

    public static function debug(string $event, array $context = []): void
    {
        if (!self::enabled()) return;
        Log::debug($event, $context);
    }
}

