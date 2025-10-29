<?php

namespace App\Http\Middleware;

use App\Models\SiteSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Monolog\Logger as MonologLogger;
use Monolog\Handler\StreamHandler;

class SystemRequestLogger
{
    public function handle(Request $request, Closure $next): Response
    {
        $settings = null;
        try {
            $settings = SiteSetting::query()->first();
        } catch (\Throwable $e) {
            // ignore if table not migrated
        }

        $enabled = (bool) ($settings->system_logs_enabled ?? false);
        if (!$enabled) {
            return $next($request);
        }

        $response = $next($request);

        $path = storage_path('logs/log-'. now()->format('Ymd') .'.log');
        $dir = dirname($path);
        if (!is_dir($dir)) {
            @mkdir($dir, 0775, true);
        }

        $logger = new MonologLogger('system');
        $logger->pushHandler(new StreamHandler($path, MonologLogger::INFO));

        $route = $request->route();
        $routeName = $route?->getName();
        $routeAction = $route?->getActionName();

        $input = [
            'query' => $request->query(),
            'body' => $request->except(['password', 'password_confirmation', '_token']),
        ];

        $respMeta = [
            'status' => method_exists($response, 'getStatusCode') ? $response->getStatusCode() : null,
            'type' => get_class($response),
        ];

        $body = null;
        $max = 20000; // cap body length to 20k chars
        try {
            if ($response instanceof \Illuminate\Http\JsonResponse) {
                $body = $response->getContent();
            } elseif ($response instanceof \Illuminate\Http\Response) {
                $body = $response->getContent();
            } else {
                $body = '[non-buffered response]';
            }
        } catch (\Throwable $e) {
            $body = '[unavailable content]';
        }
        if (is_string($body) && strlen($body) > $max) {
            $body = substr($body, 0, $max) . '... [truncated]';
        }

        $logger->info('HTTP transaction', [
            'datetime' => now()->toDateTimeString(),
            'method' => $request->getMethod(),
            'path' => $request->path(),
            'full_url' => $request->fullUrl(),
            'route' => [
                'name' => $routeName,
                'action' => $routeAction,
            ],
            'ip' => $request->ip(),
            'user_id' => optional($request->user())->id,
            'input' => $input,
            'response' => $respMeta,
            'body' => $body,
        ]);

        return $response;
    }
}
