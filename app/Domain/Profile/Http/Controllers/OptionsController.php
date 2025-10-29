<?php

namespace App\Domain\Profile\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class OptionsController extends Controller
{
    public function index(Request $request)
    {
        if (!auth()->check()) {
            return redirect()->route('home');
        }

        $user = auth()->user();

        // Monta resumo de quem eu sigo (mesma regra do Perfil)
        $followed = DB::table('user_follows as f')
            ->join('users as u', 'u.id', '=', 'f.followed_id')
            ->where('f.follower_id', $user->id)
            ->orderBy('u.name')
            ->get(['u.id','u.name']);

        $followingSummary = [];
        $allowedStatuses = ['cem_por_cento','finalizei','joguei','quero_jogar'];
        if ($followed->count() > 0) {
            $ids = $followed->pluck('id')->all();
            $rows = DB::table('user_game_platform_statuses as ugps')
                ->join('games', 'games.id', '=', 'ugps.game_id')
                ->whereIn('ugps.user_id', $ids)
                ->where('games.status', 'liberado')
                ->whereIn('ugps.status', $allowedStatuses)
                ->select('ugps.user_id','ugps.status', DB::raw('COUNT(DISTINCT ugps.game_id) as total'))
                ->groupBy('ugps.user_id','ugps.status')
                ->get();

            $map = [];
            foreach ($followed as $f) {
                $map[(int) $f->id] = [
                    'id' => (int) $f->id,
                    'name' => (string) $f->name,
                    'counts' => [
                        'cem_por_cento' => 0,
                        'finalizei' => 0,
                        'joguei' => 0,
                        'quero_jogar' => 0,
                    ],
                ];
            }
            foreach ($rows as $r) {
                $uid = (int) $r->user_id;
                $st = (string) $r->status;
                if (isset($map[$uid]['counts'][$st])) {
                    $map[$uid]['counts'][$st] = (int) $r->total;
                }
            }
            $followingSummary = array_values($map);
            usort($followingSummary, function ($a, $b) {
                $order = ['cem_por_cento','finalizei','joguei','quero_jogar'];
                foreach ($order as $k) {
                    $diff = ((int)($b['counts'][$k] ?? 0)) <=> ((int)($a['counts'][$k] ?? 0));
                    if ($diff !== 0) return $diff;
                }
                return strcmp((string)$a['name'], (string)$b['name']);
            });
        }

        // Calcula também o resumo do próprio usuário
        $meCounts = ['cem_por_cento'=>0,'finalizei'=>0,'joguei'=>0,'quero_jogar'=>0];
        $meRows = DB::table('user_game_platform_statuses as ugps')
            ->join('games', 'games.id', '=', 'ugps.game_id')
            ->where('ugps.user_id', $user->id)
            ->where('games.status', 'liberado')
            ->whereIn('ugps.status', $allowedStatuses)
            ->select('ugps.status', DB::raw('COUNT(DISTINCT ugps.game_id) as total'))
            ->groupBy('ugps.status')
            ->get();
        foreach ($meRows as $r) {
            $st = (string) $r->status;
            if (isset($meCounts[$st])) $meCounts[$st] = (int) $r->total;
        }
        $meSummary = [
            'id' => (int) $user->id,
            'name' => (string) $user->name,
            'counts' => $meCounts,
        ];

        // Solicitações: jogos em avaliação
        $rawRole = is_object($user->role) ? $user->role->value : ($user->role ?? 'co.mum');
        $role = strtolower(trim((string) $rawRole));
        $canModerate = in_array($role, ['moderador','admin'], true);
        $solicitationQuery = DB::table('games as g')
            ->leftJoin('studios as s', 's.id', '=', 'g.studio_id')
            ->leftJoin('users as u', 'u.id', '=', 'g.created_by')
            ->where('g.status', 'avaliacao')
            ->whereNull('g.deleted_at')
            ->select([
                'g.id','g.name','g.cover_url','g.created_at',
                's.name as studio_name',
                'u.id as created_by_id','u.name as created_by_name',
            ])
            ->orderBy('g.created_at', 'desc');
        if (!$canModerate) {
            $solicitationQuery->where('g.created_by', $user->id);
        }
        $solicitations = $solicitationQuery->get();

        return Inertia::render('Options/Index', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'authProvider' => 'Google',
            // Sempre retorna meu resumo e a lista ordenada dos seguidos
            'meSummary' => $meSummary,
            'followingSummary' => $followingSummary,
            'solicitations' => $solicitations,
            'abilities' => [
                'canModerate' => $canModerate,
            ],
        ]);
    }
}
