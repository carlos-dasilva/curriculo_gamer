<?php

namespace App\Domain\Settings\Http\Controllers;

use App\Models\SiteSetting;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use App\Domain\Settings\Http\Requests\UpdateSiteSettingsRequest;
use Illuminate\Http\RedirectResponse;

class ConfigController extends Controller
{
    public function index()
    {
        $settings = SiteSetting::query()->first();

        $services = [
            [ 'label' => 'Usuários', 'href' => '/admin/usuarios' ],
            [ 'label' => 'Configuração', 'href' => '/admin/configuracao' ],
        ];

        // Link de diagnóstico só para admin; o menu AdminLayout filtra, mas mantemos aqui simples
        $rawRole = request()->user() ? (is_object(request()->user()->role) ? request()->user()->role->value : (request()->user()->role ?? 'co.mum')) : 'co.mum';
        if (strtolower((string) $rawRole) === 'admin') {
            $services[] = [ 'label' => 'Diagnóstico', 'href' => '/admin/diagnostico' ];
        }

        return Inertia::render('Admin/Config', [
            'settings' => [
                'email' => $settings?->email,
                'telefone' => $settings?->telefone,
                'endereco' => $settings?->endereco,
                'github' => $settings?->github,
                'linkedin' => $settings?->linkedin,
                'instagram' => $settings?->instagram,
                'facebook' => $settings?->facebook,
                'x' => $settings?->x,
                'youtube' => $settings?->youtube,
                'whatsapp' => $settings?->whatsapp,
                'discord' => $settings?->discord,
                'system_logs_enabled' => (bool) ($settings?->system_logs_enabled ?? false),
            ],
            'logResolvedPath' => storage_path('logs/log-'.now()->format('Ymd').'.log'),
            'services' => $services,
        ]);
    }

    public function update(UpdateSiteSettingsRequest $request): RedirectResponse
    {
        $data = $request->validated();
        // Garante uma única linha de configuração
        $settings = SiteSetting::query()->first();
        if (!$settings) {
            $settings = new SiteSetting();
        }
        $settings->fill($data);
        $settings->save();

        return redirect()->route('admin.config.index')->with('success', 'Configurações atualizadas com sucesso.');
    }
}

