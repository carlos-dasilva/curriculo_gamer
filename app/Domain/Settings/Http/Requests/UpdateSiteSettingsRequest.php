<?php

namespace App\Domain\Settings\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSiteSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && strtolower((string) (is_object(auth()->user()->role) ? auth()->user()->role->value : (auth()->user()->role ?? 'co.mum'))) === 'admin';
    }

    public function rules(): array
    {
        return [
            'email' => ['nullable','string','email:rfc,dns','max:255'],
            'telefone' => ['nullable','string','max:100'],
            'endereco' => ['nullable','string','max:255'],
            'github' => ['nullable','url'],
            'linkedin' => ['nullable','url'],
            'instagram' => ['nullable','url'],
            'facebook' => ['nullable','url'],
            'x' => ['nullable','url'],
            'youtube' => ['nullable','url'],
            'discord' => ['nullable','url'],
            // WhatsApp pode ser link completo (https://wa.me/...) ou número; aceitar string genérica
            'whatsapp' => ['nullable','string','max:255'],
            'system_logs_enabled' => ['sometimes','boolean'],
        ];
    }
}



