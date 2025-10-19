<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Routing\Router;

class MiddlewareServiceProvider extends ServiceProvider
{
    public function boot(Router $router): void
    {
        // Adiciona o logger condicional ao grupo 'web'
        $router->pushMiddlewareToGroup('web', \App\Http\Middleware\SystemRequestLogger::class);
    }
}

