<?php

namespace App\Domain\Studios\Http\Controllers;

use App\Models\Studio;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;
use App\Domain\Studios\Http\Requests\StoreStudioRequest;
use App\Domain\Studios\Http\Requests\UpdateStudioRequest;

class StudioController extends Controller
{
    public function index()
    {
        $perPage = 15;
        $name = trim((string) request('name', ''));

        $query = Studio::query()
            ->select(['id','name','website','country','founded_year'])
            ->when($name !== '', function ($q) use ($name) {
                $q->where('name', 'like', "%{$name}%");
            })
            ->orderBy('name');

        $studios = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Admin/Studios/Index', [
            'studios' => $studios,
            'filters' => [ 'name' => $name ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Studios/Create');
    }

    public function store(StoreStudioRequest $request): RedirectResponse
    {
        Studio::create($request->validated());
        return redirect()->route('admin.studios.index')->with('success', 'Estúdio criado com sucesso.');
    }

    public function edit(Studio $studio)
    {
        return Inertia::render('Admin/Studios/Edit', [
            'studio' => $studio->only(['id','name','website','country','founded_year','description']),
        ]);
    }

    public function update(UpdateStudioRequest $request, Studio $studio): RedirectResponse
    {
        $studio->update($request->validated());
        return redirect()->route('admin.studios.index')->with('success', 'Estúdio atualizado com sucesso.');
    }

    public function destroy(Studio $studio): RedirectResponse
    {
        $studio->delete();
        return redirect()->route('admin.studios.index')->with('success', 'Estúdio removido com sucesso.');
    }
}
