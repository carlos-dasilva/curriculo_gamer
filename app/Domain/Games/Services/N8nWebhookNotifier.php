<?php

namespace App\Domain\Games\Services;

use App\Models\Game;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class N8nWebhookNotifier
{
    public function notify(Game $game): void
    {
        $url = (string) config('services.n8n.webhook_url');
        $apiKey = (string) config('services.n8n.api_key');

        if ($url === '' || $apiKey === '') {
            Log::warning('N8N webhook not configured.', [
                'game_id' => $game->id,
            ]);
            return;
        }

        $payload = GameSyncPayload::payload($game, true);

        $response = Http::timeout(10)
            ->withHeaders([
                'X-API-KEY' => $apiKey,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])
            ->post($url, $payload);

        if ($response->failed()) {
            Log::error('N8N webhook failed.', [
                'game_id' => $game->id,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        }
    }
}