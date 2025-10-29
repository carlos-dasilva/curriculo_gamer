<?php

namespace App\Domain\Tags\Http\Controllers;

use App\Models\Tag;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use App\Domain\Tags\Http\Requests\StoreTagRequest;
use App\Domain\Tags\Http\Requests\UpdateTagRequest;

class TagController extends Controller
{
    public function index()
    {
        $perPage = 20;
        $name = trim((string) request('name', ''));

        $query = Tag::query()
            ->select(['id','name','slug'])
            ->when($name !== '', function ($q) use ($name) {
                $q->where(function ($qq) use ($name) {
                    $qq->where('name', 'like', "%{$name}%")
                       ->orWhere('slug', 'like', "%{$name}%");
                });
            })
            ->orderBy('name');

        $tags = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Admin/Tags/Index', [
            'tags' => $tags,
            'filters' => [ 'name' => $name ],
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Tags/Create');
    }

    public function store(StoreTagRequest $request): RedirectResponse
    {
        $data = $request->validated();
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        Tag::create($data);
        return redirect()->route('admin.tags.index')->with('success', 'Marcador criado com sucesso.');
    }

    public function edit(Tag $tag)
    {
        return Inertia::render('Admin/Tags/Edit', [
            'tag' => $tag->only(['id','name','slug','description']),
        ]);
    }

    public function update(UpdateTagRequest $request, Tag $tag): RedirectResponse
    {
        $data = $request->validated();
        if (empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }
        $tag->update($data);
        return redirect()->route('admin.tags.index')->with('success', 'Marcador atualizado com sucesso.');
    }

    public function destroy(Tag $tag): RedirectResponse
    {
        $tag->delete();
        return redirect()->route('admin.tags.index')->with('success', 'Marcador removido com sucesso.');
    }
}

