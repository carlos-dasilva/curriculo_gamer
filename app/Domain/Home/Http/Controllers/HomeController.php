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
            ->select(['id','name','cover_url','description','overall_score'])
            ->where('status', 'liberado')
            ->with([
                'studio:id,name',
                'platforms:id,name',
                'tags:id,name,slug',
            ])
            ->orderByDesc('overall_score')
            ->orderBy('name')
            ->get();

        return Inertia::render('Home/Index', [
            'games' => $games,
        ]);
    }
}
