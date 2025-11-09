<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Middleware do Inertia na stack web
        $middleware->appendToGroup('web', \App\Http\Middleware\HandleInertiaRequests::class);

        // Convidados: salvar intended e ir ao Google
        $middleware->appendToGroup('web', \App\Http\Middleware\RedirectGuestsToGoogle::class);

        // Alias para middlewares de rota
        $middleware->alias([
            'auth' => \App\Http\Middleware\Authenticate::class,
            'role' => \App\Http\Middleware\EnsureRole::class,
        ]);

        // Exigir autenticação por padrÃ£o em todas as rotas web
        $middleware->appendToGroup('web', \App\Http\Middleware\RequireAuthentication::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();

