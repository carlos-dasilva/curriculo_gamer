<?php

namespace App\Domain\Games\Services;

use App\Models\Game;
use App\Models\GameImage;
use App\Models\GameLink;

class GameSyncPayload
{
    public const ORDER = [
        'times_updated',
        '-overall_score',
        '-metacritic_metascore',
        '-metacritic_user_score',
        'name',
    ];

    public static function payload(Game $game, bool $includeMeta = false): array
    {
        $payload = ['data' => self::serialize($game)];

        if ($includeMeta) {
            $payload['meta'] = ['order' => self::ORDER];
        }

        return $payload;
    }

    public static function serialize(Game $game): array
    {
        $game->loadMissing([
            'studio:id,name',
            'tags:id,name,slug',
            'platforms:id,name',
            'images:id,game_id,url,sort_order',
            'links:id,game_id,label,url',
        ]);

        return [
            'id' => $game->id,
            'rawg_id' => $game->rawg_id,
            'studio' => $game->studio ? ['id' => $game->studio->id, 'name' => $game->studio->name] : null,
            'name' => $game->name,
            'cover_url' => $game->cover_url,
            'status' => $game->status,
            'age_rating' => $game->age_rating,
            'description' => $game->description,
            'metacritic_metascore' => $game->metacritic_metascore,
            'metacritic_user_score' => $game->metacritic_user_score,
            'overall_score' => $game->overall_score,
            'difficulty' => $game->difficulty,
            'gameplay_hours' => $game->gameplay_hours,
            'hours_to_finish' => $game->hours_to_finish,
            'ptbr_subtitled' => (bool) $game->ptbr_subtitled,
            'ptbr_dubbed' => (bool) $game->ptbr_dubbed,
            'times_updated' => (int) ($game->times_updated ?? 0),
            'tags' => $game->tags->map(fn ($tag) => [
                'id' => $tag->id,
                'name' => $tag->name,
                'slug' => $tag->slug,
            ])->values(),
            'platforms' => $game->platforms->map(fn ($platform) => [
                'id' => $platform->id,
                'name' => $platform->name,
                'release_date' => optional($platform->pivot)->release_date,
            ])->values(),
            'images' => $game->images->sortBy('sort_order')->map(fn (GameImage $img) => [
                'id' => $img->id,
                'url' => $img->url,
                'sort_order' => $img->sort_order,
            ])->values(),
            'external_links' => $game->links->map(fn (GameLink $link) => [
                'id' => $link->id,
                'label' => $link->label,
                'url' => $link->url,
            ])->values(),
            'created_at' => optional($game->created_at)->toISOString(),
            'updated_at' => optional($game->updated_at)->toISOString(),
        ];
    }
}