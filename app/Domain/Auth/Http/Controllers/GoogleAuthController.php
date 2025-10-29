<?php

namespace App\Domain\Auth\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use App\Domain\Auth\Enums\Role;
use Illuminate\Support\Facades\Hash;

class GoogleAuthController extends Controller
{
    public function redirect(Request $request): RedirectResponse
    {
        // Guarda URL pretendida (intended) se vier por query ou usa anterior segura
        $intended = (string) $request->query('intended', '');
        if ($intended !== '') {
            // Permite apenas caminhos relativos internos
            $path = parse_url($intended, PHP_URL_PATH) ?? '';
            $query = parse_url($intended, PHP_URL_QUERY);
            $intended = '/' . ltrim($path, '/');
            if ($query) { $intended .= '?' . $query; }
            if ($intended !== '/') {
                $request->session()->put('url.intended', $intended);
            }
        } else {
            // fallback: página anterior interna
            $previous = url()->previous();
            $host = parse_url($previous, PHP_URL_HOST);
            $appHost = parse_url(config('app.url'), PHP_URL_HOST);
            if ($host === $appHost) {
                $path = parse_url($previous, PHP_URL_PATH) ?: '/';
                $query = parse_url($previous, PHP_URL_QUERY);
                $safe = rtrim($path, '/') === '' ? '/' : $path;
                if ($query) { $safe .= '?' . $query; }
                if ($safe !== '/') {
                    $request->session()->put('url.intended', $safe);
                }
            }
        }

        return Socialite::driver('google')->redirect();
    }

    public function callback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            $email = $googleUser->getEmail();
            $name = $googleUser->getName() ?: ($googleUser->getNickname() ?: 'Usuário');

            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    // Gera senha randômica pois login será sempre via Google
                    'password' => Hash::make(Str::random(32)),
                    'email_verified_at' => now(),
                    // Define role padrão na criação
                    'role' => Role::CO_MUM->value,
                ]
            );

            // Se usuário estiver bloqueado, impede login
            if ((bool) ($user->is_blocked ?? false)) {
                return redirect()->route('home')->with('error', 'Seu usuário está bloqueado. Entre em contato com o suporte.');
            }

            // Não sobrescrever o nome customizado do usuário em re-logins.
            // Apenas definir/ajustar no primeiro login ou se estiver vazio.
            if ($user->wasRecentlyCreated || empty(trim((string) $user->name))) {
                $user->name = $name;
                $user->save();
            }

            Auth::login($user, true);

            // Redireciona para a URL pretendida (se existir), senão home
            return redirect()->intended(route('home'))
                ->with('success', 'Login realizado com sucesso.');
        } catch (\Throwable $e) {
            Log::error('Erro no callback do Google OAuth', [
                'message' => $e->getMessage(),
            ]);
            return redirect()->route('home')->with('error', 'Falha ao autenticar com Google.');
        }
    }
}

