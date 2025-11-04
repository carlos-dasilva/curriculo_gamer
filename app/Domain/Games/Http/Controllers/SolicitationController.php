<?php

namespace App\Domain\Games\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use App\Models\Game;
use App\Models\Studio;
use App\Models\Platform;
use App\Models\Tag;
use App\Models\GameImage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use App\Domain\Games\Http\Requests\StoreSolicitationRequest;
use App\Domain\Games\Http\Requests\UpdateSolicitationRequest;

class SolicitationController extends Controller
{
    protected function isModeratorOrAdmin(): bool
    {
        if (!auth()->check()) return false;
        $raw = is_object(auth()->user()->role) ? auth()->user()->role->value : (auth()->user()->role ?? 'co.mum');
        $val = strtolower(trim((string) $raw));
        return in_array($val, ['moderador','admin'], true);
    }

    protected function ensureCanManage(Game $game): void
    {
        $uid = auth()->id();
        $isMod = $this->isModeratorOrAdmin();
        if (!($game->status === 'avaliacao' && ($isMod || $game->created_by === $uid))) {
            abort(403, 'Acesso negado.');
        }
    }

    /**
     * Permite visualizar/abrir a tela de edição quando:
     * - Moderador/Admin; ou
     * - Criador da solicitação (mesmo se já liberado).
     * A atualização (PUT) continua restrita por ensureCanManage.
     */
    protected function ensureCanView(Game $game): void
    {
        if (!auth()->check()) {
            abort(403, 'Acesso negado.');
        }
        $uid = (int) auth()->id();
        $isMod = $this->isModeratorOrAdmin();
        if (!($isMod || (int) $game->created_by === $uid)) {
            abort(403, 'Acesso negado.');
        }
    }

    public function create()
    {
        return Inertia::render('Solicitations/Create', [
            'studios'   => Studio::query()->select(['id','name'])->orderBy('name')->get(),
            'platforms' => Platform::query()->select(['id','name'])->orderBy('name')->get(),
            'tags'      => Tag::query()->select(['id','name','slug'])->orderBy('name')->get(),
        ]);
    }

    public function store(StoreSolicitationRequest $request): RedirectResponse
    {
        $data = $request->validated();

        Log::info('OPTIONS.SOLICITATIONS.STORE.request', [
            'user_id' => auth()->id(),
            'keys' => array_keys($data),
            'name' => $data['name'] ?? null,
        ]);

        // Enriquecimento via RAWG semelhante ao Admin/Games
        try {
            $hasMeta = isset($data['metacritic_metascore']) && $data['metacritic_metascore'] !== null && $data['metacritic_metascore'] !== '';
            if (!$hasMeta) {
            if ($request->boolean('no_enrich')) { $hasMeta = true; }
                $apiKey = env('RAWG_API_KEY', '6dd272e717a64ad591eb4ef2889b1572');
                $name = (string) ($data['name'] ?? '');
                if ($apiKey && $name !== '') {
                    $base = 'https://api.rawg.io/api/games';
                    $resp = Http::timeout(8)->get($base, [
                        'key' => $apiKey,
                        'search' => $name,
                        'search_exact' => true,
                        'page_size' => 1,
                    ]);
                    if (!$resp->ok() || empty($resp['results'])) {
                        // fallback mais amplo
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
                        // RAWG nao possui metacritic userscore direto; usa rating (0..5) como aproximacao
                        $rating = $first['rating'] ?? null;
                        if ((!isset($data['metacritic_user_score']) || $data['metacritic_user_score'] === null || $data['metacritic_user_score'] === '') && $rating !== null) {
                            $score10 = round(((float) $rating) * 2, 2); // escala 0..5 -> 0..10
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
                                        if ($studio) { $data['studio_id'] = $studio->id; }
                                    }
                                }

                                // Tags por generos
                                if ($needsTags) {
                                    $ids = [];
                                    $genres = is_array($det['genres'] ?? null) ? $det['genres'] : (is_array($first['genres'] ?? null) ? $first['genres'] : []);
                                    foreach ($genres as $g) {
                                        $gname = null;
                                        if (is_array($g)) { $gname = $g['name'] ?? null; }
                                        if (!is_string($gname) || $gname === '') continue;
                                        $t = trim($gname);
                                        if ($t !== '' && preg_match('/^\d+$/', $t)) { continue; }
                                        $existing = Tag::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($gname)])->first();
                                        if (!$existing) {
                                            $slug = Str::slug($gname);
                                            try {
                                                $existing = Tag::create(['name' => $gname, 'slug' => $slug]);
                                            } catch (\Throwable $e) {
                                                // slug/name pode existir; tenta recuperar
                                                $existing = Tag::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($gname)])->orWhere('slug', $slug)->first();
                                            }
                                        }
                                        if ($existing) { $ids[] = $existing->id; }
                                    }
                                    if (!empty($ids)) {
                                        $data['tag_ids'] = array_values(array_unique($ids));
                                    }
                                }

