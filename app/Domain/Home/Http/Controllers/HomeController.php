<?php

namespace App\Domain\Home\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        $q = trim((string) request('q', ''));
        $sub = request()->boolean('sub');
        $dub = request()->boolean('dub');

        $games = \App\Models\Game::query()
            ->select(['id','name','cover_url','description','overall_score','metacritic_metascore','metacritic_user_score','ptbr_subtitled','ptbr_dubbed','created_at'])
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
            ->orderByDesc('metacritic_user_score')
            ->orderByDesc('created_at')
            ->orderBy('name')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('Home/Index', [
            'games' => $games,
            'filters' => [ 'q' => $q, 'sub' => $sub, 'dub' => $dub ],
        ]);
    }
}

