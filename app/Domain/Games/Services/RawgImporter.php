<?php

namespace App\Domain\Games\Services;

use App\Models\Game;
use App\Models\GameImage;
use App\Models\GameLink;
use App\Models\Platform;
use App\Models\Studio;
use App\Models\Tag;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use App\Support\SystemLog;

class RawgImporter
{
    /**
     * Importa um jogo pelo ID do RAWG e persiste no banco.
     * Regras: se já existir por rawg_id OU por nome (case-insensitive), não faz nada.
     * Retorna array com flags de created/skipped e o game_id quando criado.
     */
    public function importById(int $rawgId): array
    {
        if ($rawgId <= 0) {
            return ['skipped' => true, 'reason' => 'invalid_id'];
        }

        if (Game::query()->where('rawg_id', $rawgId)->exists()) {
            return ['skipped' => true, 'reason' => 'exists_by_id'];
        }

        $apiKey = env('RAWG_API_KEY', '6dd272e717a64ad591eb4ef2889b1572');
        $base = 'https://api.rawg.io/api/games';

        try {
            SystemLog::info('RAWG.importById.start', ['rawg_id' => $rawgId]);
            $resp = Http::timeout(8)->get($base . '/' . $rawgId, ['key' => $apiKey]);
            if (!$resp->ok()) {
                return ['skipped' => true, 'reason' => 'rawg_not_found'];
            }
            $det = $resp->json();

            $name = trim((string) ($det['name'] ?? ''));
            if ($name === '') {
                return ['skipped' => true, 'reason' => 'missing_name'];
            }

            // Já existe por nome? (ignora studio)
            $existsByName = Game::query()
                ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
                ->exists();
            if ($existsByName) {
                SystemLog::debug('RAWG.importById.exists_by_name', ['name' => $name]);
                return ['skipped' => true, 'reason' => 'exists_by_name'];
            }

            $cover = (string) ($det['background_image'] ?? '');
            $released = (string) ($det['released'] ?? '');
            $esrb = (string) (($det['esrb_rating']['name'] ?? '') ?: '');
            $desc = (string) ($det['description_raw'] ?? '');
            $metascore = $det['metacritic'] ?? null;
            $rating = $det['rating'] ?? null;
            $userScore = is_numeric($rating) ? round(((float) $rating) * 2, 2) : null; // 0-10

            // Studio
            $studioId = null;
            $developers = (array) ($det['developers'] ?? []);
            if (!empty($developers)) {
                $dev = $developers[0];
                $devName = is_array($dev) ? (string) ($dev['name'] ?? '') : '';
                if ($devName !== '') {
                    $studio = Studio::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($devName)])->first();
                    if (!$studio) {
                        try { $studio = Studio::create(['name' => $devName]); } catch (\Throwable $e) {
                            $studio = Studio::query()->where('name', $devName)->first();
                        }
                    }
                    $studioId = $studio?->id;
                }
            }

            // Tags (genres)
            $tagIds = [];
            foreach ((array) ($det['genres'] ?? []) as $genre) {
                $gName = trim((string) ($genre['name'] ?? ''));
                if ($gName === '') { continue; }
                $slug = (string) (($genre['slug'] ?? '') ?: Str::slug($gName));
                $tag = Tag::query()->whereRaw('LOWER(slug) = ?', [mb_strtolower($slug)])
                    ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($gName)])
                    ->first();
                if (!$tag) {
                    try {
                        $tag = Tag::create(['name' => $gName, 'slug' => $slug]);
                    } catch (\Throwable $e) {
                        $tag = Tag::query()->whereRaw('LOWER(slug) = ? OR LOWER(name) = ?', [mb_strtolower($slug), mb_strtolower($gName)])->first();
                    }
                }
                if ($tag) { $tagIds[] = $tag->id; }
            }

            // Plataformas (do detalhe)
            $platformsPivot = [];
            $rawgPlatforms = (array) ($det['platforms'] ?? []);
            foreach ($rawgPlatforms as $p) {
                $pObj = $p['platform'] ?? [];
                $pName = trim((string) ($pObj['name'] ?? ''));
                $pRawgId = isset($pObj['id']) ? (int) $pObj['id'] : null;
                if ($pName === '' && !$pRawgId) { continue; }

                $local = null;
                if ($pRawgId) {
                    $local = Platform::query()->where('rawg_id', $pRawgId)->first();
                }
                if (!$local && $pName !== '') {
                    $norm = mb_strtolower(trim($pName));
                    if ($norm === 'genesis') { $pName = 'Mega Drive'; }
                    elseif ($norm === 'nes') { $pName = 'Nintendo 8bits'; }
                    elseif ($norm === 'snes') { $pName = 'Super Nintendo'; }
                    $local = Platform::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($pName)])->first();
                }
                if (!$local && $pName !== '') {
                    try { $local = Platform::create(['name' => $pName, 'rawg_id' => $pRawgId]); }
                    catch (\Throwable $e) { $local = Platform::query()->where('name', $pName)->first(); }
                }
                if ($local) {
                    $relDate = (string) (($p['released_at'] ?? '') ?: $released ?: '');
                    $platformsPivot[$local->id] = ['release_date' => $relDate ?: null];
                }
            }

            // Imagens extras
            $gallery = [];
            $screens = (array) ($det['short_screenshots'] ?? []);
            foreach ($screens as $idx => $img) {
                $u = (string) ($img['image'] ?? '');
                if ($u !== '') { $gallery[] = $u; }
            }
            $bg2 = (string) ($det['background_image_additional'] ?? '');
            if ($bg2 !== '') { $gallery[] = $bg2; }

            // Criação do jogo e associações
            $gameId = null;
            DB::transaction(function () use (&$gameId, $rawgId, $studioId, $name, $cover, $esrb, $desc, $metascore, $userScore, $tagIds, $platformsPivot) {
                $game = Game::create([
                    'rawg_id' => $rawgId,
                    'studio_id' => $studioId,
                    'name' => $name,
                    'cover_url' => $cover ?: null,
                    'status' => 'avaliacao',
                    'age_rating' => $esrb ?: null,
                    'description' => $desc !== '' ? mb_substr($desc, 0, 10000) : null,
                    'metacritic_metascore' => is_numeric($metascore) ? (int) $metascore : null,
                    'metacritic_user_score' => $userScore,
                    'ptbr_subtitled' => false,
                    'ptbr_dubbed' => false,
                ]);

                if (!empty($tagIds)) { $game->tags()->sync($tagIds); }
                if (!empty($platformsPivot)) { $game->platforms()->sync($platformsPivot); }

                // Galeria
                foreach ($gallery as $idx => $url) {
                    try { GameImage::create(['game_id' => $game->id, 'url' => $url, 'sort_order' => $idx]); }
                    catch (\Throwable $e) { /* ignore individual failures */ }
                }

                $gameId = $game->id;
            });

            SystemLog::info('RAWG.importById.created', [
                'rawg_id' => $rawgId,
                'game_id' => $gameId,
                'tags' => count($tagIds),
                'platforms' => count($platformsPivot),
            ]);

            return ['created' => true, 'game_id' => $gameId];
        } catch (\Throwable $e) {
            Log::error('RAWG.importById.error', [
                'rawg_id' => $rawgId,
                'message' => $e->getMessage(),
            ]);
            return ['skipped' => true, 'reason' => 'exception'];
        }
    }
}
