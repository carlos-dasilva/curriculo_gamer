<?php

namespace App\Domain\Auth\Http\Controllers;

use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use App\Domain\Auth\Enums\Role;
use Illuminate\Support\Facades\Hash;

class GoogleAuthController extends Controller
{
    public function redirect(): RedirectResponse
    {
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

            // Não sobrescrever o nome customizado do usuário em re-logins.
            // Apenas definir/ajustar no primeiro login ou se estiver vazio.
            if ($user->wasRecentlyCreated || empty(trim((string) $user->name))) {
                $user->name = $name;
                $user->save();
            }

            Auth::login($user, true);

            return redirect()->route('home')->with('success', 'Login realizado com sucesso.');
        } catch (\Throwable $e) {
            Log::error('Erro no callback do Google OAuth', [
                'message' => $e->getMessage(),
            ]);
            return redirect()->route('home')->with('error', 'Falha ao autenticar com Google.');
        }
    }
}
