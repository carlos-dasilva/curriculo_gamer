<?php

namespace App\Domain\Platforms\Http\Controllers;

use App\Models\Platform;
use App\Models\Game;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;
use App\Domain\Platforms\Http\Requests\StorePlatformRequest;
use App\Domain\Platforms\Http\Requests\UpdatePlatformRequest;
use App\Domain\Platforms\Jobs\ImportPlatformGamesFromRawg;
use App\Support\SystemLog;

class PlatformController extends Controller
{
    public function index()
    {
        $perPage = 15;
        $name = trim((string) request('name', ''));

        $query = Platform::query()
            ->select(['id','name','rawg_id','manufacturer','release_year','cover_url'])
            ->when($name !== '', function ($q) use ($name) {
                $q->where('name', 'like', "%{$name}%");
            })
            ->orderBy('name');

        $platforms = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Admin/Platforms/Index', [
            'platforms' => $platforms,
            'filters' => [ 'name' => $name ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Platforms/Create');
    }

    public function store(StorePlatformRequest $request): RedirectResponse
    {
        Platform::create($request->validated());
        return redirect()->route('admin.platforms.index')->with('success', 'Plataforma criada com sucesso.');
    }

    public function edit(Platform $platform)
    {
        $gamesCount = Game::query()
            ->whereHas('platforms', function ($q) use ($platform) {
                $q->where('platforms.id', $platform->id);
            })
            ->count();

        return Inertia::render('Admin/Platforms/Edit', [
            'platform' => $platform->only(['id','name','rawg_id','manufacturer','release_year','description','cover_url']),
            'gamesCount' => $gamesCount,
        ]);
    }

    public function update(UpdatePlatformRequest $request, Platform $platform): RedirectResponse
    {
        $platform->update($request->validated());
        return redirect()->route('admin.platforms.index')->with('success', 'Plataforma atualizada com sucesso.');
    }

    public function destroy(Platform $platform): RedirectResponse
    {
        $platform->delete();
        return redirect()->route('admin.platforms.index')->with('success', 'Plataforma removida com sucesso.');
    }

    public function loadGames(Platform $platform): RedirectResponse
    {
        if (!$platform->id) {
            return redirect()->back()->with('error', 'Plataforma ainda não foi salva.');
        }
        if (empty($platform->rawg_id)) {
            return redirect()->back()->with('error', 'Informe o ID RAWG da plataforma para carregar jogos.');
        }

        SystemLog::info('RAWG.platform.load.requested', [
            'user_id' => auth()->id(),
            'platform_id' => $platform->id,
            'rawg_platform_id' => (int) $platform->rawg_id,
        ]);
        ImportPlatformGamesFromRawg::dispatch($platform->id, (int) $platform->rawg_id);

        return redirect()->back()->with('success', 'Importação iniciada. Os jogos serão processados em segundo plano.');
    }
}
