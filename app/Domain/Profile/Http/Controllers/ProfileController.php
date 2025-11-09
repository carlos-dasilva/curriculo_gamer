<?php

namespace App\Domain\Profile\Http\Controllers;

use App\Domain\Profile\Http\Requests\ProfileUpdateRequest;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('home');
        }

        // Lista de seguidos
        $followed = DB::table('user_follows as f')
            ->join('users as u', 'u.id', '=', 'f.followed_id')
            ->where('f.follower_id', $user->id)
            ->orderBy('u.name')
            ->get(['u.id','u.name']);

        $followingSummary = [];
        if ($followed->count() > 0) {
            $ids = $followed->pluck('id')->all();
            $allowedStatuses = ['cem_por_cento','finalizei','joguei','quero_jogar'];
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
            // Ordena por: maior Fiz 100% > Finalizei > Joguei > Quero Jogar
            usort($followingSummary, function ($a, $b) {
                $order = ['cem_por_cento','finalizei','joguei','quero_jogar'];
                foreach ($order as $k) {
                    $diff = ((int)($b['counts'][$k] ?? 0)) <=> ((int)($a['counts'][$k] ?? 0));
                    if ($diff !== 0) return $diff;
                }
                // Desempate por nome
                return strcmp((string)$a['name'], (string)$b['name']);
            });
        }

        return Inertia::render('Profile/Index', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'authProvider' => 'Google',
            'followingSummary' => $followingSummary,
        ]);
    }

    public function update(ProfileUpdateRequest $request)
    {
        $user = Auth::user();
        if (!$user) {
            return redirect()->route('home');
        }

        // Somente campos permitidos (não permitir alterar email/senha)
        $data = $request->validated();
        $user->name = $data['name'];
        $user->save();

        // Redireciona de forma contextual: se o referer era /opcoes, mantém lá; caso contrário volta ao /perfil
        $referer = (string) request()->headers->get('referer', '');
        $path = parse_url($referer, PHP_URL_PATH) ?: '';
        if (str_contains($path, '/opcoes')) {
            return redirect()->route('options.index', ['tab' => 'perfil'])->with('success', 'Perfil atualizado com sucesso.');
        }
        return redirect()->route('profile.index')->with('success', 'Perfil atualizado com sucesso.');
    }
}