                                // Plataformas e datas se faltarem
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
                                        $tp = trim($pname);
                                        if ($tp !== '' && preg_match('/^\d+$/', $tp)) { continue; }
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

        return DB::transaction(function () use ($data) {
            // Guarda de duplicidade (studio_id + name)
            $__studioId = $data['studio_id'] ?? null;
            $__name = trim((string) ($data['name'] ?? ''));
            if ($__name !== '') {
                $__q = \App\Models\Game::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($__name)]);
                if ($__studioId === null) { $__q->whereNull('studio_id'); } else { $__q->where('studio_id', $__studioId); }
                if ($__q->exists()) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'name' => 'Já existe um jogo com este nome para o estúdio selecionado.',
                    ]);
                }
            }
            try {
                $game = Game::create([
                'studio_id' => $data['studio_id'] ?? null,
                'name' => $data['name'],
                'cover_url' => $data['cover_url'] ?? null,
                'status' => 'avaliacao',
                'released_by' => null,
                'created_by' => auth()->id(),
                'age_rating' => $data['age_rating'] ?? null,
                'description' => $data['description'] ?? null,
                'metacritic_metascore' => $data['metacritic_metascore'] ?? null,
                'metacritic_user_score' => $data['metacritic_user_score'] ?? null,
                'hours_to_finish' => $data['hours_to_finish'] ?? null,
                'ptbr_subtitled' => (bool) ($data['ptbr_subtitled'] ?? false),
                'ptbr_dubbed' => (bool) ($data['ptbr_dubbed'] ?? false),
                ]);
            } catch (\Illuminate\Database\QueryException $e) {
                if ((int) ($e->getCode()) === 23000 || str_contains(strtolower($e->getMessage()), 'unique')) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'name' => 'Já existe um jogo com este nome para o estúdio selecionado.',
                    ]);
                }
                throw $e;
            }

            $game->tags()->sync($data['tag_ids'] ?? []);

            $pivot = [];
            foreach (($data['platform_ids'] ?? []) as $pid) {
                $pivot[$pid] = [
                    'release_date' => $data['platform_releases'][$pid] ?? null,
                ];
            }
            if (!empty($pivot)) {
                $game->platforms()->sync($pivot);
            }

            foreach (($data['gallery_urls'] ?? []) as $idx => $url) {
                GameImage::create([
                    'game_id' => $game->id,
                    'url' => $url,
                    'sort_order' => $idx,
                ]);
            }

            // Links externos nÃ£o sÃ£o permitidos em solicitaÃ§Ãµes

            return redirect()->route('options.index')->with('success', 'SolicitaÃ§Ã£o criada com sucesso.');
        });
    }

    public function edit(Game $game)
    {
        // Bloqueia a tela se o jogo não estiver em avaliação
        if ($game->status !== 'avaliacao') {
            return redirect()->route('options.index', ['tab' => 'solicitacoes'])
                ->with('error', 'Este jogo não está em avaliação.');
        }
        // Libera acesso ao criador (usuário comum) para visualizar/abrir a tela
        $this->ensureCanView($game);

        $game->load(['studio:id,name', 'tags:id', 'platforms:id', 'images:id,game_id,url,sort_order']);

        return Inertia::render('Solicitations/Edit', [
            'game' => [
                'id' => $game->id,
                'name' => $game->name,
                'studio_id' => $game->studio_id,
                'cover_url' => $game->cover_url,
                'age_rating' => $game->age_rating,
                'status' => $game->status,
                'hours_to_finish' => $game->hours_to_finish,
                'description' => $game->description,
                'ptbr_subtitled' => (bool) $game->ptbr_subtitled,
                'ptbr_dubbed' => (bool) $game->ptbr_dubbed,
                'tag_ids' => $game->tags->pluck('id'),
                'platform_ids' => $game->platforms->pluck('id'),
                'platform_releases' => $game->platforms->mapWithKeys(fn($p) => [$p->id => optional($p->pivot)->release_date])->all(),
                'gallery_urls' => $game->images->sortBy('sort_order')->pluck('url')->values(),
            ],
            'studios'   => Studio::query()->select(['id','name'])->orderBy('name')->get(),
            'platforms' => Platform::query()->select(['id','name'])->orderBy('name')->get(),
            'tags'      => Tag::query()->select(['id','name','slug'])->orderBy('name')->get(),
        ]);
    }

    public function update(UpdateSolicitationRequest $request, Game $game): RedirectResponse
    {
        $this->ensureCanManage($game);
        $data = $request->validated();

        Log::info('OPTIONS.SOLICITATIONS.UPDATE.request', [
            'user_id' => auth()->id(),
            'game_id' => $game->id,
            'keys' => array_keys($data),
            'name' => $data['name'] ?? $game->name,
            'no_enrich' => (bool) $request->boolean('no_enrich'),
        ]);

        // Enriquecimento RAWG tambÃ©m na atualizaÃ§Ã£o
        try {
            $hasMeta = isset($data['metacritic_metascore']) && $data['metacritic_metascore'] !== null && $data['metacritic_metascore'] !== '';
            if (!$hasMeta) {
            if ($request->boolean('no_enrich')) { $hasMeta = true; }
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

                        if (empty($data['cover_url'] ?? null)) {
                            $bg = $first['background_image'] ?? null;
                            if (is_string($bg) && $bg !== '') {
                                $data['cover_url'] = $bg;
                            }
                        }

                        $released = $first['released'] ?? null;
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
                                        if (!$studio) {
                                            try { $studio = Studio::create(['name' => $devName]); }
                                            catch (\Throwable $e) { $studio = Studio::query()->where('name', $devName)->first(); }
                                        }
                                        if ($studio) { $data['studio_id'] = $studio->id; }
                                    }
                                }
                                if ($needsTags) {
                                    $ids = [];
                                    $genres = is_array($det['genres'] ?? null) ? $det['genres'] : (is_array($first['genres'] ?? null) ? $first['genres'] : []);
                                    foreach ($genres as $g) {
                                        $gname = is_array($g) ? ($g['name'] ?? null) : null;
                                        if (!is_string($gname) || $gname === '') continue;
                                        $t = trim($gname);
                                        if ($t !== '' && preg_match('/^\d+$/', $t)) { continue; }
                                        $existing = Tag::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($gname)])->first();
                                        if (!$existing) {
                                            $slug = Str::slug($gname);
                                            try { $existing = Tag::create(['name' => $gname, 'slug' => $slug]); }
                                            catch (\Throwable $e) { $existing = Tag::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($gname)])->orWhere('slug', $slug)->first(); }
                                        }
                                        if ($existing) { $ids[] = $existing->id; }
                                    }
                                    if (!empty($ids)) { $data['tag_ids'] = array_values(array_unique($ids)); }
                                }
                                if ($needsPlatforms) {
                                    $platIds = [];
                                    $platReleases = (array) ($data['platform_releases'] ?? []);
                                    $plats = is_array($det['platforms'] ?? null) ? $det['platforms'] : (is_array($first['platforms'] ?? null) ? $first['platforms'] : []);
                                    foreach ($plats as $p) {
                                        $pname = null;
                                        if (is_array($p)) { $pname = is_array($p['platform'] ?? null) ? ($p['platform']['name'] ?? null) : null; }
                                        if (!is_string($pname) || $pname === '') continue;
                                        $tp = trim($pname);
                                        if ($tp !== '' && preg_match('/^\d+$/', $tp)) { continue; }
                                        $platform = Platform::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($pname)])->first();
                                        if (!$platform) {
                                            try { $platform = Platform::create(['name' => $pname]); }
                                            catch (\Throwable $e) { $platform = Platform::query()->where('name', $pname)->first(); }
                                        }
                                        if ($platform) {
                                            $platIds[] = $platform->id;
                                            if (empty($platReleases[$platform->id] ?? null)) {
                                                $platReleased = $p['released_at'] ?? ($det['released'] ?? ($first['released'] ?? null));
                                                if ($platReleased) { $platReleases[$platform->id] = $platReleased; }
                                            }
                                        }
                                    }
                                    if (!empty($platIds)) { $data['platform_ids'] = array_values(array_unique($platIds)); $data['platform_releases'] = $platReleases; }
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
            // Guarda de duplicidade na atualização (studio_id + name, ignorando o próprio registro)
            $__studioId = $data['studio_id'] ?? null;
            $__name = trim((string) ($data['name'] ?? ''));
            if ($__name !== '') {
                $__q = \App\Models\Game::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($__name)]);
                if ($__studioId === null) { $__q->whereNull('studio_id'); } else { $__q->where('studio_id', $__studioId); }
                $__q->where('id', '!=', $game->id);
                if ($__q->exists()) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'name' => 'Já existe um jogo com este nome para o estúdio selecionado.',
                    ]);
                }
            }
            $game->update([
                'studio_id' => $data['studio_id'] ?? null,
                'name' => $data['name'],
                'cover_url' => $data['cover_url'] ?? null,
                'age_rating' => $data['age_rating'] ?? null,
                'description' => $data['description'] ?? null,
                'metacritic_metascore' => $data['metacritic_metascore'] ?? $game->metacritic_metascore,
                'metacritic_user_score' => $data['metacritic_user_score'] ?? $game->metacritic_user_score,
                'hours_to_finish' => $data['hours_to_finish'] ?? $game->hours_to_finish,
                'ptbr_subtitled' => (bool) ($data['ptbr_subtitled'] ?? false),
                'ptbr_dubbed' => (bool) ($data['ptbr_dubbed'] ?? false),
            ]);

            $game->tags()->sync($data['tag_ids'] ?? []);

            $pivot = [];
            foreach (($data['platform_ids'] ?? []) as $pid) {
                $pivot[$pid] = [
                    'release_date' => $data['platform_releases'][$pid] ?? null,
                ];
            }
            $game->platforms()->sync($pivot);

            $game->images()->delete();
            foreach (($data['gallery_urls'] ?? []) as $idx => $url) {
                GameImage::create([
                    'game_id' => $game->id,
                    'url' => $url,
                    'sort_order' => $idx,
                ]);
            }

            // Links externos nÃ£o sÃ£o permitidos em solicitaÃ§Ãµes

            return redirect()->route('options.index')->with('success', 'SolicitaÃ§Ã£o atualizada com sucesso.');
        });
    }

    public function destroy(Request $request, Game $game): RedirectResponse
    {
        $this->ensureCanManage($game);

        DB::transaction(function () use ($game) {
            $game->tags()->detach();
            $game->platforms()->detach();
            $game->images()->delete();
            $game->links()->delete();
            $game->delete();
        });

        return redirect()->route('options.index')->with('success', 'SolicitaÃ§Ã£o removida.');
    }

    public function release(Request $request, Game $game): RedirectResponse
    {
        // Somente moderador/admin pode liberar
        if (!$this->isModeratorOrAdmin()) {
            abort(403, 'Acesso negado.');
        }

        if ($game->status !== 'avaliacao') {
            return redirect()->back()->with('error', 'Este jogo nÃ£o estÃ¡ em avaliaÃ§Ã£o.');
        }

        DB::transaction(function () use ($game) {
            $game->update([
                'status' => 'liberado',
                'released_by' => auth()->id(),
            ]);
        });

        // Após liberar, voltar para /opcoes com a aba "Solicitações" ativa
        return redirect()->route('options.index', ['tab' => 'solicitacoes'])->with('success', 'Jogo liberado com sucesso.');
    }

    /**
     * Captura informações via RAWG e retorna dados enriquecidos (sem persistir).
     */
    public function capture(Request $request): \Illuminate\Http\JsonResponse
    {
        $gc = new GameController();
        return $gc->capture($request);
    }
}
