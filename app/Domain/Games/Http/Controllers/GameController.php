<?php

namespace App\Domain\Games\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;
use App\Models\Studio;
use App\Models\Platform;
use App\Models\Tag;
use App\Models\Game;
use App\Models\GameImage;
use App\Models\GameLink;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\RedirectResponse;
use App\Domain\Games\Http\Requests\StoreGameRequest;

class GameController extends Controller
{
    public function index()
    {
        $perPage = 15;
        $name = trim((string) request('name', ''));
        $status = trim((string) request('status', ''));

        $query = Game::query()
            ->with(['studio:id,name'])
            ->withCount(['platforms', 'tags'])
            ->when($name !== '', function ($q) use ($name) {
                $q->where('name', 'like', "%{$name}%");
            })
            ->when(in_array($status, ['avaliacao','liberado'], true), function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->orderBy('name');

        $games = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Admin/Games/Index', [
            'games' => $games,
            'filters' => [ 'name' => $name, 'status' => $status ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Games/Create', [
            'studios'   => Studio::query()->select(['id','name'])->orderBy('name')->get(),
            'platforms' => Platform::query()->select(['id','name'])->orderBy('name')->get(),
            'tags'      => Tag::query()->select(['id','name','slug'])->orderBy('name')->get(),
        ]);
    }

    public function store(StoreGameRequest $request): RedirectResponse
    {
        $data = $request->validated();

        return DB::transaction(function () use ($data) {
            $status = $data['status'] ?? 'avaliacao';
            $releasedBy = $status === 'liberado' ? (auth()->id() ?: null) : null;

            $game = Game::create([
                'studio_id' => $data['studio_id'] ?? null,
                'name' => $data['name'],
                'cover_url' => $data['cover_url'] ?? null,
                'status' => $status,
                'released_by' => $releasedBy,
                'age_rating' => $data['age_rating'] ?? null,
                'description' => $data['description'] ?? null,
                'metacritic_metascore' => $data['metacritic_metascore'] ?? null,
                'metacritic_user_score' => $data['metacritic_user_score'] ?? null,
                'overall_score' => $data['overall_score'] ?? null,
                'difficulty' => $data['difficulty'] ?? null,
                'gameplay_hours' => $data['gameplay_hours'] ?? null,
                'ptbr_subtitled' => (bool) ($data['ptbr_subtitled'] ?? false),
                'ptbr_dubbed' => (bool) ($data['ptbr_dubbed'] ?? false),
            ]);

            // Tags
            $game->tags()->sync($data['tag_ids'] ?? []);

            // Plataformas com data de lançamento no pivot
            $pivot = [];
            foreach (($data['platform_ids'] ?? []) as $pid) {
                $pivot[$pid] = [
                    'release_date' => $data['platform_releases'][$pid] ?? null,
                ];
            }
            if (!empty($pivot)) {
                $game->platforms()->sync($pivot);
            }

            // Imagens da galeria
            foreach (($data['gallery_urls'] ?? []) as $idx => $url) {
                GameImage::create([
                    'game_id' => $game->id,
                    'url' => $url,
                    'sort_order' => $idx,
                ]);
            }

            // Links externos
            foreach (($data['external_links'] ?? []) as $link) {
                GameLink::create([
                    'game_id' => $game->id,
                    'label' => $link['label'],
                    'url' => $link['url'],
                ]);
            }

            return redirect()->route('admin.games.create')->with('success', 'Jogo criado com sucesso.');
        });
    }

