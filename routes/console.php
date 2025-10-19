<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Purge non-default log files from storage/logs
Artisan::command('app:logs:purge-custom', function () {
    $logDir = storage_path('logs');
    if (!is_dir($logDir)) {
        $this->info('Logs directory not found.');
        return; 
    }
    $deleted = 0;
    foreach (File::files($logDir) as $file) {
        $name = $file->getFilename();
        if ($name === 'laravel.log' || str_starts_with($name, 'laravel-')) {
            continue; // keep Laravel defaults
        }
        File::delete($file->getPathname());
        $deleted++;
    }
    $this->info("Deleted {$deleted} custom log file(s).");
})->purpose('Purge non-default log files in storage/logs');
