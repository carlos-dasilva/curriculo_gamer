<?php

namespace App\Domain\Profile\Http\Controllers;

use App\Domain\Profile\Http\Requests\ProfileUpdateRequest;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ProfileController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('home');
        }

        return Inertia::render('Profile/Index', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'authProvider' => 'Google',
        ]);
    }

    public function update(ProfileUpdateRequest $request)
    {
        $user = Auth::user();
        if (!$user) {
            return redirect()->route('home');
        }

        // Somente campos permitidos (não permitir alterar email/senha)
        $data = $request->validated();
        $user->name = $data['name'];
        $user->save();

        return redirect()->route('profile.index')->with('success', 'Perfil atualizado com sucesso.');
    }
}
