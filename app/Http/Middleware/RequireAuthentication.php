<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class RequireAuthentication
{
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {
            Log::debug('RequireAuthentication: autenticado, seguindo', [
                'path' => $request->path(),
                'route' => $request->route()?->getName(),
                'user' => optional($request->user())->only(['id','email']),
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
        return redirect()->route('home')->with('error','Você precisa estar autenticado.');
    }
}
