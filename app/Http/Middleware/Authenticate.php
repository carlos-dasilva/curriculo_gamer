<?php

namespace App\Http\Middleware;

use Illuminate\Auth\Middleware\Authenticate as Middleware;
use Illuminate\Http\Request;

class Authenticate extends Middleware
{
    protected function redirectTo(Request $request): ?string
    {
        if (! $request->expectsJson()) {
            // Redireciona diretamente para o fluxo de login via Google.
            // O handler de exceções do Laravel usará Redirect::guest(),
            // gravando automaticamente a URL pretendida (url.intended)
            // para que, após autenticar, o usuário volte ao último destino.
            return route('auth.google.redirect');
        }

        return null;
    }
}
