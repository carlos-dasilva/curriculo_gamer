<?php

namespace App\Domain\Games\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Game;
use App\Models\User;

class CurriculumController extends Controller
{
    /**
     * Exibe a pÃ¡gina "Meu CurrÃ­culo" com resumo por status e por plataforma.
     */
    public function index(Request $request)
    {
        if (!auth()->check()) {
            return redirect()->route('home');
        }

        $userId = (int) auth()->id();

        $allowedStatuses = ['cem_por_cento','finalizei','joguei','quero_jogar'];
        $status = (string) $request->input('status', 'cem_por_cento');
        if (!in_array($status, $allowedStatuses, true)) {
            $status = 'cem_por_cento';
        }

        $mode = (string) $request->input('mode', 'all'); // 'all' | 'platform'
        if (!in_array($mode, ['all','platform'], true)) {
            $mode = 'all';
        }

        // Resumo por jogo com precedÃªncia: 100% > Finalizei > Joguei > Quero Jogar
        $rankCase = "CASE ugps.status WHEN 'quero_jogar' THEN 1 WHEN 'joguei' THEN 2 WHEN 'finalizei' THEN 3 WHEN 'cem_por_cento' THEN 4 END";
        $perGame = DB::table('user_game_platform_statuses as ugps')
            ->join('games', 'games.id', '=', 'ugps.game_id')
            ->where('ugps.user_id', $userId)
            ->where('games.status', 'liberado')
            ->whereIn('ugps.status', $allowedStatuses)
            ->groupBy('ugps.game_id')
            ->select('ugps.game_id', DB::raw("MAX($rankCase) as max_rank"));

        $rankCounts = DB::query()->fromSub($perGame, 'g')
            ->select('max_rank', DB::raw('COUNT(*) as total'))
            ->groupBy('max_rank')
            ->pluck('total', 'max_rank');

        $summary = [
            'cem_por_cento' => (int) ($rankCounts[4] ?? 0),
            'finalizei' => (int) ($rankCounts[3] ?? 0),
            'joguei' => (int) ($rankCounts[2] ?? 0),
            'quero_jogar' => (int) ($rankCounts[1] ?? 0),
        ];

        // Contagens por plataforma
        $platformRows = DB::table('user_game_platform_statuses as ugps')
            ->join('games', 'games.id', '=', 'ugps.game_id')
            ->join('platforms as p', 'p.id', '=', 'ugps.platform_id')
            ->where('ugps.user_id', $userId)
            ->where('games.status', 'liberado')
            ->whereIn('ugps.status', $allowedStatuses)
            ->select('p.id as platform_id', 'p.name as platform_name', 'ugps.status', DB::raw('COUNT(DISTINCT ugps.game_id) as total'))
            ->groupBy('p.id', 'p.name', 'ugps.status')
            ->get();

        $byPlatformMap = [];
        foreach ($platformRows as $r) {
            $pid = (int) $r->platform_id;
            if (!isset($byPlatformMap[$pid])) {
                $byPlatformMap[$pid] = [
                    'platform' => ['id' => $pid, 'name' => (string) $r->platform_name],
                    'counts' => [
                        'cem_por_cento' => 0,
                        'finalizei' => 0,
                        'joguei' => 0,
                        'quero_jogar' => 0,
                    ],
                ];
            }
            $st = (string) $r->status;
            if (isset($byPlatformMap[$pid]['counts'][$st])) {
                $byPlatformMap[$pid]['counts'][$st] = (int) $r->total;
            }
        }

        $byPlatform = array_values($byPlatformMap);
        // OrdenaÃ§Ã£o: 100% > Finalizei > Joguei > Quero Jogar
        usort($byPlatform, function ($a, $b) {
            $orderKeys = ['cem_por_cento','finalizei','joguei','quero_jogar'];
            foreach ($orderKeys as $k) {
                $diff = ($b['counts'][$k] ?? 0) <=> ($a['counts'][$k] ?? 0);
                if ($diff !== 0) return $diff;
            }
            return strcmp($a['platform']['name'], $b['platform']['name']);
        });

        // Plataforma selecionada (modo plataforma)
        $platformId = $request->integer('platform') ?: null;
        if ($mode === 'platform') {
            $platformIds = array_map(fn ($g) => (int) $g['platform']['id'], $byPlatform);
            if (!$platformId || !in_array($platformId, $platformIds, true)) {
                $platformId = $byPlatform[0]['platform']['id'] ?? null;
            }
        } else {
            $platformId = null;
        }

        // Lista de jogos conforme filtro (exclui jogos com status superior em outra plataforma)
        $q = trim((string) request('q', ''));
        $sub = request()->boolean('sub');
        $dub = request()->boolean('dub');

        $gamesQuery = Game::query()
            ->select(['id','name','cover_url','description','overall_score','metacritic_metascore','ptbr_subtitled','ptbr_dubbed','created_at'])
            ->where('status', 'liberado')
            ->with([
                'studio:id,name',
                'platforms:id,name',
                'tags:id,name,slug',
            ])
            ->when($q !== '', function ($query) use ($q) {
                $like = "%{$q}%";
                $query->where(function ($w) use ($like) {
                    $w->where('name','like',$like)
                      ->orWhereHas('studio', fn($s) => $s->where('name','like',$like))
                      ->orWhereHas('platforms', fn($p) => $p->where('name','like',$like))
                      ->orWhereHas('tags', fn($t) => $t->where('name','like',$like)->orWhere('slug','like',$like));
                });
            })
            ->when($sub, fn($q2) => $q2->where('ptbr_subtitled', true))
            ->when($dub, fn($q2) => $q2->where('ptbr_dubbed', true))
            // 1) Nota geral > 2) Metascore > 3) User Score (do usuÃ¡rio logado) > 4) Ãšltimos cadastrados > 5) Nome
            ->orderByDesc('overall_score')
            ->orderByDesc('metacritic_metascore')
            ->whereExists(function ($q) use ($userId, $status, $platformId) {
                $q->select(DB::raw(1))
                    ->from('user_game_platform_statuses as ug')
                    ->whereColumn('ug.game_id', 'games.id')
                    ->where('ug.user_id', $userId)
                    ->where('ug.status', $status);
                if ($platformId) {
                    $q->where('ug.platform_id', (int) $platformId);
                }
            })
            ->whereNotExists(function ($q) use ($userId, $status) {
                $q->select(DB::raw(1))
                    ->from('user_game_platform_statuses as ug2')
                    ->whereColumn('ug2.game_id', 'games.id')
                    ->where('ug2.user_id', $userId)
                    ->whereIn('ug2.status', match ($status) {
                        'cem_por_cento' => ['__none__'], // nunca exclui
                        'finalizei' => ['cem_por_cento'],
                        'joguei' => ['cem_por_cento','finalizei'],
                        'quero_jogar' => ['cem_por_cento','finalizei','joguei'],
                        default => ['__none__'],
                    });
            })
            ->addSelect([
                'user_score' => DB::table('user_game_infos')
                    ->select('score')
                    ->whereColumn('user_game_infos.game_id', 'games.id')
                    ->where('user_id', $userId)
                    ->limit(1)
            ])
            ->orderByDesc('user_score')
            ->orderByDesc('created_at')
            ->orderBy('name');

        $games = $gamesQuery->paginate(30)->withQueryString();

        return Inertia::render('Curriculum/Index', [
            'mode' => $mode,
            'summary' => $summary,
            'byPlatform' => $byPlatform,
            'selected' => [
                'mode' => $mode,
                'status' => $status,
                'platformId' => $platformId,
            ],
            'games' => $games,
            'filters' => [ 'q' => $q, 'sub' => $sub, 'dub' => $dub ],
            'subject' => [
                'id' => $userId,
                'name' => auth()->user()->name ?? 'UsuÃ¡rio',
                'isMe' => true,
                'isFollowed' => false,
            ],
        ]);
    }