    public function edit(Game $game)
    {
        $game->load(['studio:id,name', 'tags:id', 'platforms:id', 'images:id,game_id,url,sort_order', 'links:id,game_id,label,url', 'releasedBy:id,name']);

        return Inertia::render('Admin/Games/Edit', [
            'game' => [
                'id' => $game->id,
                'name' => $game->name,
                'studio_id' => $game->studio_id,
                'cover_url' => $game->cover_url,
                'age_rating' => $game->age_rating,
                'status' => $game->status,
                'released_by' => $game->released_by,
                'released_by_name' => optional($game->releasedBy)->name,
                'description' => $game->description,
                'metacritic_metascore' => $game->metacritic_metascore,
                'metacritic_user_score' => $game->metacritic_user_score,
                'overall_score' => $game->overall_score,
                'difficulty' => $game->difficulty,
                'gameplay_hours' => $game->gameplay_hours,
                'ptbr_subtitled' => (bool) $game->ptbr_subtitled,
                'ptbr_dubbed' => (bool) $game->ptbr_dubbed,
                'tag_ids' => $game->tags->pluck('id'),
                'platform_ids' => $game->platforms->pluck('id'),
                'platform_releases' => $game->platforms->mapWithKeys(fn($p) => [$p->id => optional($p->pivot)->release_date])->all(),
                'gallery_urls' => $game->images->sortBy('sort_order')->pluck('url')->values(),
                'external_links' => $game->links->map(fn($l) => ['label' => $l->label, 'url' => $l->url])->values(),
            ],
            'studios'   => Studio::query()->select(['id','name'])->orderBy('name')->get(),
            'platforms' => Platform::query()->select(['id','name'])->orderBy('name')->get(),
            'tags'      => Tag::query()->select(['id','name','slug'])->orderBy('name')->get(),
        ]);
    }

    public function update(\App\Domain\Games\Http\Requests\StoreGameRequest $request, Game $game): RedirectResponse
    {
        $data = $request->validated();

        return DB::transaction(function () use ($data, $game) {
            $newStatus = $data['status'] ?? $game->status;
            $releasedBy = $game->released_by;
            if ($game->status !== 'liberado' && $newStatus === 'liberado') {
                $releasedBy = auth()->id() ?: $releasedBy; // registra quem liberou
            }

            $game->update([
                'studio_id' => $data['studio_id'] ?? null,
                'name' => $data['name'],
                'cover_url' => $data['cover_url'] ?? null,
                'status' => $newStatus,
                'released_by' => $releasedBy,
                'age_rating' => $data['age_rating'] ?? null,
                'description' => $data['description'] ?? null,
                'metacritic_metascore' => $data['metacritic_metascore'] ?? null,
                'metacritic_user_score' => $data['metacritic_user_score'] ?? null,
                'overall_score' => $data['overall_score'] ?? null,
                'difficulty' => $data['difficulty'] ?? null,
                'gameplay_hours' => $data['gameplay_hours'] ?? null,
                'ptbr_subtitled' => (bool) ($data['ptbr_subtitled'] ?? false),
                'ptbr_dubbed' => (bool) ($data['ptbr_dubbed'] ?? false),
            ]);

            // Tags
            $game->tags()->sync($data['tag_ids'] ?? []);

            // Plataformas + datas
            $pivot = [];
            foreach (($data['platform_ids'] ?? []) as $pid) {
                $pivot[$pid] = [
                    'release_date' => $data['platform_releases'][$pid] ?? null,
                ];
            }
            $game->platforms()->sync($pivot);

            // Imagens (recria)
            $game->images()->delete();
            foreach (($data['gallery_urls'] ?? []) as $idx => $url) {
                GameImage::create([
                    'game_id' => $game->id,
                    'url' => $url,
                    'sort_order' => $idx,
                ]);
            }

            // Links (recria)
            $game->links()->delete();
            foreach (($data['external_links'] ?? []) as $link) {
                GameLink::create([
                    'game_id' => $game->id,
                    'label' => $link['label'],
                    'url' => $link['url'],
                ]);
            }

            return redirect()->route('admin.games.index')->with('success', 'Jogo atualizado com sucesso.');
        });
    }

    public function destroy(Game $game): RedirectResponse
    {
        DB::transaction(function () use ($game) {
            $game->tags()->detach();
            $game->platforms()->detach();
            $game->images()->delete();
            $game->links()->delete();
            $game->delete(); // Soft delete
        });

        return redirect()->route('admin.games.index')->with('success', 'Jogo removido com sucesso.');
    }
}
