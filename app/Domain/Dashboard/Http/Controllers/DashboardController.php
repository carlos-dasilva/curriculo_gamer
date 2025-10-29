<?php

namespace App\Domain\Dashboard\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;
use App\Domain\Auth\Enums\Role;

class DashboardController extends Controller
{
    public function index()
    {
        $user = request()->user();
        $rawRole = $user ? (is_object($user->role) ? $user->role->value : ($user->role ?? 'co.mum')) : 'co.mum';

        $services = [
            [
                'label' => 'Usuários',
                'href' => '/admin/usuarios',
            ],
        ];

        if ($rawRole === Role::ADMIN->value) {
            $services[] = [
                'label' => 'Diagnóstico',
                'href' => '/admin/diagnostico',
            ];
            $services[] = [
                'label' => 'Configuração',
                'href' => '/admin/configuracao',
            ];
        }

        return Inertia::render('Admin/Dashboard', [
            'services' => $services,
        ]);
    }
}

