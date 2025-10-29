<?php

namespace App\Domain\Diagnostics\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;

class DiagnosticsController extends Controller
{
    public function index()
    {
        $ini = static function (string $key): ?string {
            $v = ini_get($key);
            if ($v === false) {
                return null;
            }
            return (string) $v;
        };

        $sysTmp = sys_get_temp_dir();
        $iniUploadTmp = $ini('upload_tmp_dir') ?: null;
        $storageTmp = storage_path('app/tmp');

        $exists = static function (?string $path): bool {
            return $path !== null && $path !== '' && file_exists($path);
        };

        $writable = static function (?string $path): bool {
            return $path !== null && $path !== '' && is_writable($path);
        };

        $bytesToHuman = static function (?int $bytes): ?string {
            if ($bytes === null) return null;
            $units = ['B','KB','MB','GB','TB'];
            $i = 0;
            $val = (float) $bytes;
            while ($val >= 1024 && $i < count($units) - 1) {
                $val /= 1024;
                $i++;
            }
            return sprintf('%.2f %s', $val, $units[$i]);
        };

        $diskFree = @disk_free_space(storage_path());

        $limits = [
            'upload_max_filesize' => $ini('upload_max_filesize'),
            'post_max_size' => $ini('post_max_size'),
            'max_file_uploads' => $ini('max_file_uploads'),
            'file_uploads' => $ini('file_uploads'),
            'memory_limit' => $ini('memory_limit'),
            'max_execution_time' => $ini('max_execution_time'),
        ];

        $environment = [
            'app_url' => config('app.url'),
            'app_env' => config('app.env'),
            'app_debug' => config('app.debug'),
            'timezone' => config('app.timezone'),
            'locale' => config('app.locale'),
            'php_version' => phpversion(),
            'php_sapi' => php_sapi_name(),
            'php_ini' => php_ini_loaded_file() ?: null,
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? null,
            'os' => PHP_OS_FAMILY,
            'uname' => function_exists('php_uname') ? php_uname() : null,
        ];

        $sessions = [
            'driver' => config('session.driver'),
            'lifetime' => config('session.lifetime'),
            'same_site' => config('session.same_site'),
            'secure' => config('session.secure'),
            'http_only' => config('session.http_only'),
            'domain' => config('session.domain'),
            'path' => config('session.path'),
        ];

        $queue = [
            'default' => config('queue.default'),
        ];

        $cache = [
            'store' => config('cache.default') ?? config('cache.store') ?? null,
        ];

        $database = [
            'default' => config('database.default'),
            'driver' => config('database.connections.' . config('database.default') . '.driver'),
        ];

        $tempDirs = [
            [
                'label' => 'sys_get_temp_dir()',
                'path' => $sysTmp,
                'exists' => $exists($sysTmp),
                'writable' => $writable($sysTmp),
            ],
            [
                'label' => 'upload_tmp_dir (php.ini)',
                'path' => $iniUploadTmp,
                'exists' => $exists($iniUploadTmp),
                'writable' => $writable($iniUploadTmp),
            ],
            [
                'label' => 'storage/app/tmp',
                'path' => $storageTmp,
                'exists' => $exists($storageTmp),
                'writable' => $writable($storageTmp),
            ],
        ];

        $storageInfo = [
            'path' => storage_path(),
            'writable' => is_writable(storage_path()),
            'free_bytes' => $diskFree !== false ? (int) $diskFree : null,
            'free_human' => $diskFree !== false ? $bytesToHuman((int) $diskFree) : null,
        ];

        $extensions = get_loaded_extensions();
        sort($extensions);

        $services = [
            [ 'label' => 'Dashboard', 'href' => '/admin/dashboard' ],
            [ 'label' => 'Usuários', 'href' => '/admin/usuarios' ],
            [ 'label' => 'Diagnóstico', 'href' => '/admin/diagnostico' ],
        ];

        return Inertia::render('Admin/Diagnostics', [
            'environment' => $environment,
            'limits' => $limits,
            'tempDirs' => $tempDirs,
            'storage' => $storageInfo,
            'sessions' => $sessions,
            'queue' => $queue,
            'cache' => $cache,
            'database' => $database,
            'extensions' => [
                'count' => count($extensions),
                'list' => array_values($extensions),
            ],
            'tips' => [
                'min_upload' => 'upload_max_filesize ≥ 10M e post_max_size ≥ soma dos arquivos (ex.: 48M).',
            ],
            'commands' => [
                'linux_setup_tmp' => 'mkdir -p storage/app/tmp && sudo chown -R $USER:www-data storage bootstrap/cache && sudo find storage bootstrap/cache -type d -exec chmod 775 {} + && sudo find storage bootstrap/cache -type f -exec chmod 664 {} +',
                'php_serve_override' => 'php -d file_uploads=On -d upload_max_filesize=12M -d post_max_size=48M -d max_file_uploads=50 -d upload_tmp_dir="$(pwd)/storage/app/tmp" artisan serve --host=0.0.0.0 --port=8000',
                'windows_setup_tmp' => 'mkdir storage\\app\\tmp',
            ],
            'services' => $services,
        ]);
    }
}

