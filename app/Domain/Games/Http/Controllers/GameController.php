<?php

namespace App\Domain\Games\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Models\Studio;
use App\Models\Platform;
use App\Models\Tag;
use App\Models\Game;
use App\Models\GameImage;
use App\Models\GameLink;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
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

        Log::info('ADMIN.GAMES.STORE.request', [
            'user_id' => auth()->id(),
            'keys' => array_keys($data),
            'name' => $data['name'] ?? null,
            'status' => $data['status'] ?? null,
        ]);

        
        return DB::transaction(function () use ($data) {
            $status = $data['status'] ?? 'avaliacao';
            $releasedBy = $status === 'liberado' ? (auth()->id() ?: null) : null;

            $game = Game::create([
                'studio_id' => $data['studio_id'] ?? null,
                'name' => $data['name'],
                'cover_url' => $data['cover_url'] ?? null,
                'status' => $status,
                'released_by' => $releasedBy,
                'created_by' => auth()->id() ?: null,
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

            // Plataformas com data de lanÃ§amento no pivot
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

            return redirect()->route('admin.games.edit', $game)->with('success', 'Jogo criado com sucesso.');
        });
    }

    /**
     * Captura e preenche dados de jogo via RAWG sem persistir.
     */
    public function capture(Request $request): JsonResponse
    {
        Log::info('ADMIN.GAMES.CAPTURE.request', [
            'user_id' => auth()->id(),
            'name' => $request->input('name'),
        ]);
        $data = $request->all();

        try {
            $apiKey = env('RAWG_API_KEY', '6dd272e717a64ad591eb4ef2889b1572');
            $name = (string) ($data['name'] ?? '');
            if ($apiKey && $name !== '') {
                $base = 'https://api.rawg.io/api/games';
                $resp = Http::timeout(8)->get($base, [ 'key' => $apiKey, 'search' => $name, 'search_exact' => true, 'page_size' => 1 ]);
                if (!$resp->ok() || empty($resp['results'])) {
                    $resp = Http::timeout(8)->get($base, [ 'key' => $apiKey, 'search' => $name, 'page_size' => 1 ]);
                }
                if ($resp->ok() && !empty($resp['results'])) {
                    $first = $resp['results'][0] ?? [];
                    // Metascore e user score: só preencher se estiver vazio
                    if ((!isset($data['metacritic_metascore']) || $data['metacritic_metascore'] === null || $data['metacritic_metascore'] === '') && isset($first['metacritic']) && $first['metacritic'] !== null) {
                        $data['metacritic_metascore'] = (int) $first['metacritic'];
                    }
                    $rating = $first['rating'] ?? null;
                    if ((!isset($data['metacritic_user_score']) || $data['metacritic_user_score'] === null || $data['metacritic_user_score'] === '') && $rating !== null) {
                        $data['metacritic_user_score'] = round(((float) $rating) * 2, 2);
                    }
                    if (empty($data['cover_url'] ?? null)) {
                        $bg = $first['background_image'] ?? null;
                        if (is_string($bg) && $bg !== '') { $data['cover_url'] = $bg; }
                    }
                    $released = $first['released'] ?? null;
                    if ($released) {
                        $platformIds = (array) ($data['platform_ids'] ?? []);
                        if (!empty($platformIds)) {
                            $data['platform_releases'] = (array) ($data['platform_releases'] ?? []);
                            foreach ($platformIds as $pid) {
                                if (empty($data['platform_releases'][$pid] ?? null)) { $data['platform_releases'][$pid] = $released; }
                            }
                        }
                    }
                    $needsDescription = empty(trim((string) ($data['description'] ?? '')));
                    $needsStudio = empty($data['studio_id'] ?? null);
                    $needsTags = empty($data['tag_ids'] ?? []) || count((array) $data['tag_ids']) === 0;
                    $needsPlatforms = empty($data['platform_ids'] ?? []) || count((array) $data['platform_ids']) === 0;
                    if (($needsDescription || $needsStudio || $needsTags || $needsPlatforms) && !empty($first['id'])) {
                        $detail = Http::timeout(8)->get($base . '/' . $first['id'], [ 'key' => $apiKey ]);
                        if ($detail->ok()) {
                            $det = $detail->json();
                            if ($needsDescription) {
                                $desc = (string) ($det['description_raw'] ?? '');
                                if ($desc !== '') { $data['description'] = mb_substr($desc, 0, 10000); }
                            }
                            if ($needsStudio && !empty($det['developers']) && is_array($det['developers'])) {
                                $dev = $det['developers'][0] ?? null;
                                $devName = is_array($dev) ? ($dev['name'] ?? null) : null;
                                if (is_string($devName) && $devName !== '') {
                                    $studio = Studio::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($devName)])->first();
                                    if (!$studio) { try { $studio = Studio::create(['name' => $devName]); } catch (\Throwable $e) { $studio = Studio::query()->where('name', $devName)->first(); } }
                                    if ($studio) { $data['studio_id'] = $studio->id; $data['studio_name'] = $studio->name; }
                                }
                            }
                            if ($needsTags) {
                                $ids = [];
                                $genres = is_array($det['genres'] ?? null) ? $det['genres'] : (is_array($first['genres'] ?? null) ? $first['genres'] : []);
                                foreach ($genres as $g) {
                                    $gname = is_array($g) ? ($g['name'] ?? null) : null;
                                    if (!is_string($gname) || $gname === '') continue;
                                    // Ignore numeric-only tags (e.g., "36")
                                    $trim = trim($gname);
                                    if ($trim !== '' && preg_match('/^\d+$/', $trim)) { continue; }
                                    $existing = Tag::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($gname)])->first();
                                    if (!$existing) { $slug = Str::slug($gname); try { $existing = Tag::create(['name' => $gname, 'slug' => $slug]); } catch (\Throwable $e) { $existing = Tag::query()->where('slug', $slug)->first(); } }
                                    if ($existing) { $ids[] = $existing->id; }
                                }
                                if (!empty($ids)) { $data['tag_ids'] = array_values(array_unique($ids)); }
                            }
                            if ($needsPlatforms) {
                                $platIds = [];
                                $platReleases = (array) ($data['platform_releases'] ?? []);
                                $plats = is_array($det['platforms'] ?? null) ? $det['platforms'] : (is_array($first['platforms'] ?? null) ? $first['platforms'] : []);
                                foreach ($plats as $p) {
                                    $pname = null; if (is_array($p)) { $platObj = $p['platform'] ?? null; if (is_array($platObj)) { $pname = $platObj['name'] ?? null; } }
                                    if (!is_string($pname) || $pname === '') continue;
                                    $platform = Platform::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($pname)])->first();
                                    if (!$platform) { try { $platform = Platform::create(['name' => $pname]); } catch (\Throwable $e) { $platform = Platform::query()->where('name', $pname)->first(); } }
                                    if ($platform) { $platIds[] = $platform->id; if (empty($platReleases[$platform->id] ?? null)) { $platReleased = $p['released_at'] ?? ($det['released'] ?? ($first['released'] ?? null)); if ($platReleased) { $platReleases[$platform->id] = $platReleased; } } }
                                }
                                if (!empty($platIds)) { $data['platform_ids'] = array_values(array_unique($platIds)); $data['platform_releases'] = $platReleases; }
                            }
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            // ignore enrichment errors
        }

        return response()->json(['ok' => true, 'data' => $data]);
    }

    public function edit(Game $game)
    {
        $game->load(['studio:id,name', 'tags:id', 'platforms:id', 'images:id,game_id,url,sort_order', 'links:id,game_id,label,url', 'releasedBy:id,name', 'createdBy:id,name']);

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
                'created_by' => $game->created_by,
                'created_by_name' => optional($game->createdBy)->name,
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

        Log::info('ADMIN.GAMES.UPDATE.request', [
            'user_id' => auth()->id(),
            'game_id' => $game->id,
            'keys' => array_keys($data),
            'name' => $data['name'] ?? $game->name,
            'no_enrich' => (bool) $request->boolean('no_enrich'),
        ]);

        // Enriquecimento via RAWG na ediÃ§Ã£o: se metascore nÃ£o informado, tenta buscar
        try {
            $hasMeta = isset($data['metacritic_metascore']) && $data['metacritic_metascore'] !== null && $data['metacritic_metascore'] !== '';
            if ($request->boolean('no_enrich')) { $hasMeta = true; }
            if (!$hasMeta) {
                $apiKey = env('RAWG_API_KEY', '6dd272e717a64ad591eb4ef2889b1572');
                $name = (string) ($data['name'] ?? $game->name ?? '');
                if ($apiKey && $name !== '') {
                    $base = 'https://api.rawg.io/api/games';
                    $resp = Http::timeout(8)->get($base, [
                        'key' => $apiKey,
                        'search' => $name,
                        'search_exact' => true,
                        'page_size' => 1,
                    ]);
                    if (!$resp->ok() || empty($resp['results'])) {
                        $resp = Http::timeout(8)->get($base, [
                            'key' => $apiKey,
                            'search' => $name,
                            'page_size' => 1,
                        ]);
                    }
                    if ($resp->ok() && !empty($resp['results'])) {
                        $first = $resp['results'][0] ?? [];
                        if (isset($first['metacritic']) && $first['metacritic'] !== null) {
                            $data['metacritic_metascore'] = (int) $first['metacritic'];
                        }
                        $rating = $first['rating'] ?? null;
                        if ((!isset($data['metacritic_user_score']) || $data['metacritic_user_score'] === null || $data['metacritic_user_score'] === '') && $rating !== null) {
                            $score10 = round(((float) $rating) * 2, 2);
                            $data['metacritic_user_score'] = $score10;
                        }

                        // 1) Capa: se vazio, usa background_image
                        if (empty($data['cover_url'] ?? null)) {
                            $bg = $first['background_image'] ?? null;
                            if (is_string($bg) && $bg !== '') {
                                $data['cover_url'] = $bg;
                            }
                        }

                        // 2) Datas de lancamento por plataforma: preencher vazias com 'released' global
                        $released = $first['released'] ?? null; // YYYY-MM-DD
                        if ($released) {
                            $platformIds = (array) ($data['platform_ids'] ?? []);
                            if (!empty($platformIds)) {
                                $data['platform_releases'] = (array) ($data['platform_releases'] ?? []);
                                foreach ($platformIds as $pid) {
                                    if (empty($data['platform_releases'][$pid] ?? null)) {
                                        $data['platform_releases'][$pid] = $released;
                                    }
                                }
                            }
                        }

                        // 3) Se studio/tags/plataformas/descricao faltam, buscar detalhes do jogo
                        $needsDescription = empty(trim((string) ($data['description'] ?? '')));
                        $needsStudio = empty($data['studio_id'] ?? null);
                        $needsTags = empty($data['tag_ids'] ?? []) || count((array) $data['tag_ids']) === 0;
                        $needsPlatforms = empty($data['platform_ids'] ?? []) || count((array) $data['platform_ids']) === 0;

                        if (($needsDescription || $needsStudio || $needsTags || $needsPlatforms) && !empty($first['id'])) {
                            $detail = Http::timeout(8)->get($base . '/' . $first['id'], [ 'key' => $apiKey ]);
                            if ($detail->ok()) {
                                $det = $detail->json();

                                // Descricao (description_raw)
                                if ($needsDescription) {
                                    $desc = (string) ($det['description_raw'] ?? '');
                                    if ($desc !== '') {
                                        $data['description'] = mb_substr($desc, 0, 10000);
                                    }
                                }

                                // Studio (developers[0].name)
                                if ($needsStudio && !empty($det['developers']) && is_array($det['developers'])) {
                                    $dev = $det['developers'][0] ?? null;
                                    $devName = is_array($dev) ? ($dev['name'] ?? null) : null;
                                    if (is_string($devName) && $devName !== '') {
                                        $studio = Studio::query()
                                            ->whereRaw('LOWER(name) = ?', [mb_strtolower($devName)])
                                            ->first();
                                        if (!$studio) {
                                            try {
                                                $studio = Studio::create(['name' => $devName]);
                                            } catch (\Throwable $e) {
                                                $studio = Studio::query()->where('name', $devName)->first();
                                            }
                                        }
                                        if ($studio) {
                                            $data['studio_id'] = $studio->id;
                                            $data['studio_name'] = $studio->name;
                                        }
                                    }
                                }

                                // Tags (genres[].name)
                                if ($needsTags) {
                                    $ids = [];
                                    $genres = is_array($det['genres'] ?? null) ? $det['genres'] : (is_array($first['genres'] ?? null) ? $first['genres'] : []);
                                    foreach ($genres as $g) {
                                        $gname = is_array($g) ? ($g['name'] ?? null) : null;
                                        if (!is_string($gname) || $gname === '') continue;
                                        $t = trim($gname);
                                        if ($t !== '' && preg_match('/^\d+$/', $t)) continue;
                                        $existing = Tag::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($gname)])->first();
                                        if (!$existing) {
                                            $slug = Str::slug($gname);
                                            try {
                                                $existing = Tag::create(['name' => $gname, 'slug' => $slug]);
                                            } catch (\Throwable $e) {
                                                $existing = Tag::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($gname)])->orWhere('slug', $slug)->first();
                                            }
                                        }
                                        if ($existing) { $ids[] = $existing->id; }
                                    }
                                    if (!empty($ids)) {
                                        $data['tag_ids'] = array_values(array_unique($ids));
                                    }
                                }

                                // Plataformas (platforms[].platform.name) e datas se faltarem
                                if ($needsPlatforms) {
                                    $platIds = [];
                                    $platReleases = (array) ($data['platform_releases'] ?? []);
                                    $plats = is_array($det['platforms'] ?? null) ? $det['platforms'] : (is_array($first['platforms'] ?? null) ? $first['platforms'] : []);
                                    foreach ($plats as $p) {
                                        $pname = null;
                                        if (is_array($p)) {
                                            $platObj = $p['platform'] ?? null;
                                            if (is_array($platObj)) { $pname = $platObj['name'] ?? null; }
                                        }
                                    if (!is_string($pname) || $pname === '') continue;
                                    // Ignore numeric-only platform names
                                    $ptrim = trim($pname);
                                    if ($ptrim !== '' && preg_match('/^\d+$/', $ptrim)) { continue; }
                                    $platform = Platform::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($pname)])->first();
                                    if (!$platform) {
                                        try {
                                            $platform = Platform::create(['name' => $pname]);
                                        } catch (\Throwable $e) {
                                            $platform = Platform::query()->where('name', $pname)->first();
                                        }
                                    }
                                        if ($platform) {
                                            $platIds[] = $platform->id;
                                            if (empty($platReleases[$platform->id] ?? null)) {
                                                $platReleased = $p['released_at'] ?? ($det['released'] ?? $released ?? null);
                                                if ($platReleased) { $platReleases[$platform->id] = $platReleased; }
                                            }
                                        }
                                    }
                                    if (!empty($platIds)) {
                                        $data['platform_ids'] = array_values(array_unique($platIds));
                                        $data['platform_releases'] = $platReleases;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (\Throwable $e) {
            // ignora enriquecimento em caso de falha
        }

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

            return redirect()->route('admin.games.edit', $game)->with('success', 'Jogo atualizado com sucesso.');
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
    
    // (Removido) suporte a traduÃ§Ã£o automÃ¡tica
}
