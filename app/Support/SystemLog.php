<?php

namespace App\Support;

use App\Models\SiteSetting;
use Monolog\Logger as MonologLogger;
use Monolog\Handler\StreamHandler;

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

    protected static function logger(): ?MonologLogger
    {
        if (!self::enabled()) return null;
        $path = storage_path('logs/log-'. now()->format('Ymd') .'.log');
        $dir = dirname($path);
        if (!is_dir($dir)) { @mkdir($dir, 0775, true); }
        $logger = new MonologLogger('system');
        $logger->pushHandler(new StreamHandler($path, MonologLogger::INFO));
        return $logger;
    }

    public static function info(string $event, array $context = []): void
    {
        $logger = self::logger();
        if (!$logger) return;
        $logger->info($event, $context);
    }

    public static function debug(string $event, array $context = []): void
    {
        $logger = self::logger();
        if (!$logger) return;
        $logger->info($event, array_merge(['level' => 'debug'], $context));
    }
}
