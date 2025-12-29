<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSyncApiToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $configuredToken = (string) config('services.sync_api.token', '');
        if ($configuredToken === '') {
            return response()->json(['message' => 'Sync API token not configured.'], 503);
        }

        $provided = $request->bearerToken() ?: $request->header('X-Sync-Token');
        if (!is_string($provided) || $provided === '' || !hash_equals($configuredToken, $provided)) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        return $next($request);
    }
}
