<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * O nome da view raiz usada durante a primeira visita.
     */
    public function rootView(Request $request): string
    {
        return 'app';
    }

    /**
     * Define os dados padrão compartilhados por todas as respostas Inertia.
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'auth' => [
                'isAuthenticated' => fn () => auth()->check(),
                'user' => fn () => auth()->user() ? [
                    'name' => auth()->user()->name,
                    'email' => auth()->user()->email,
                    'currentlyPlayingGameId' => auth()->user()->currently_playing_game_id,
                ] : null,
                'loginUrl' => fn () => \Illuminate\Support\Facades\Route::has('auth.google.redirect') ? route('auth.google.redirect') : '#',
                'logoutUrl' => fn () => \Illuminate\Support\Facades\Route::has('logout') ? route('logout') : '#',
                'abilities' => fn () => [
                    'manageUsers' => (function () {
                        if (!auth()->check()) return false;
                        $raw = is_object(auth()->user()->role) ? auth()->user()->role->value : (auth()->user()->role ?? 'co.mum');
                        $val = strtolower(trim((string) $raw));
                        return in_array($val, ['moderador','admin'], true);
                    })(),
                    'isAdmin' => (function () {
                        if (!auth()->check()) return false;
                        $raw = is_object(auth()->user()->role) ? auth()->user()->role->value : (auth()->user()->role ?? 'co.mum');
                        $val = strtolower(trim((string) $raw));
                        return $val === 'admin';
                    })(),
                ],
            ],
            'site' => (function () {
                try {
                    $s = \App\Models\SiteSetting::query()->first();
                } catch (\Throwable $e) {
                    $s = null;
                }
                return [
                    'contact' => [
                        'email' => $s?->email,
                        'telefone' => $s?->telefone,
                        'endereco' => $s?->endereco,
                    ],
                    'socials' => [
                        'github' => $s?->github,
                        'linkedin' => $s?->linkedin,
                        'instagram' => $s?->instagram,
                        'facebook' => $s?->facebook,
                        'x' => $s?->x,
                        'youtube' => $s?->youtube,
                        'whatsapp' => $s?->whatsapp,
                        'discord' => $s?->discord,
                    ],
                ];
            })(),
        ]);
    }
}
