<?php

namespace App\Domain\Collection\Http\Controllers;

use App\Domain\Collection\Http\Requests\SaveCatalogRequest;
use App\Domain\Collection\Support\CollectionCatalogs;
use App\Models\CollectionCompany;
use App\Models\CollectionPlatformCompany;
use App\Models\Platform;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CollectionCatalogController
{
    public function index(Request $request, string $catalog = 'companies')
    {
        $model = CollectionCatalogs::model($catalog);
        $filters = $request->validate(['q' => ['nullable', 'string', 'max:150']]);

        return Inertia::render('Admin/Collection/Catalog', [
            'catalog' => $catalog, 'catalogs' => CollectionCatalogs::menu(),
            'entries' => $model->newQuery()->when($filters['q'] ?? null, fn ($q, $term) => $q->where('name', 'like', '%'.$term.'%'))
                ->orderBy('name')->paginate(20)->withQueryString(),
            'filters' => $filters,
        ]);
    }

    public function store(SaveCatalogRequest $request, string $catalog)
    {
        CollectionCatalogs::model($catalog)->newQuery()->create($request->validated());

        return back()->with('success', 'Cadastro criado.');
    }

    public function update(SaveCatalogRequest $request, string $catalog, int $entry)
    {
        $model = CollectionCatalogs::model($catalog)->newQuery()->findOrFail($entry);
        // Slugs são identidades estáveis usados nas regras e seeds.
        $model->fill(collect($request->validated())->except('slug')->all())->save();

        return back()->with('success', 'Cadastro atualizado.');
    }

    public function platforms(Request $request)
    {
        $filters = $request->validate(['q' => ['nullable', 'string', 'max:150']]);

        return Inertia::render('Admin/Collection/Platforms', [
            'platforms' => Platform::with('collectionCompanyMapping.company')
                ->when($filters['q'] ?? null, fn ($q, $term) => $q->where('name', 'like', '%'.$term.'%'))
                ->orderBy('name')->paginate(20)->withQueryString(),
            'companies' => CollectionCompany::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'filters' => $filters,
        ]);
    }

    public function mapPlatform(Request $request, Platform $platform)
    {
        $data = $request->validate(['company_id' => ['nullable', 'integer',
            Rule::exists('collection_companies', 'id')->where(fn ($q) => $q->where(fn ($available) => $available
                ->where('is_active', true)->orWhere('id', $platform->collectionCompanyMapping?->company_id ?? 0)))]]);
        if (empty($data['company_id'])) {
            CollectionPlatformCompany::where('platform_id', $platform->id)->delete();
        } else {
            CollectionPlatformCompany::updateOrCreate(['platform_id' => $platform->id], $data);
        }

        return back()->with('success', 'Empresa da plataforma atualizada.');
    }
}