    /**
     * Exibe o currÃ­culo de outro usuÃ¡rio (auth obrigatÃ³rio).
     */
    public function show(Request $request, int $user)
    {
        $userModel = User::query()->find((int) $user);
        if (!$userModel) {
            return redirect()->route('home');
        }

        $userId = (int) $userModel->id;

        $allowedStatuses = ['cem_por_cento','finalizei','joguei','quero_jogar'];
        $status = (string) $request->input('status', 'cem_por_cento');
        if (!in_array($status, $allowedStatuses, true)) {
            $status = 'cem_por_cento';
        }

        $mode = (string) $request->input('mode', 'all'); // 'all' | 'platform'
        if (!in_array($mode, ['all','platform'], true)) {
            $mode = 'all';
        }

        $rankCase = "CASE ugps.status WHEN 'quero_jogar' THEN 1 WHEN 'joguei' THEN 2 WHEN 'finalizei' THEN 3 WHEN 'cem_por_cento' THEN 4 END";
        $perGame = DB::table('user_game_platform_statuses as ugps')
            ->join('games', 'games.id', '=', 'ugps.game_id')
            ->where('ugps.user_id', $userId)
            ->where('games.status', 'liberado')
            ->whereIn('ugps.status', $allowedStatuses)
            ->groupBy('ugps.game_id')
            ->select('ugps.game_id', DB::raw("MAX($rankCase) as max_rank"));

        $rankCounts = DB::query()->fromSub($perGame, 'g')
            ->select('max_rank', DB::raw('COUNT(*) as total'))
            ->groupBy('max_rank')
            ->pluck('total', 'max_rank');

        $summary = [
            'cem_por_cento' => (int) ($rankCounts[4] ?? 0),
            'finalizei' => (int) ($rankCounts[3] ?? 0),
            'joguei' => (int) ($rankCounts[2] ?? 0),
            'quero_jogar' => (int) ($rankCounts[1] ?? 0),
        ];

        $platformRows = DB::table('user_game_platform_statuses as ugps')
            ->join('games', 'games.id', '=', 'ugps.game_id')
            ->join('platforms as p', 'p.id', '=', 'ugps.platform_id')
            ->where('ugps.user_id', $userId)
            ->where('games.status', 'liberado')
            ->whereIn('ugps.status', $allowedStatuses)
            ->select('p.id as platform_id', 'p.name as platform_name', 'ugps.status', DB::raw('COUNT(DISTINCT ugps.game_id) as total'))
            ->groupBy('p.id', 'p.name', 'ugps.status')
            ->get();

        $byPlatformMap = [];
        foreach ($platformRows as $r) {
            $pid = (int) $r->platform_id;
            if (!isset($byPlatformMap[$pid])) {
                $byPlatformMap[$pid] = [
                    'platform' => ['id' => $pid, 'name' => (string) $r->platform_name],
                    'counts' => [
                        'cem_por_cento' => 0,
                        'finalizei' => 0,
                        'joguei' => 0,
                        'quero_jogar' => 0,
                    ],
                ];
            }
            $st = (string) $r->status;
            if (isset($byPlatformMap[$pid]['counts'][$st])) {
                $byPlatformMap[$pid]['counts'][$st] = (int) $r->total;
            }
        }

        $byPlatform = array_values($byPlatformMap);
        usort($byPlatform, function ($a, $b) {
            $orderKeys = ['cem_por_cento','finalizei','joguei','quero_jogar'];
            foreach ($orderKeys as $k) {
                $diff = ($b['counts'][$k] ?? 0) <=> ($a['counts'][$k] ?? 0);
                if ($diff !== 0) return $diff;
            }
            return strcmp($a['platform']['name'], $b['platform']['name']);
        });

        $platformId = $request->integer('platform') ?: null;
        if ($mode === 'platform') {
            $platformIds = array_map(fn ($g) => (int) $g['platform']['id'], $byPlatform);
            if (!$platformId || !in_array($platformId, $platformIds, true)) {
                $platformId = $byPlatform[0]['platform']['id'] ?? null;
            }
        } else {
            $platformId = null;
        }

        // Filtros de busca/idioma
        $q = trim((string) request('q', ''));
        $sub = request()->boolean('sub');
        $dub = request()->boolean('dub');

        $gamesQuery = Game::query()
            ->select(['id','name','cover_url','description','overall_score','metacritic_metascore','ptbr_subtitled','ptbr_dubbed','created_at'])
            ->where('status', 'liberado')
            ->with([
                'studio:id,name',
                'platforms:id,name',
                'tags:id,name,slug',
            ])
            ->when($q !== '', function ($query) use ($q) {
                $like = "%{$q}%";
                $query->where(function ($w) use ($like) {
                    $w->where('name','like',$like)
                      ->orWhereHas('studio', fn($s) => $s->where('name','like',$like))
                      ->orWhereHas('platforms', fn($p) => $p->where('name','like',$like))
                      ->orWhereHas('tags', fn($t) => $t->where('name','like',$like)->orWhere('slug','like',$like));
                });
            })
            ->when($sub, fn($q2) => $q2->where('ptbr_subtitled', true))
            ->when($dub, fn($q2) => $q2->where('ptbr_dubbed', true))
            ->orderByDesc('overall_score')
            ->orderByDesc('metacritic_metascore')
            ->whereExists(function ($q) use ($userId, $status, $platformId) {
                $q->select(DB::raw(1))
                    ->from('user_game_platform_statuses as ug')
                    ->whereColumn('ug.game_id', 'games.id')
                    ->where('ug.user_id', $userId)
                    ->where('ug.status', $status);
                if ($platformId) {
                    $q->where('ug.platform_id', (int) $platformId);
                }
            })
            ->whereNotExists(function ($q) use ($userId, $status) {
                $q->select(DB::raw(1))
                    ->from('user_game_platform_statuses as ug2')
                    ->whereColumn('ug2.game_id', 'games.id')
                    ->where('ug2.user_id', $userId)
                    ->whereIn('ug2.status', match ($status) {
                        'cem_por_cento' => ['__none__'],
                        'finalizei' => ['cem_por_cento'],
                        'joguei' => ['cem_por_cento','finalizei'],
                        'quero_jogar' => ['cem_por_cento','finalizei','joguei'],
                        default => ['__none__'],
                    });
            })
            ->addSelect([
                'user_score' => DB::table('user_game_infos')
                    ->select('score')
                    ->whereColumn('user_game_infos.game_id', 'games.id')
                    ->where('user_id', $userId)
                    ->limit(1)
            ])
            ->orderByDesc('user_score')
            ->orderByDesc('created_at')
            ->orderBy('name');

        $games = $gamesQuery->paginate(30)->withQueryString();

        $isFollowed = false;
        if (auth()->check() && (int) auth()->id() !== (int) $userModel->id) {
            try {
                $isFollowed = DB::table('user_follows')
                    ->where('follower_id', auth()->id())
                    ->where('followed_id', $userModel->id)
                    ->exists();
            } catch (\Throwable $e) {
                $isFollowed = false;
            }
        }

        return Inertia::render('Curriculum/Index', [
            'mode' => $mode,
            'summary' => $summary,
            'byPlatform' => $byPlatform,
            'selected' => [
                'mode' => $mode,
                'status' => $status,
                'platformId' => $platformId,
            ],
            'games' => $games,
            'filters' => [ 'q' => $q, 'sub' => $sub, 'dub' => $dub ],
            'subject' => [
                'id' => $userModel->id,
                'name' => $userModel->name,
                'isMe' => (int) $userModel->id === (int) auth()->id(),
                'isFollowed' => $isFollowed,
            ],
        ]);
    }
}

