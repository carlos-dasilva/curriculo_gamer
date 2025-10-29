<?php

namespace App\Domain\Users\Http\Controllers;

use App\Domain\Auth\Enums\Role;
use App\Domain\Users\Http\Requests\UserUpdateRequest;
use App\Models\User;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;

class UserManagementController extends Controller
{
    public function index()
    {
        \Log::info('UserManagementController@index acessado');

        $perPage = 20;
        $name = trim((string) request('name', ''));
        $email = trim((string) request('email', ''));
        $role = trim((string) request('role', ''));

        // Normaliza papel "Comum" para valor persistido
        if ($role !== '' && str_ireplace('comum', 'co.mum', $role) !== $role) {
            $role = 'co.mum';
        }

        $query = User::query()
            ->select(['id','name','email','role'])
            ->when($name !== '', function ($q) use ($name) {
                $q->where('name', 'like', "%{$name}%");
            })
            ->when($email !== '', function ($q) use ($email) {
                $q->where('email', 'like', "%{$email}%");
            })
            ->when($role !== '', function ($q) use ($role) {
                $q->where('role', $role);
            })
            ->orderBy('name');

        $users = $query->paginate($perPage)->withQueryString();

        $users->getCollection()->transform(function ($u) {
            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => is_object($u->role) ? $u->role->value : ($u->role ?? 'co.mum'),
            ];
        });

        $services = [
            [ 'label' => 'Usuários', 'href' => '/admin/usuarios' ],
        ];

        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => [
                'name' => $name,
                'email' => $email,
                'role' => $role,
            ],
            'roles' => [Role::CO_MUM->value, Role::MODERADOR->value, Role::ADMIN->value],
            'services' => $services,
        ]);
    }

    public function edit(User $user)
    {
        $role = is_object($user->role) ? $user->role->value : ($user->role ?? 'co.mum');

        // Opções de papel permitidas conforme o papel de quem edita
        $editor = request()->user();
        $editorRole = is_object($editor->role) ? $editor->role->value : ($editor->role ?? 'co.mum');
        $allowedRoles = $editorRole === Role::ADMIN->value
            ? [Role::CO_MUM->value, Role::MODERADOR->value, Role::ADMIN->value]
            : [Role::CO_MUM->value, Role::MODERADOR->value];

        $readOnly = $editorRole === Role::MODERADOR->value && $role === Role::ADMIN->value;

        // UI: travar apenas o seletor de nível quando moderador edita outro moderador
        $lockRole = $editorRole === Role::MODERADOR->value && $role === Role::MODERADOR->value;

        // Regras para bloqueio
        $canBlock = in_array($editorRole, [Role::ADMIN->value, Role::MODERADOR->value], true) && $role === Role::CO_MUM->value;
        $canUnblock = $canBlock; // mesma regra para desbloqueio

        $services = [
            [ 'label' => 'Usuários', 'href' => '/admin/usuarios' ],
        ];

        return Inertia::render('Users/Edit', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $role,
                'is_blocked' => (bool) ($user->is_blocked ?? false),
            ],
            'allowedRoles' => $allowedRoles,
            'readOnly' => $readOnly,
            'ui' => [
                'lockRole' => $lockRole,
                'lockRoleReason' => $lockRole ? 'Moderador não pode alterar o nível de outro moderador.' : null,
            ],
            'abilities' => [
                'canBlock' => $canBlock,
                'canUnblock' => $canUnblock,
            ],
            'services' => $services,
        ]);
    }

    public function update(UserUpdateRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        // Atualiza somente campos permitidos (nome e nível)
        $user->name = $data['name'];
        $user->role = $data['role'];
        $user->save();

        return redirect()->route('admin.users.index')->with('success', 'Usuário atualizado com sucesso.');
    }

    public function block(User $user): RedirectResponse
    {
        $editor = request()->user();
        $editorRole = is_object($editor->role) ? $editor->role->value : ($editor->role ?? 'co.mum');
        $targetRole = is_object($user->role) ? $user->role->value : ($user->role ?? 'co.mum');

        if (!in_array($editorRole, [Role::ADMIN->value, Role::MODERADOR->value], true) || $targetRole !== Role::CO_MUM->value) {
            return redirect()->back()->with('error', 'Você não tem permissão para bloquear este usuário.');
        }

        $user->is_blocked = true;
        $user->save();
        return redirect()->route('admin.users.edit', $user)->with('success', 'Usuário bloqueado com sucesso.');
    }

    public function unblock(User $user): RedirectResponse
    {
        $editor = request()->user();
        $editorRole = is_object($editor->role) ? $editor->role->value : ($editor->role ?? 'co.mum');
        $targetRole = is_object($user->role) ? $user->role->value : ($user->role ?? 'co.mum');

        if (!in_array($editorRole, [Role::ADMIN->value, Role::MODERADOR->value], true) || $targetRole !== Role::CO_MUM->value) {
            return redirect()->back()->with('error', 'Você não tem permissão para desbloquear este usuário.');
        }

        $user->is_blocked = false;
        $user->save();
        return redirect()->route('admin.users.edit', $user)->with('success', 'Bloqueio removido com sucesso.');
    }
}
