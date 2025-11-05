<?php

namespace App\Domain\Games\Jobs;

use App\Domain\Games\Services\RawgImporter;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use App\Support\SystemLog;

class ImportGameByRawgId implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $rawgId;

    public function __construct(int $rawgId)
    {
        $this->rawgId = $rawgId;
    }

    public function handle(RawgImporter $importer): void
    {
        $res = $importer->importById($this->rawgId);
        SystemLog::info('RAWG.game.importById.done', ['rawg_id' => $this->rawgId, 'result' => $res]);
    }
}
