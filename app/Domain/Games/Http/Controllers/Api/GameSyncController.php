<?php

namespace App\Domain\Games\Http\Controllers\Api;

use App\Domain\Games\Http\Requests\SyncGameUpdateRequest;
use App\Domain\Games\Services\GameSyncPayload;
use App\Models\Game;
use App\Models\GameImage;
use App\Models\GameLink;
use App\Models\Platform;
use App\Models\Studio;
use App\Models\Tag;
use App\Support\SystemLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GameSyncController extends Controller
{
    public function ping(): JsonResponse
    {
        return response()->json(['status' => 'ok']);
    }

    public function next(): JsonResponse
    {
        $game = Game::query()
            ->with(['studio:id,name', 'tags:id,name,slug', 'platforms:id,name', 'images:id,game_id,url,sort_order', 'links:id,game_id,label,url'])
            ->orderBy('times_updated')
            ->orderByDesc('overall_score')
            ->orderByDesc('metacritic_metascore')
            ->orderByDesc('metacritic_user_score')
            ->orderBy('name')
            ->first();

        if (!$game) {
            return response()->json(['message' => 'Nenhum jogo disponivel para sincronizacao.'], 404);
        }

        SystemLog::info('API.sync.next_game', [
            'game_id' => $game->id,
            'times_updated' => $game->times_updated,
        ]);

        return response()->json(GameSyncPayload::payload($game, true));
    }

    public function update(SyncGameUpdateRequest $request, Game $game): JsonResponse
    {
        $data = $request->validated();
        if (!empty($data['id']) && (int) $data['id'] !== (int) $game->id) {
            return response()->json(['message' => 'ID do jogo divergente do recurso solicitado.'], 422);
        }

        DB::transaction(function () use ($data, $game) {
            $studioId = $data['studio_id'] ?? $this->resolveStudio($data['studio'] ?? []);
            $this->updateGame($game, $data, $studioId);

            if (array_key_exists('tags', $data)) {
                $tagIds = $this->resolveTags($data['tags'] ?? []);
                $game->tags()->sync($tagIds);
            }

            if (array_key_exists('platforms', $data)) {
                $pivot = $this->resolvePlatforms($data['platforms'] ?? []);
                $game->platforms()->sync($pivot);
            }

            if (array_key_exists('images', $data)) {
                $game->loadMissing('images');
                $this->appendImages($game, $data['images'] ?? []);
            }

            if (array_key_exists('external_links', $data)) {
                $game->loadMissing('links');
                $this->appendLinks($game, $data['external_links'] ?? []);
            }
        });

        $game->refresh()->load(['studio:id,name', 'tags:id,name,slug', 'platforms:id,name', 'images:id,game_id,url,sort_order', 'links:id,game_id,label,url']);

        SystemLog::info('API.sync.update_game', [
            'game_id' => $game->id,
            'times_updated' => $game->times_updated,
        ]);

        return response()->json(GameSyncPayload::payload($game));
    }

    private function updateGame(Game $game, array $data, ?int $studioId): void
    {
        $fields = [
            'rawg_id',
            'name',
            'cover_url',
            'status',
            'age_rating',
            'description',
            'metacritic_metascore',
            'metacritic_user_score',
            'overall_score',
            'difficulty',
            'gameplay_hours',
            'hours_to_finish',
            'ptbr_subtitled',
            'ptbr_dubbed',
        ];

        foreach ($fields as $field) {
            if (array_key_exists($field, $data)) {
                $game->{$field} = $data[$field];
            }
        }

        if ($studioId !== null) {
            $game->studio_id = $studioId;
        }

        $game->times_updated = (int) ($game->times_updated ?? 0) + 1;
        $game->save();
    }

    private function resolveStudio(array $studio): ?int
    {
        if (!empty($studio['id'])) {
            $existing = Studio::query()->find($studio['id']);
            if ($existing) {
                return $existing->id;
            }
        }

        $name = trim((string) ($studio['name'] ?? ''));
        if ($name === '') {
            return null;
        }

        $existing = Studio::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])->first();
        if ($existing) {
            return $existing->id;
        }

        try {
            return Studio::create(['name' => $name])->id;
        } catch (\Throwable $e) {
            return Studio::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])->value('id');
        }
    }

    private function resolveTags(array $tags): array
    {
        $ids = [];
        foreach ($tags as $tag) {
            if (!empty($tag['id'])) {
                $found = Tag::query()->find($tag['id']);
                if ($found) {
                    $ids[] = $found->id;
                    continue;
                }
            }

            $name = trim((string) ($tag['name'] ?? ''));
            if ($name === '') {
                continue;
            }

            $slug = trim((string) ($tag['slug'] ?? '')) ?: Str::slug($name);
            $existing = Tag::query()
                ->whereRaw('LOWER(slug) = ?', [mb_strtolower($slug)])
                ->orWhereRaw('LOWER(name) = ?', [mb_strtolower($name)])
                ->first();

            if (!$existing) {
                try {
                    $existing = Tag::create(['name' => $name, 'slug' => $slug]);
                } catch (\Throwable $e) {
                    $existing = Tag::query()
                        ->whereRaw('LOWER(slug) = ? OR LOWER(name) = ?', [mb_strtolower($slug), mb_strtolower($name)])
                        ->first();
                }
            }

            if ($existing) {
                $ids[] = $existing->id;
            }
        }

        return array_values(array_unique($ids));
    }

    private function resolvePlatforms(array $platforms): array
    {
        $pivot = [];
        foreach ($platforms as $platform) {
            $platformId = null;
            if (!empty($platform['id'])) {
                $found = Platform::query()->find($platform['id']);
                if ($found) {
                    $platformId = $found->id;
                }
            }

            if ($platformId === null) {
                $name = trim((string) ($platform['name'] ?? ''));
                if ($name === '') {
                    continue;
                }

                $existing = Platform::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])->first();
                if (!$existing) {
                    try {
                        $existing = Platform::create(['name' => $name]);
                    } catch (\Throwable $e) {
                        $existing = Platform::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])->first();
                    }
                }
                if ($existing) {
                    $platformId = $existing->id;
                }
            }

            if ($platformId) {
                $pivot[$platformId] = [
                    'release_date' => $platform['release_date'] ?? null,
                ];
            }
        }

        return $pivot;
    }

    private function appendImages(Game $game, array $images): void
    {
        $existingUrls = $game->images->map(fn (GameImage $img) => mb_strtolower(trim($img->url)))->all();
        $existingSorts = $game->images->pluck('sort_order')->all();
        $maxSort = (int) ($game->images->max('sort_order') ?? -1);

        foreach ($images as $image) {
            $url = trim((string) ($image['url'] ?? ''));
            if ($url === '') {
                continue;
            }
            $normalized = mb_strtolower($url);
            if (in_array($normalized, $existingUrls, true)) {
                continue;
            }

            $sort = isset($image['sort_order']) ? (int) $image['sort_order'] : null;
            if ($sort === null || in_array($sort, $existingSorts, true)) {
                $sort = ++$maxSort;
            }

            try {
                GameImage::create([
                    'game_id' => $game->id,
                    'url' => $url,
                    'sort_order' => $sort,
                ]);
            } catch (\Throwable $e) {
                // Duplicates are ignored
            }

            $existingUrls[] = $normalized;
            $existingSorts[] = $sort;
            $maxSort = max($maxSort, $sort);
        }
    }

    private function appendLinks(Game $game, array $links): void
    {
        $existing = $game->links->map(function (GameLink $link) {
            return mb_strtolower(trim($link->url));
        })->all();

        foreach ($links as $link) {
            $url = trim((string) ($link['url'] ?? ''));
            $label = trim((string) ($link['label'] ?? ''));
            if ($url === '' || $label === '') {
                continue;
            }
            $normalized = mb_strtolower($url);
            if (in_array($normalized, $existing, true)) {
                continue;
            }

            try {
                GameLink::create([
                    'game_id' => $game->id,
                    'label' => $label,
                    'url' => $url,
                ]);
                $existing[] = $normalized;
            } catch (\Throwable $e) {
                // Ignore duplicate insert errors
            }
        }
    }

}
