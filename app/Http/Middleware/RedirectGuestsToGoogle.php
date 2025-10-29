<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Inertia\Inertia;

class RedirectGuestsToGoogle
{
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {
            return $next($request);
        }

        if ($request->expectsJson() || ! $request->isMethod('GET')) {
            return $next($request);
        }

        $route = $request->route();
        $name = $route?->getName();

        $allowedNames = [
            'home',
            'auth.google.redirect',
            'auth.google.callback',
            'privacy',
            'terms',
            'curriculum.show',
            'games.comments.index',
        ];

        $allowedPaths = [
            '/',
            '/auth/redirect/google',
            '/auth/callback/google',
            '/politica-privacidade',
            '/termos-uso',
        ];

        $path = '/' . ltrim($request->path(), '/');

        if (in_array($name, $allowedNames, true) || in_array($path, $allowedPaths, true)) {
            return $next($request);
        }

        // Em visitas Inertia (XHR), retorne uma Inertia Location para forçar
        // navegação completa ao fluxo OAuth (externo ao domínio)
        if ($request->header('X-Inertia')) {
            return Inertia::location(route('auth.google.redirect', [
                'intended' => $request->fullUrl(),
            ]));
        }

        return redirect()->guest(route('auth.google.redirect', [
            'intended' => $request->fullUrl(),
        ]));
    }
}
