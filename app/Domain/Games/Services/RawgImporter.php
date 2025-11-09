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

        $apiKey = env('RAWG_API_KEY', '795dff3f70a64fc681e00517c530bf17');
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
                } else if ($local && $pRawgId && empty($local->rawg_id)) {
                    // Se encontramos por nome mas sem rawg_id, atualiza para manter o vínculo RAWG
                    try { $local->update(['rawg_id' => $pRawgId]); } catch (\Throwable $e) { /* ignore if unique or DB error */ }
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
                    'status' => 'liberado',
                    'released_by' => auth()->id() ?: null,
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

    /**
     * Importa/atualiza um jogo pelo ID do RAWG segundo as regras solicitadas:
     * - Se existir por rawg_id: atualiza somente campos em branco
     * - Se não existir por rawg_id, mas existir por nome e sem rawg_id: seta rawg_id e atualiza somente campos em branco
     * - Se existir por nome com outro rawg_id: cria novo
     * - Se não existir por id nem por nome: cria novo
     */
    public function upsertByRawgId(int $rawgId): array
    {
        if ($rawgId <= 0) {
            return ['skipped' => true, 'reason' => 'invalid_id'];
        }

        $apiKey = env('RAWG_API_KEY', '795dff3f70a64fc681e00517c530bf17');
        $base = 'https://api.rawg.io/api/games';

        try {
            SystemLog::info('RAWG.upsertById.start', [
                'rawg_id' => $rawgId,
                'url' => $base . '/' . $rawgId,
                'params' => ['key' => $apiKey ? '***' : null],
            ]);
            $resp = Http::timeout(8)->get($base . '/' . $rawgId, ['key' => $apiKey]);
            SystemLog::info('RAWG.upsertById.http_response', [
                'rawg_id' => $rawgId,
                'status' => $resp->status(),
            ]);
            if (!$resp->ok()) {
                return ['skipped' => true, 'reason' => 'rawg_not_found'];
            }
            $det = $resp->json();

            $name = trim((string) ($det['name'] ?? ''));
            if ($name === '') {
                return ['skipped' => true, 'reason' => 'missing_name'];
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
                $dev = $developers[0] ?? null;
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

            // Tags
            $tagIds = [];
            foreach ((array) ($det['genres'] ?? []) as $genre) {
                $gName = trim((string) ($genre['name'] ?? ''));
                if ($gName === '') { continue; }
                $slug = (string) (($genre['slug'] ?? '') ?: Str::slug($gName));
                $tag = Tag::query()->whereRaw('LOWER(slug) = ?', [mb_strtolower($slug)])
                    ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($gName)])
                    ->first();
                if (!$tag) {
                    try { $tag = Tag::create(['name' => $gName, 'slug' => $slug]); }
                    catch (\Throwable $e) { $tag = Tag::query()->whereRaw('LOWER(slug) = ? OR LOWER(name) = ?', [mb_strtolower($slug), mb_strtolower($gName)])->first(); }
                }
                if ($tag) { $tagIds[] = $tag->id; }
            }

            // Plataformas
            $platformsPivot = [];
            $rawgPlatforms = (array) ($det['platforms'] ?? []);
            foreach ($rawgPlatforms as $p) {
                $pObj = $p['platform'] ?? [];
                $pName = trim((string) ($pObj['name'] ?? ''));
                $pRawgId = isset($pObj['id']) ? (int) $pObj['id'] : null;
                if ($pName === '' && !$pRawgId) { continue; }
                $local = null;
                if ($pRawgId) { $local = Platform::query()->where('rawg_id', $pRawgId)->first(); }
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
                } else if ($local && $pRawgId && empty($local->rawg_id)) {
                    // Se encontrados por nome (ou já existentes) sem rawg_id, atualiza o vínculo RAWG
                    try { $local->update(['rawg_id' => $pRawgId]); } catch (\Throwable $e) { /* ignore */ }
                }
                if ($local) {
                    $relDate = (string) (($p['released_at'] ?? '') ?: $released ?: '');
                    $platformsPivot[$local->id] = ['release_date' => $relDate ?: null];
                }
            }

            // Galeria
            $gallery = [];
            foreach ((array) ($det['short_screenshots'] ?? []) as $idx => $img) {
                $u = (string) ($img['image'] ?? '');
                if ($u !== '') { $gallery[] = $u; }
            }
            $bg2 = (string) ($det['background_image_additional'] ?? '');
            if ($bg2 !== '') { $gallery[] = $bg2; }

            // 1) Por ID
            $byId = Game::query()->where('rawg_id', $rawgId)->first();
            if ($byId) {
                $changes = [
                    'fields' => [],
                    'tags' => false,
                    'platforms' => false,
                    'platform_dates_filled' => 0,
                    'images' => false,
                ];
                DB::transaction(function () use ($byId, $studioId, $cover, $esrb, $desc, $metascore, $userScore, $tagIds, $platformsPivot, $gallery, &$changes) {
                    $patch = [];
                    $setIfEmpty = function (string $key, $val) use (&$patch, $byId) {
                        $cur = $byId->getAttribute($key);
                        $blank = ($cur === null) || ($cur === '');
                        if ($blank && $val !== null && $val !== '') { $patch[$key] = $val; }
                    };
                    if ($byId->studio_id === null && $studioId) { $patch['studio_id'] = $studioId; }
                    $setIfEmpty('cover_url', $cover ?: null);
                    $setIfEmpty('age_rating', $esrb ?: null);
                    $setIfEmpty('description', $desc !== '' ? mb_substr($desc, 0, 10000) : null);
                    if ($byId->metacritic_metascore === null && is_numeric($metascore)) { $patch['metacritic_metascore'] = (int) $metascore; }
                    if ($byId->metacritic_user_score === null && $userScore !== null) { $patch['metacritic_user_score'] = $userScore; }
                    // Promove para liberado sempre que o serviço executar atualizações
                    if (($byId->status ?? 'avaliacao') !== 'liberado') {
                        $patch['status'] = 'liberado';
                        if (empty($byId->released_by)) { $patch['released_by'] = auth()->id() ?: null; }
                    }
                    if (!empty($patch)) { $byId->update($patch); $changes['fields'] = array_keys($patch); }

                    if ($byId->tags()->count() === 0 && !empty($tagIds)) { $byId->tags()->sync($tagIds); $changes['tags'] = true; }
                    if ($byId->platforms()->count() === 0 && !empty($platformsPivot)) {
                        $byId->platforms()->sync($platformsPivot); $changes['platforms'] = true;
                    } else {
                        $attached = $byId->platforms()->pluck('platforms.id')->all();
                        foreach ($attached as $pid) {
                            $rel = $byId->platforms()->where('platform_id', $pid)->first();
                            $hasDate = optional($rel->pivot)->release_date;
                            $newDate = $platformsPivot[$pid]['release_date'] ?? null;
                            if (!$hasDate && $newDate) { $byId->platforms()->updateExistingPivot($pid, ['release_date' => $newDate]); $changes['platform_dates_filled']++; }
                        }
                    }
                    if ($byId->images()->count() === 0) {
                        foreach ($gallery as $idx => $url) {
                            try { GameImage::create(['game_id' => $byId->id, 'url' => $url, 'sort_order' => $idx]); $changes['images'] = true; } catch (\Throwable $e) {}
                        }
                    }
                });
                SystemLog::info('RAWG.upsertById.updated_by_id', [
                    'rawg_id' => $rawgId,
                    'game_id' => $byId->id,
                    'changed_fields' => $changes['fields'],
                    'tags_added' => $changes['tags'],
                    'platforms_added' => $changes['platforms'],
                    'platform_dates_filled' => $changes['platform_dates_filled'],
                    'images_added' => $changes['images'],
                    'no_changes' => empty($changes['fields']) && !$changes['tags'] && !$changes['platforms'] && $changes['platform_dates_filled'] === 0 && !$changes['images'],
                ]);
                return ['updated_by_id' => true, 'game_id' => $byId->id];
            }

            // 2) Por nome
            $byName = Game::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])->first();
            if ($byName && empty($byName->rawg_id)) {
                $changes = [ 'fields' => [], 'tags' => false, 'platforms' => false, 'platform_dates_filled' => 0, 'images' => false ];
                DB::transaction(function () use ($byName, $studioId, $cover, $esrb, $desc, $metascore, $userScore, $tagIds, $platformsPivot, $gallery, $rawgId, &$changes) {
                    $patch = ['rawg_id' => $rawgId];
                    $setIfEmpty = function (string $key, $val) use (&$patch, $byName) {
                        $cur = $byName->getAttribute($key);
                        $blank = ($cur === null) || ($cur === '');
                        if ($blank && $val !== null && $val !== '') { $patch[$key] = $val; }
                    };
                    if ($byName->studio_id === null && $studioId) { $patch['studio_id'] = $studioId; }
                    $setIfEmpty('cover_url', $cover ?: null);
                    $setIfEmpty('age_rating', $esrb ?: null);
                    $setIfEmpty('description', $desc !== '' ? mb_substr($desc, 0, 10000) : null);
                    if ($byName->metacritic_metascore === null && is_numeric($metascore)) { $patch['metacritic_metascore'] = (int) $metascore; }
                    if ($byName->metacritic_user_score === null && $userScore !== null) { $patch['metacritic_user_score'] = $userScore; }
                    // Promove para liberado ao atualizar por nome também
                    if (($byName->status ?? 'avaliacao') !== 'liberado') {
                        $patch['status'] = 'liberado';
                        if (empty($byName->released_by)) { $patch['released_by'] = auth()->id() ?: null; }
                    }
                    $byName->update($patch); $changes['fields'] = array_keys($patch);

                    if ($byName->tags()->count() === 0 && !empty($tagIds)) { $byName->tags()->sync($tagIds); $changes['tags'] = true; }
                    if ($byName->platforms()->count() === 0 && !empty($platformsPivot)) {
                        $byName->platforms()->sync($platformsPivot); $changes['platforms'] = true;
                    } else {
                        $attached = $byName->platforms()->pluck('platforms.id')->all();
                        foreach ($attached as $pid) {
                            $rel = $byName->platforms()->where('platform_id', $pid)->first();
                            $hasDate = optional($rel->pivot)->release_date;
                            $newDate = $platformsPivot[$pid]['release_date'] ?? null;
                            if (!$hasDate && $newDate) { $byName->platforms()->updateExistingPivot($pid, ['release_date' => $newDate]); $changes['platform_dates_filled']++; }
                        }
                    }
                    if ($byName->images()->count() === 0) {
                        foreach ($gallery as $idx => $url) {
                            try { GameImage::create(['game_id' => $byName->id, 'url' => $url, 'sort_order' => $idx]); $changes['images'] = true; } catch (\Throwable $e) {}
                        }
                    }
                });
                SystemLog::info('RAWG.upsertById.updated_by_name', [
                    'rawg_id' => $rawgId,
                    'game_id' => $byName->id,
                    'changed_fields' => $changes['fields'],
                    'tags_added' => $changes['tags'],
                    'platforms_added' => $changes['platforms'],
                    'platform_dates_filled' => $changes['platform_dates_filled'],
                    'images_added' => $changes['images'],
                    'no_changes' => empty($changes['fields']) && !$changes['tags'] && !$changes['platforms'] && $changes['platform_dates_filled'] === 0 && !$changes['images'],
                ]);
                return ['updated_by_name' => true, 'game_id' => $byName->id];
            }

            // 3) Criar novo
            $gameId = null;
            DB::transaction(function () use (&$gameId, $rawgId, $studioId, $name, $cover, $esrb, $desc, $metascore, $userScore, $tagIds, $platformsPivot, $gallery) {
                $game = Game::create([
                    'rawg_id' => $rawgId,
                    'studio_id' => $studioId,
                    'name' => $name,
                    'cover_url' => $cover ?: null,
                    'status' => 'liberado',
                    'released_by' => auth()->id() ?: null,
                    'age_rating' => $esrb ?: null,
                    'description' => $desc !== '' ? mb_substr($desc, 0, 10000) : null,
                    'metacritic_metascore' => is_numeric($metascore) ? (int) $metascore : null,
                    'metacritic_user_score' => $userScore,
                    'ptbr_subtitled' => false,
                    'ptbr_dubbed' => false,
                ]);
                if (!empty($tagIds)) { $game->tags()->sync($tagIds); }
                if (!empty($platformsPivot)) { $game->platforms()->sync($platformsPivot); }
                foreach ($gallery as $idx => $url) {
                    try { GameImage::create(['game_id' => $game->id, 'url' => $url, 'sort_order' => $idx]); } catch (\Throwable $e) {}
                }
                $gameId = $game->id;
            });
            SystemLog::info('RAWG.upsertById.created', [
                'rawg_id' => $rawgId,
                'game_id' => $gameId,
                'tags' => count($tagIds),
                'platforms' => count($platformsPivot),
                'gallery_count' => count($gallery),
            ]);
            return ['created' => true, 'game_id' => $gameId];
        } catch (\Throwable $e) {
            SystemLog::info('RAWG.upsertById.error', ['rawg_id' => $rawgId, 'message' => $e->getMessage()]);
            return ['skipped' => true, 'reason' => 'exception'];
        }
    }
}
