<?php

namespace App\Domain\Platforms\Http\Controllers;

use App\Models\Platform;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;
use App\Domain\Platforms\Http\Requests\StorePlatformRequest;
use App\Domain\Platforms\Http\Requests\UpdatePlatformRequest;

class PlatformController extends Controller
{
    public function index()
    {
        $perPage = 15;
        $name = trim((string) request('name', ''));

        $query = Platform::query()
            ->select(['id','name','manufacturer','release_year'])
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
        return Inertia::render('Admin/Platforms/Edit', [
            'platform' => $platform->only(['id','name','manufacturer','release_year','description']),
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
}

