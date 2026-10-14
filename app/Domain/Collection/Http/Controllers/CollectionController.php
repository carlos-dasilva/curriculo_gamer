<?php

namespace App\Domain\Collection\Http\Controllers;

use App\Domain\Collection\Http\Requests\SaveCollectionItemRequest;
use App\Domain\Collection\Services\CollectionItemWriter;
use App\Domain\Collection\Services\CollectionQuery;
use App\Domain\Collection\Support\CollectionCatalogs;
use App\Domain\Collection\Support\CollectionItems;
use App\Models\Game;
use App\Models\Platform;
use App\Models\User;
use App\Models\UserCollectionConsole;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CollectionController
{
    public function __construct(private CollectionQuery $queries, private CollectionItemWriter $writer) {}

    private function owner(Request $request): User
    {
        return $request->route('user') instanceof User ? $request->route('user') : $request->user();
    }

    private function isOwner(Request $request): bool
    {
        return $request->user()?->id === $this->owner($request)->id;
    }

    private function context(Request $request): array
    {
        $owner = $this->owner($request);

        return [
            'isOwner' => $this->isOwner($request),
            'collectionOwner' => $owner->only(['id', 'name']),
            'collectionBase' => $request->route('user') ? '/colecao/'.$owner->id : '/minha-colecao',
            'shareUrl' => route('collection.public.dashboard', $owner->id),
        ];
    }

    public function publicDashboard(Request $request, User $user)
    {
        return $this->dashboard($request);
    }

    public function publicSales(Request $request, User $user)
    {
        return $this->sales($request);
    }

    public function sales(Request $request)
    {
        $filters = array_filter($request->validate([
            'q' => ['nullable', 'string', 'max:150'],
            'kind' => ['nullable', Rule::in(array_keys(CollectionItems::DEFINITIONS))],
            'platform_id' => ['nullable', 'integer', 'exists:platforms,id'],
            'company_id' => ['nullable', 'integer', 'exists:collection_companies,id'],
            'price_min' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'price_max' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99', ...($request->filled('price_min') ? ['gte:price_min'] : [])],
            'sort' => ['nullable', Rule::in(['newest', 'name', 'price_asc', 'price_desc'])],
        ]), fn ($value) => $value !== null && $value !== '');
        $owner = $this->owner($request);

        return Inertia::render('Collection/Sales', [
            ...$this->context($request),
            'salesPage' => true,
            'shareUrl' => route('collection.public.sales', $owner->id),
            'filters' => $filters,
            'items' => $this->queries->sales($owner->id, $filters, $this->isOwner($request)),
            'platforms' => $this->queries->groups($owner->id, 'platforms'),
            'companies' => $this->queries->groups($owner->id, 'companies'),
        ]);
    }

    public function publicIndex(Request $request, User $user, string $kind)
    {
        return $this->index($request, $kind);
    }

    public function publicShow(Request $request, User $user, string $kind, int $item)
    {
        return $this->show($request, $kind, $item);
    }

    public function export(Request $request, string $kind, int $item)
    {
        $record = CollectionItems::owned($kind, $request->user()->id, $item);
        $record->load(array_merge($this->queries->relations($kind), ['images', 'itemStatus']));
        $data = ['version' => 1, 'kind' => $kind, 'item' => $record->toArray()];

        return response()->streamDownload(function () use ($data) {
            echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        }, 'colecao-'.$kind.'-'.$item.'.json', ['Content-Type' => 'application/json; charset=UTF-8', 'Cache-Control' => 'private, no-store']);
    }

    private function filters(Request $request): array
    {
        $rules = [
            'q' => ['nullable', 'string', 'max:150'],
            'platform_id' => ['nullable', 'integer', 'exists:platforms,id'],
            'company_id' => ['nullable', 'integer', 'exists:collection_companies,id'],
            'sort' => ['nullable', Rule::in(['name', 'newest', 'oldest', 'best', 'worst', ...($this->isOwner($request) ? ['price'] : []), 'platform', 'company', 'quantity'])],
            'completeness' => ['nullable', Rule::in(['cib', 'boxed', 'loose'])],
            'condition_min' => ['nullable', 'integer', 'min:1', 'max:10'],
            'condition_max' => ['nullable', 'integer', 'min:1', 'max:10'],
            'acquired_from' => ['nullable', 'date_format:Y-m-d'],
            'acquired_to' => ['nullable', 'date_format:Y-m-d'],
        ];
        foreach (CollectionItems::DEFINITIONS as $definition) {
            foreach ($definition['fields'] as $field) {
                if (isset($rules[$field['key']])) {
                    continue;
                }
                if (in_array($field['type'], ['catalog', 'score'])) {
                    $rules[$field['key']] = ['nullable', 'integer', 'min:1'];
                } elseif ($field['type'] === 'bool') {
                    $rules[$field['key']] = ['nullable', 'boolean'];
                } elseif ($field['type'] === 'media') {
                    $rules[$field['key']] = ['nullable', Rule::in(['physical', 'digital'])];
                } elseif ($field['type'] === 'connection') {
                    $rules[$field['key']] = ['nullable', Rule::in(['wired', 'wireless', 'both', 'unknown'])];
                }
            }
        }

        return array_filter($request->validate($rules), fn ($v) => $v !== null && $v !== '');
    }

    private function fields(string $kind, ?Model $item = null, bool $includeInactive = false): array
    {
        return array_map(function ($field) use ($item, $includeInactive) {
            if ($field['type'] === 'catalog') {
                $model = CollectionCatalogs::model($field['catalog']);
                $field['options'] = $model->newQuery()->when(! $includeInactive, fn ($q) => $q->where(fn ($available) => $available->where('is_active', true)->orWhere('id', $item?->{$field['key']} ?? 0)))
                    ->orderBy('name')->get(['id', 'name'])->toArray();
            } elseif (in_array($field['type'], ['platform', 'platforms'])) {
                $field['options'] = Platform::orderBy('name')->get(['id', 'name'])->toArray();
            }

            return $field;
        }, CollectionItems::definition($kind)['fields']);
    }

    public function index(Request $request, string $kind)
    {
        $filters = $this->filters($request);
        $query = $this->queries->query($kind, $this->owner($request)->id, $filters)->with($this->queries->relations($kind));

        return Inertia::render('Collection/Index', [
            ...$this->context($request),
            'kind' => $kind, 'title' => CollectionItems::definition($kind)['label'], 'filters' => $filters,
            'fields' => $this->fields($kind, null, true),
            'companies' => $this->queries->groups($this->owner($request)->id, 'companies'),
            'items' => $this->queries->ordered($query, $kind, $filters['sort'] ?? 'newest')->paginate(24)->withQueryString()
                ->through(fn ($item) => $this->queries->present($item, $kind, $this->isOwner($request))),
        ]);
    }

    public function create(Request $request, string $kind)
    {
        return $this->form($request, $kind);
    }

    public function edit(Request $request, string $kind, int $item)
    {
        return $this->form($request, $kind, CollectionItems::owned($kind, $request->user()->id, $item));
    }

    private function form(Request $request, string $kind, ?Model $item = null)
    {
        $item?->load('images');
        if ($kind === 'acessorios') {
            $item?->load('platforms', 'console.platform');
        }
        if ($kind === 'jogos') {
            $item?->load('game.platforms');
        }
        if ($kind === 'jogos' && $item?->game && ! $item->game->platforms->contains('id', $item->platform_id)) {
            $item->game->platforms->push($item->platform);
        }
        $data = $item?->only(array_column(CollectionItems::definition($kind)['fields'], 'key')) ?? [];
        $data['images'] = $item?->images->map->only(['url', 'description', 'is_primary'])->values()->all() ?? [];
        if ($kind === 'acessorios') {
            $data['platform_ids'] = $item?->platforms->pluck('id')->all() ?? [];
            if (! $item?->console) {
                $data['collection_console_id'] = null;
            }
        }

        return Inertia::render('Collection/Form', [
            'kind' => $kind, 'title' => CollectionItems::definition($kind)['singular'],
            'fields' => $this->fields($kind, $item), 'item' => $data, 'itemId' => $item?->id,
            'selectedGame' => $kind === 'jogos' ? $item?->game?->only(['id', 'name', 'platforms']) : null,
            'selectedConsole' => $kind === 'acessorios' && $item?->console ? [
                'id' => $item->console->id, 'name' => $item->console->nickname ?: $item->console->platform->name,
            ] : null,
        ]);
    }

    public function show(Request $request, string $kind, int $item)
    {
        $record = CollectionItems::owned($kind, $this->owner($request)->id, $item);
        $record->load(array_merge($this->queries->relations($kind), ['images']));

        $fields = $this->fields($kind, $record);
        $data = $record->toArray();
        if (! $this->isOwner($request)) {
            $fields = array_values(array_filter($fields, fn ($field) => ! in_array($field['key'], ['purchase_price', 'serial_number'], true)));
            $data = $record->only(array_merge(['id'], array_column($fields, 'key')));
            $data['images'] = $record->images->map->only(['url', 'description', 'is_primary', 'sort_order'])->all();
            if ($kind === 'acessorios') {
                $data['console'] = $record->console ? ['nickname' => $record->console->nickname, 'platform' => $record->console->platform?->only(['id', 'name'])] : null;
            }
        }

        return Inertia::render('Collection/Show', [
            ...$this->context($request),
            'kind' => $kind, 'item' => $data, 'card' => $this->queries->present($record, $kind, $this->isOwner($request)),
            'fields' => $fields,
        ]);
    }

    public function store(SaveCollectionItemRequest $request, string $kind)
    {
        $item = $this->writer->save($kind, $request->user()->id, $request->validated());

        return redirect('/minha-colecao/'.$kind.'/'.$item->id)->with('success', 'Item adicionado à coleção.');
    }

    public function update(SaveCollectionItemRequest $request, string $kind, int $item)
    {
        $this->writer->save($kind, $request->user()->id, $request->validated(), $item);

        return redirect('/minha-colecao/'.$kind.'/'.$item)->with('success', 'Item atualizado.');
    }

    public function destroy(Request $request, string $kind, int $item)
    {
        CollectionItems::owned($kind, $request->user()->id, $item)->delete();

        return redirect('/minha-colecao/'.$kind)->with('success', 'Item removido da coleção.');
    }

    public function lookup(Request $request, string $source)
    {
        $data = $request->validate(['q' => ['nullable', 'string', 'max:150']]);
        $term = '%'.($data['q'] ?? '').'%';
        if ($source === 'games') {
            return Game::where('status', 'liberado')->where('name', 'like', $term)
                ->with('platforms:id,name')->orderBy('name')->limit(20)->get(['id', 'name', 'cover_url']);
        }
        abort_unless($source === 'consoles', 404);

        return UserCollectionConsole::where('user_id', $request->user()->id)->with('platform:id,name')
            ->where(fn ($q) => $q->where('nickname', 'like', $term)->orWhereHas('platform', fn ($p) => $p->where('name', 'like', $term)))
            ->orderBy('id')->limit(20)->get()->map(fn ($item) => ['id' => $item->id, 'name' => $item->nickname ?: $item->platform->name]);
    }

    public function dashboard(Request $request)
    {
        $filters = $this->filters($request);
        $sections = [];
        foreach (array_keys(CollectionItems::DEFINITIONS) as $kind) {
            $query = $this->queries->query($kind, $this->owner($request)->id, $filters)->with($this->queries->relations($kind));
            $sections[$kind] = $query->orderByDesc('created_at')->orderByDesc('id')->limit(6)->get()->map(fn ($item) => $this->queries->present($item, $kind, $this->isOwner($request)));
        }
        $platforms = $this->queries->groups($this->owner($request)->id, 'platforms');
        $companies = $this->queries->groups($this->owner($request)->id, 'companies');
        $scope = null;
        if (! empty($filters['platform_id'])) {
            $scope = collect($platforms)->firstWhere('id', (int) $filters['platform_id']);
        } elseif (! empty($filters['company_id'])) {
            $scope = collect($companies)->firstWhere('id', (int) $filters['company_id']);
        }
        if (! empty($filters['platform_id']) || ! empty($filters['company_id'])) {
            abort_unless($scope, 404);
        }
        if (! empty($filters['company_id'])) {
            $ids = \App\Models\CollectionPlatformCompany::where('company_id', $filters['company_id'])->pluck('platform_id');
            $platforms = array_values(array_filter($platforms, fn ($p) => $ids->contains($p['id'])));
        }

        $totals = $this->queries->totals($this->owner($request)->id, $filters);
        if (! $this->isOwner($request)) {
            unset($totals['investment'], $totals['priced_items']);
        }

        return Inertia::render('Collection/Dashboard', [
            ...$this->context($request),
            'filters' => $filters, 'scope' => $scope, 'sections' => $sections,
            'totals' => $totals,
            'breakdowns' => $this->queries->breakdowns($this->owner($request)->id, $filters),
            'platforms' => $platforms, 'companies' => $companies,
        ]);
    }
}
