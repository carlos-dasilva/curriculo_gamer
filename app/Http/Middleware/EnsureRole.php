<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        if (!$user) {
            return redirect()->route('home');
        }

        $allowed = collect($roles)
            ->flatMap(fn ($r) => preg_split('/[,|]/', (string) $r) ?: [])
            ->filter()
            ->map(fn ($r) => strtolower(trim($r)))
            ->values()
            ->all();

        $rawRole = is_object($user->role) ? $user->role->value : ($user->role ?? 'co.mum');
        $current = strtolower(trim((string) $rawRole));

        if (!in_array($current, $allowed, true)) {
            Log::warning('EnsureRole: acesso negado por papel', [
                'required' => $allowed,
                'current' => $current,
                'user' => optional($request->user())->only(['id','email']),
                'route' => $request->route()?->getName(),
                'path' => $request->path(),
            ]);
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Acesso negado.'], 403);
            }
            return redirect()->route('home')->with('error', 'Acesso negado.');
        }

        return $next($request);
    }
}

