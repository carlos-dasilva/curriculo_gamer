<?php

namespace App\Domain\Platforms\Jobs;

use App\Domain\Games\Jobs\ImportGameByRawgId;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Support\SystemLog;

class ImportPlatformGamesFromRawg implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $platformId;
    public int $rawgPlatformId;

    public function __construct(int $platformId, int $rawgPlatformId)
    {
        $this->platformId = $platformId;
        $this->rawgPlatformId = $rawgPlatformId;
    }

    public function handle(): void
    {
        SystemLog::info('RAWG.platform.import.start', [
            'platform_id' => $this->platformId,
            'rawg_platform_id' => $this->rawgPlatformId,
        ]);
        $apiKey = env('RAWG_API_KEY', '6dd272e717a64ad591eb4ef2889b1572');
        $base = 'https://api.rawg.io/api/games';

        $page = 1;
        $pageSize = 40;
        $allIds = [];
        $iterations = 0;

        do {
            $iterations++;
            $resp = Http::timeout(8)->get($base, [
                'key' => $apiKey,
                'platforms' => $this->rawgPlatformId,
                'page' => $page,
                'page_size' => $pageSize,
            ]);

            if (!$resp->ok()) { break; }
            $json = $resp->json();
            $results = (array) ($json['results'] ?? []);
            foreach ($results as $r) {
                $id = isset($r['id']) ? (int) $r['id'] : 0;
                if ($id > 0) { $allIds[] = $id; }
            }

            $next = $json['next'] ?? null;
            SystemLog::debug('RAWG.platform.import.page', [
                'platform_id' => $this->platformId,
                'page' => $page,
                'count_results' => count($results),
                'has_next' => (bool) $next,
            ]);
            $page++;
        } while (!empty($next) && $iterations < 1000); // hard stop safeguard

        // Persist list file (para debug/consulta futura)
        try {
            if (!empty($allIds)) {
                $path = 'rawg/platform_'.$this->platformId.'_ids.txt';
                Storage::disk('local')->put($path, implode("\n", array_unique($allIds)) . "\n");
            }
        } catch (\Throwable $e) {
            // opcional; não falha o job
        }

        // Dispara jobs para cada jogo
        $allIds = array_values(array_unique($allIds));
        foreach ($allIds as $gid) {
            ImportGameByRawgId::dispatch($gid);
        }

        SystemLog::info('RAWG.platform.import.done', [
            'platform_id' => $this->platformId,
            'rawg_platform_id' => $this->rawgPlatformId,
            'ids_count' => count($allIds),
            ]);
    }
}
