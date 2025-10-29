<?php

namespace App\Domain\Home\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        // Jogos dinâmicos: apenas status "liberado", ordenados por maior nota geral
        $games = \App\Models\Game::query()
            ->select(['id','name','cover_url','description','overall_score','metacritic_metascore','metacritic_user_score','ptbr_subtitled','ptbr_dubbed','created_at'])
            ->where('status', 'liberado')
            ->with([
                'studio:id,name',
                'platforms:id,name',
                'tags:id,name,slug',
            ])
            // 1) Nota geral > 2) Metascore > 3) User Score (Metacritic users) > 4) Últimos cadastrados > 5) Nome
            ->orderByDesc('overall_score')
            ->orderByDesc('metacritic_metascore')
            ->orderByDesc('metacritic_user_score')
            ->orderByDesc('created_at')
            ->orderBy('name')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('Home/Index', [
            'games' => $games,
        ]);
    }
}

