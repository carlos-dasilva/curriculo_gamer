<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;

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

// Lista plataformas da RAWG API usando a chave configurada em env('RAWG_API_KEY')
Artisan::command('rawg:platforms {--json} {--save=} {--page-size=40}', function () {
    $apiKey = env('RAWG_API_KEY', '6dd272e717a64ad591eb4ef2889b1572');
    if (!$apiKey) {
        $this->error('RAWG_API_KEY não configurada. Defina no .env.');
        return 1;
    }

    $page = 1;
    $pageSize = (int) $this->option('page-size') ?: 40;
    $all = [];

    try {
        do {
            $resp = Http::timeout(20)->get('https://api.rawg.io/api/platforms', [
                'key' => $apiKey,
                'page' => $page,
                'page_size' => $pageSize,
            ]);

            if (!$resp->ok()) {
                $this->error('RAWG request failed: HTTP '.$resp->status());
                return 1;
            }

            $json = $resp->json();
            foreach ((array) ($json['results'] ?? []) as $p) {
                $all[] = [
                    'id' => $p['id'] ?? null,
                    'name' => $p['name'] ?? null,
                    'slug' => $p['slug'] ?? null,
                ];
            }

            $page = !empty($json['next']) ? ($page + 1) : null;
        } while ($page);
    } catch (\Throwable $e) {
        $this->error('Erro ao consultar RAWG: '.$e->getMessage());
        return 1;
    }

    // Ordena por nome para facilitar leitura
    usort($all, fn($a, $b) => strcmp((string) $a['name'], (string) $b['name']));

    // Salvar em arquivo se solicitado
    $savePath = $this->option('save');
    if ($savePath !== null) {
        if ($savePath === '') {
            $savePath = storage_path('app/rawg_platforms.json');
        }
        try {
            file_put_contents($savePath, json_encode($all, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
            $this->info('Arquivo salvo em: '.$savePath);
        } catch (\Throwable $e) {
            $this->error('Falha ao salvar arquivo: '.$e->getMessage());
            return 1;
        }
    }

    // Saída no terminal
    if ($this->option('json')) {
        $this->line(json_encode($all, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    } else {
        foreach ($all as $p) {
            $this->line(($p['id'] ?? '?').' - '.($p['name'] ?? '?'));
        }
    }

    return 0;
})->purpose('Lista plataformas da RAWG com id, nome e slug');
