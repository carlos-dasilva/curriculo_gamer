<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RequireAuthentication
{
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = $request->user();

            if ((bool) ($user->is_blocked ?? false)) {
                Log::warning('RequireAuthentication: usuário bloqueado detectado; encerrando sessão', [
                    'user' => optional($user)->only(['id','email']),
                    'path' => $request->path(),
                ]);

                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                if ($request->expectsJson()) {
                    return response()->json(['message' => 'Conta bloqueada.'], 403);
                }

                return redirect()->route('home')->with('error', 'Sua conta está bloqueada.');
            }

            Log::debug('RequireAuthentication: autenticado, seguindo', [
                'path' => $request->path(),
                'route' => $request->route()?->getName(),
                'user' => optional($user)->only(['id','email']),
            ]);

            return $next($request);
        }

        // Permitir rotas públicas essenciais
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
            Log::debug('RequireAuthentication: rota pública permitida sem login', [
                'path' => $path,
                'name' => $name,
            ]);
            return $next($request);
        }

        if ($request->expectsJson()) {
            Log::warning('RequireAuthentication: acesso não autenticado a rota privada (JSON)', [
                'path' => $path,
                'name' => $name,
            ]);
            return response()->json(['message' => 'Não autenticado.'], 401);
        }

        Log::warning('RequireAuthentication: acesso não autenticado a rota privada (redirect)', [
            'path' => $path,
            'name' => $name,
        ]);

        // Em visitas Inertia, peça navegação completa
        if ($request->header('X-Inertia')) {
            return Inertia::location(route('auth.google.redirect', [
                'intended' => $request->fullUrl(),
            ]));
        }

        // Redireciona convidado exatamente como o botão "Entrar com o Google"
        // salvando a rota atual como intended
        return redirect()->guest(route('auth.google.redirect', [
            'intended' => $request->fullUrl(),
        ]));
    }
}
