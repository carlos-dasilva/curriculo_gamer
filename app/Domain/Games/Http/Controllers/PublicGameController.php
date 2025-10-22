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
                'platforms:id,name',
                'tags:id,name,slug',
                'images:id,game_id,url,sort_order',
                'links:id,game_id,label,url',
            ])
            ->where('id', $game);

        $game = $query->firstOrFail();

        // If not released, only moderator/admin may view
        if ($game->status !== 'liberado') {
            $canView = false;
            if (auth()->check()) {
                try {
                    $role = auth()->user()->role; // enum Role
                    $value = is_object($role) ? ($role->value ?? null) : ($role ?? null);
                    $val = is_string($value) ? strtolower(trim($value)) : '';
                    $canView = in_array($val, ['moderador', 'admin'], true);
                } catch (\Throwable $e) {
                    $canView = false;
                }
            }

            if (!$canView) {
                return redirect()->route('home');
            }
        }

        // Ordena imagens da galeria
        $gallery = $game->images->sortBy('sort_order')->pluck('url')->values()->all();

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
                        'release_date' => optional($p->pivot)->release_date,
                    ];
                })->values(),
                'tags' => $game->tags->map(fn($t) => ['id' => $t->id, 'name' => $t->name, 'slug' => $t->slug])->values(),
                'gallery_urls' => $gallery,
                'external_links' => $game->links->map(fn($l) => ['label' => $l->label, 'url' => $l->url])->values(),
            ],
        ]);
    }
}
