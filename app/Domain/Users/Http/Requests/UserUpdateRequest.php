<?php

namespace App\Domain\Users\Http\Requests;

use App\Domain\Auth\Enums\Role;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

class UserUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $current = $this->user();
        if (!$current) return false;

        /** @var User $target */
        $target = $this->route('user');

        $currentRole = is_object($current->role) ? $current->role->value : ($current->role ?? 'co.mum');
        $targetRole = is_object($target->role) ? $target->role->value : ($target->role ?? 'co.mum');

        if ($currentRole === Role::ADMIN->value) {
            return true; // Admin pode editar qualquer usuário
        }

        if ($currentRole === Role::MODERADOR->value) {
            // Moderador pode editar usuários comuns e moderadores (apenas nome para moderadores)
            return in_array($targetRole, [Role::CO_MUM->value, Role::MODERADOR->value], true);
        }

        return false;
    }

    public function rules(): array
    {
        $current = $this->user();
        $currentRole = $current ? (is_object($current->role) ? $current->role->value : ($current->role ?? 'co.mum')) : 'co.mum';

        $roleRule = 'in:'.implode(',', [Role::CO_MUM->value, Role::MODERADOR->value, Role::ADMIN->value]);
        if ($currentRole === Role::MODERADOR->value) {
            // Moderador não pode promover a admin
            $roleRule = 'in:'.implode(',', [Role::CO_MUM->value, Role::MODERADOR->value]);

            /** @var User $target */
            $target = $this->route('user');
            $targetRole = is_object($target->role) ? $target->role->value : ($target->role ?? 'co.mum');
            if ($targetRole === Role::MODERADOR->value) {
                // Moderador não pode alterar o nível de outro moderador (somente manter 'moderador')
                $roleRule = 'in:'.implode(',', [Role::MODERADOR->value]);
            }
        }

        return [
            'name' => ['required','string','min:2','max:100'],
            'role' => ['required', $roleRule],
        ];
    }

    public function messages(): array
    {
        return [
            'role.in' => 'Você não tem permissão para alterar o nível deste usuário.',
        ];
    }
}
