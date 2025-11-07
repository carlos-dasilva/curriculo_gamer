<?php

namespace App\Domain\Platforms\Jobs;

use App\Domain\Games\Jobs\ImportGameByRawgId;
use App\Models\Game;
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
        $apiKey = env('RAWG_API_KEY', '795dff3f70a64fc681e00517c530bf17');
        $base = 'https://api.rawg.io/api/games';

        $page = 1;
        $pageSize = 40;
        $allIds = [];
        $iterations = 0;
        $totalDispatched = 0;
        $totalSkippedExisting = 0;

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
            $idsPage = [];
            foreach ($results as $r) {
                $id = isset($r['id']) ? (int) $r['id'] : 0;
                if ($id > 0) { $idsPage[] = $id; }
            }

            // Evita chamar detalhe para jogos que já existem por rawg_id
            $existing = empty($idsPage) ? [] : Game::query()->whereIn('rawg_id', $idsPage)->pluck('rawg_id')->all();
            $map = array_fill_keys($existing, true);
            $toDispatch = array_values(array_filter($idsPage, fn($gid) => empty($map[$gid])));
            foreach ($toDispatch as $gid) {
                ImportGameByRawgId::dispatch($gid);
            }
            $totalDispatched += count($toDispatch);
            $totalSkippedExisting += count($idsPage) - count($toDispatch);
            $allIds = array_merge($allIds, $idsPage);

            $next = $json['next'] ?? null;
            SystemLog::debug('RAWG.platform.import.page', [
                'platform_id' => $this->platformId,
                'page' => $page,
                'ids_in_page' => count($idsPage),
                'skipped_existing_by_id' => count($idsPage) - count($toDispatch),
                'dispatched' => count($toDispatch),
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

        SystemLog::info('RAWG.platform.import.done', [
            'platform_id' => $this->platformId,
            'rawg_platform_id' => $this->rawgPlatformId,
            'ids_count' => count(array_unique($allIds)),
            'dispatched' => $totalDispatched,
            'skipped_existing_by_id' => $totalSkippedExisting,
            ]);
    }
}
