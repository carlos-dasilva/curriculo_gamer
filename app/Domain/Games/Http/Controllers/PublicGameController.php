<?php

namespace App\Domain\Games\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;
use App\Models\Game;

class PublicGameController extends Controller
{
    public function show(int $game)
    {
        $query = Game::query()
            ->with([
                'studio:id,name',
                'platforms:id,name,release_year',
                'tags:id,name,slug',
                'images:id,game_id,url,sort_order',
                'links:id,game_id,label,url',
            ])
            ->where('id', $game);

        $game = $query->firstOrFail();

        // If not released, allow viewing only for:
        // - Moderator/Admin users; or
        // - The creator of this game (created_by)
        if ($game->status !== 'liberado') {
            $canView = false;
            if (auth()->check()) {
                try {
                    $uid = (int) auth()->id();
                    // Allow creator
                    if ((int) ($game->created_by ?? 0) === $uid) {
                        $canView = true;
                    } else {
                        // Allow moderators/admins
                        $role = auth()->user()->role; // enum Role or string
                        $value = is_object($role) ? ($role->value ?? null) : ($role ?? null);
                        $val = is_string($value) ? strtolower(trim($value)) : '';
                        $canView = in_array($val, ['moderador', 'admin'], true);
                    }
                } catch (\Throwable $e) {
                    $canView = false;
                }
            }

            if (!$canView) {
                return redirect()->route('home');
            }
        }

        // Ordena imagens da galeria
        $sortedImages = $game->images->sortBy('sort_order')->values();
        $gallery = $sortedImages->pluck('url')->values()->all();

        // Carrega minhas informações salvas (se autenticado)
        $myInfo = null;
        $myPlatformStatuses = [];
        if (auth()->check()) {
            try {
                $myInfo = \App\Models\UserGameInfo::query()
                    ->where('user_id', auth()->id())
                    ->where('game_id', $game->id)
                    ->first(['score','difficulty','gameplay_hours','notes']);
            } catch (\Throwable $e) {
                $myInfo = null;
            }
            try {
                $rows = \App\Models\UserGamePlatformStatus::query()
                    ->where('user_id', auth()->id())
                    ->where('game_id', $game->id)
                    ->get(['platform_id','status']);
                $myPlatformStatuses = $rows->mapWithKeys(fn($r) => [$r->platform_id => (string) $r->status])->all();
            } catch (\Throwable $e) {
                $myPlatformStatuses = [];
            }
        }

        return Inertia::render('Games/Show', [
            'game' => [
                'id' => $game->id,
                'name' => $game->name,
                'cover_url' => $game->cover_url,
                'description' => $game->description,
                'age_rating' => $game->age_rating,
                'overall_score' => $game->overall_score,
                'metacritic_metascore' => $game->metacritic_metascore,
                'metacritic_user_score' => $game->metacritic_user_score,
                'difficulty' => $game->difficulty,
                'gameplay_hours' => $game->gameplay_hours,
                'ptbr_subtitled' => (bool) $game->ptbr_subtitled,
                'ptbr_dubbed' => (bool) $game->ptbr_dubbed,
                'studio' => $game->studio ? [ 'id' => $game->studio->id, 'name' => $game->studio->name ] : null,
                'platforms' => $game->platforms->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'name' => $p->name,
                        'release_year' => $p->release_year,
                        'release_date' => optional($p->pivot)->release_date,
                    ];
                })->values(),
                'tags' => $game->tags->map(fn($t) => ['id' => $t->id, 'name' => $t->name, 'slug' => $t->slug])->values(),
                // urls para exibição geral
                'gallery_urls' => $gallery,
                // metadados para admins (permitir excluir)
                'gallery' => $sortedImages->map(fn($im) => ['id' => $im->id, 'url' => $im->url])->values(),
                'external_links' => $game->links->map(fn($l) => ['label' => $l->label, 'url' => $l->url])->values(),
            ],
            'myInfo' => $myInfo,
            'myPlatformStatuses' => $myPlatformStatuses,
        ]);
    }
}
