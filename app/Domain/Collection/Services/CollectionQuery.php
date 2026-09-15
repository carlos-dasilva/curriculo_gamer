<?php

namespace App\Domain\Collection\Services;

use App\Domain\Collection\Support\CollectionItems;
use App\Models\CollectionCompany;
use App\Models\Platform;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class CollectionQuery
{
    public function query(string $kind, int $ownerId, array $filters = []): Builder
    {
        $query = CollectionItems::model($kind)->newQuery()->where('user_id', $ownerId);
        $table = $query->getModel()->getTable();
        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function ($q) use ($kind, $term, $table) {
                if ($kind === 'jogos') {
                    $q->whereHas('game', fn ($game) => $game->where('name', 'like', $term));
                } elseif ($kind === 'consoles') {
                    $q->where('nickname', 'like', $term)->orWhereHas('platform', fn ($p) => $p->where('name', 'like', $term));
                } else {
                    $q->where($table.'.name', 'like', $term)->orWhere($table.'.model', 'like', $term);
                }
            });
        }
        if (! empty($filters['platform_id'])) {
            $kind === 'acessorios'
                ? $query->whereHas('platforms', fn ($p) => $p->where('platforms.id', $filters['platform_id']))
                : $query->where('platform_id', $filters['platform_id']);
        }
        if (! empty($filters['company_id'])) {
            $relation = $kind === 'acessorios' ? 'platforms.collectionCompanyMapping' : 'platform.collectionCompanyMapping';
            $query->whereHas($relation, fn ($mapping) => $mapping->where('company_id', $filters['company_id']));
        }
        foreach (CollectionItems::definition($kind)['fields'] as $field) {
            $key = $field['key'];
            if (in_array($key, ['platform_id', 'game_id', 'collection_console_id'])) {
                continue;
            }
            if (in_array($field['type'], ['catalog', 'media', 'connection', 'bool', 'score']) && isset($filters[$key]) && $filters[$key] !== '') {
                $query->where($key, $filters[$key]);
            }
        }
        $condition = $this->conditionColumn($kind);
        foreach (['condition_min' => '>=', 'condition_max' => '<='] as $key => $operator) {
            if (! empty($filters[$key])) {
                $query->where($condition, $operator, $filters[$key]);
            }
        }
        if (! empty($filters['acquired_from'])) {
            $query->where('acquired_at', '>=', $filters['acquired_from']);
        }
        if (! empty($filters['acquired_to'])) {
            $query->where('acquired_at', '<=', $filters['acquired_to']);
        }
        if ($kind === 'jogos' && ! empty($filters['completeness'])) {
            $query->where('media_type', 'physical');
            $this->completenessFilter($query, $filters['completeness']);
        }

        return $query;
    }

    public function completenessFilter(Builder $query, string $value): void
    {
        if ($value === 'cib') {
            $query->where('has_media', true)->where('has_box', true)->where('has_manual', true);
        } elseif ($value === 'boxed') {
            $query->where('has_media', true)->where('has_box', true)
                ->where(fn ($q) => $q->where('has_manual', false)->orWhereNull('has_manual'));
        } elseif ($value === 'loose') {
            $query->where('has_media', true)->where('has_box', false);
        }
    }

    public function conditionColumn(string $kind): string
    {
        return ['consoles' => 'aesthetic_condition', 'jogos' => 'overall_condition', 'acessorios' => 'condition'][$kind];
    }

    public function ordered(Builder $query, string $kind, string $sort): Builder
    {
        $table = $query->getModel()->getTable();
        $name = $kind === 'acessorios' ? 'name' : ($kind === 'jogos'
            ? DB::table('games')->select('name')->whereColumn('games.id', $table.'.game_id')->limit(1)
            : DB::table('platforms')->select('name')->whereColumn('platforms.id', $table.'.platform_id')->limit(1));
        $platform = DB::table('platforms')->select('name');
        if ($kind === 'acessorios') {
            $platform->join('user_collection_accessory_platform as compatible', 'compatible.platform_id', '=', 'platforms.id')
                ->whereColumn('compatible.accessory_id', $table.'.id');
        } else {
            $platform->whereColumn('platforms.id', $table.'.platform_id');
        }
        $platform->orderBy('name')->limit(1);
        $company = DB::table('collection_companies')->select('collection_companies.name')
            ->join('collection_platform_companies as ecosystem', 'ecosystem.company_id', '=', 'collection_companies.id');
        if ($kind === 'acessorios') {
            $company->join('user_collection_accessory_platform as compatible', 'compatible.platform_id', '=', 'ecosystem.platform_id')
                ->whereColumn('compatible.accessory_id', $table.'.id');
        } else {
            $company->whereColumn('ecosystem.platform_id', $table.'.platform_id');
        }
        $company->orderBy('collection_companies.name')->limit(1);
        match ($sort) {
            'name' => $query->orderBy($name),
            'oldest' => $query->orderBy($table.'.created_at'),
            'best' => $query->orderByDesc($this->conditionColumn($kind)),
            'worst' => $query->orderByRaw($query->getQuery()->getGrammar()->wrap($this->conditionColumn($kind)).' IS NULL')->orderBy($this->conditionColumn($kind)),
            'price' => $query->orderByDesc('purchase_price'),
            'quantity' => $kind === 'acessorios' ? $query->orderByDesc('quantity') : $query->orderBy($name),
            'platform' => $query->orderBy($platform),
            'company' => $query->orderBy($company),
            default => $query->orderByDesc($table.'.created_at'),
        };

        return $query->orderByDesc($table.'.id');
    }

    public function relations(string $kind): array
    {
        $relations = ['primaryImage'];
        foreach (CollectionItems::definition($kind)['fields'] as $field) {
            if ($field['type'] === 'catalog') {
                $relations[] = match ($field['key']) {
                    'digital_ownership_type_id' => 'digitalOwnershipType',
                    'functional_state_id' => 'functionalState',
                    'digital_store_id' => 'digitalStore', 'digital_service_id' => 'digitalService',
                    'acquisition_type_id' => 'acquisitionType', 'accessory_type_id' => 'accessoryType',
                    default => str_replace('_id', '', $field['key']),
                };
            }
        }

        return array_merge($relations, match ($kind) {
            'jogos' => ['game', 'platform.collectionCompanyMapping.company'],
            'consoles' => ['platform.collectionCompanyMapping.company'],
            default => ['platforms.collectionCompanyMapping.company', 'console.platform'],
        });
    }

    public function present(Model $item, string $kind): array
    {
        $title = match ($kind) {
            'jogos' => $item->game?->name ?? 'Jogo removido',
            'consoles' => $item->nickname ?: $item->platform->name,
            default => $item->name,
        };
        $badges = [];
        if ($kind === 'jogos') {
            $badges[] = $item->media_type === 'digital' ? 'Digital' : 'Físico';
            if ($item->media_type === 'physical') {
                if ($item->originality) {
                    $badges[] = $item->originality->name;
                }
                $badges[] = $this->completeness($item);
            } elseif ($item->digitalStore) {
                $badges[] = $item->digitalStore->name;
            }
        }
        if ($kind === 'consoles') {
            if ($item->functionalState) {
                $badges[] = $item->functionalState->name;
            }
            if ($item->has_box !== null) {
                $badges[] = $item->has_box ? 'Com caixa' : 'Sem caixa';
            }
            if ($item->box_serial_matches === true) {
                $badges[] = 'Serial correspondente';
            }
        }
        if ($kind === 'acessorios') {
            if ($item->classification) {
                $badges[] = $item->classification->name;
            }
            $badges[] = ['wired' => 'Com fio', 'wireless' => 'Sem fio', 'both' => 'Com e sem fio', 'unknown' => 'Conexão não informada'][$item->connection_type];
        }
        $condition = $item->{$this->conditionColumn($kind)};
        if ($condition) {
            $badges[] = $condition.'/10';
        }

        return [
            'id' => $item->id, 'kind' => $kind, 'title' => $title,
            'quantity' => $kind === 'acessorios' ? $item->quantity : 1,
            'platforms' => $kind === 'acessorios' ? $item->platforms->map->only(['id', 'name'])->values() : [$item->platform->only(['id', 'name'])],
            'image' => $item->primaryImage?->url ?? ($kind === 'jogos' ? $item->game?->cover_url : ($kind === 'consoles' ? $item->platform->cover_url : null)),
            'badges' => array_slice($badges, 0, 5),
            'purchase_price' => $item->purchase_price,
        ];
    }

    public function completeness(Model $game): string
    {
        if ($game->has_media && $game->has_box && $game->has_manual) {
            return 'CIB';
        }
        if ($game->has_media && $game->has_box) {
            return 'Com caixa';
        }
        if ($game->has_media && $game->has_box === false) {
            return 'Loose';
        }

        return $game->has_media === false ? 'Sem mídia' : 'Completude não informada';
    }

    public function totals(int $ownerId, array $filters = []): array
    {
        $result = ['items' => 0, 'investment' => 0, 'priced_items' => 0];
        foreach (array_keys(CollectionItems::DEFINITIONS) as $kind) {
            $query = $this->query($kind, $ownerId, $filters);
            $units = $kind === 'acessorios' ? 'quantity' : '1';
            $row = (clone $query)->selectRaw('COALESCE(SUM('.$units.'),0) as units, COALESCE(SUM(purchase_price),0) as investment, SUM(CASE WHEN purchase_price IS NOT NULL THEN '.$units.' ELSE 0 END) as priced')->first();
            $result[$kind] = (int) $row->units;
            $result['items'] += (int) $row->units;
            $result['priced_items'] += (int) $row->priced;
            $result['investment'] += (float) $row->investment;
        }
        $result['investment'] = number_format($result['investment'], 2, '.', '');
        $games = $this->query('jogos', $ownerId, $filters);
        foreach (['physical', 'digital'] as $type) {
            $result[$type] = (clone $games)->where('media_type', $type)->count();
        }
        foreach (['cib', 'boxed', 'loose'] as $label) {
            $q = (clone $games)->where('media_type', 'physical');
            $this->completenessFilter($q, $label);
            $result[$label] = $q->count();
        }

        return $result;
    }

    public function groups(int $ownerId, string $dimension): array
    {
        $union = null;
        foreach (array_keys(CollectionItems::DEFINITIONS) as $kind) {
            $table = CollectionItems::model($kind)->getTable();
            $query = DB::table($table.' as items')->where('items.user_id', $ownerId)->whereNull('items.deleted_at');
            $platform = 'items.platform_id';
            if ($kind === 'acessorios') {
                $query->join('user_collection_accessory_platform as compatible', 'compatible.accessory_id', '=', 'items.id');
                $platform = 'compatible.platform_id';
            }
            $group = $platform;
            if ($dimension === 'companies') {
                $query->join('collection_platform_companies as ecosystem', 'ecosystem.platform_id', '=', $platform);
                $group = 'ecosystem.company_id';
            }
            $query->selectRaw($group." as group_id, items.id as item_id, '".$kind."' as kind, ".($kind === 'acessorios' ? 'items.quantity' : '1').' as units')->distinct();
            $union = $union ? $union->unionAll($query) : $query;
        }
        $counts = DB::query()->fromSub($union, 'inventory')->selectRaw('group_id, SUM(units) as total')->groupBy('group_id')->pluck('total', 'group_id');
        $model = $dimension === 'companies' ? CollectionCompany::query() : Platform::query();

        return $model->whereIn('id', $counts->keys())->orderBy('name')->get(['id', 'name'])->map(fn ($row) => [
            'id' => $row->id, 'name' => $row->name, 'total' => (int) $counts[$row->id],
        ])->all();
    }

    public function breakdowns(int $ownerId, array $filters = []): array
    {
        $result = [];
        foreach ([
            ['jogos', 'originality_id', 'collection_originalities', 'Originalidade'],
            ['jogos', 'region_id', 'collection_regions', 'Regiões'],
            ['consoles', 'functional_state_id', 'collection_functional_states', 'Funcionamento dos consoles'],
            ['acessorios', 'classification_id', 'collection_accessory_classifications', 'Classificação dos acessórios'],
        ] as [$kind, $column, $catalog, $label]) {
            $table = CollectionItems::model($kind)->getTable();
            $q = $this->query($kind, $ownerId, $filters);
            if ($kind === 'jogos') {
                $q->where('media_type', 'physical');
            }
            $rows = $q->leftJoin($catalog.' as classification', 'classification.id', '=', $table.'.'.$column)
                ->selectRaw("classification.id, COALESCE(classification.name, 'Não informado') as name, SUM(".($kind === 'acessorios' ? 'quantity' : '1').') as total')
                ->groupBy('classification.id', 'classification.name')->get()->map(fn ($row) => ['name' => $row->name, 'total' => (int) $row->total, 'value' => $row->id]);
            $result[] = ['label' => $label, 'kind' => $kind, 'filter' => $column, 'rows' => $rows];
        }
        foreach (['consoles', 'acessorios'] as $kind) {
            $rows = $this->query($kind, $ownerId, $filters)->selectRaw('has_box, SUM('.($kind === 'acessorios' ? 'quantity' : '1').') as total')
                ->groupBy('has_box')->get()->map(fn ($row) => [
                    'name' => $row->has_box === null ? 'Não informado' : ($row->has_box ? 'Com caixa' : 'Sem caixa'),
                    'value' => $row->has_box === null ? null : (int) $row->has_box, 'total' => (int) $row->total,
                ]);
            $result[] = ['label' => 'Caixas — '.CollectionItems::definition($kind)['label'], 'kind' => $kind, 'filter' => 'has_box', 'rows' => $rows];
        }

        return $result;
    }
}
