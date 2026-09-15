<?php

namespace App\Domain\Collection\Services;

use App\Domain\Collection\Support\CollectionItems;
use App\Models\CollectionItemStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class CollectionItemWriter
{
    public function save(string $kind, int $ownerId, array $data, ?int $id = null): Model
    {
        return DB::transaction(function () use ($kind, $ownerId, $data, $id) {
            $item = $id ? CollectionItems::model($kind)->newQuery()->where('user_id', $ownerId)->lockForUpdate()->findOrFail($id)
                : CollectionItems::model($kind);
            $images = $data['images'];
            $platforms = $data['platform_ids'] ?? [];
            unset($data['images'], $data['platform_ids']);
            if (! $id) {
                $item->user_id = $ownerId;
                $item->item_status_id = CollectionItemStatus::firstOrCreate(
                    ['slug' => 'na-colecao'], ['name' => 'Na coleção', 'is_active' => true, 'sort_order' => 0]
                )->id;
            }
            $item->fill($data);
            if ($kind === 'acessorios' && ! $item->connection_type) {
                $item->connection_type = 'unknown';
            }
            $item->save();
            if ($kind === 'acessorios') {
                $item->platforms()->sync($platforms);
            }
            $item->images()->delete();
            $hasPrimary = collect($images)->contains(fn ($image) => (bool) $image['is_primary']);
            foreach (array_values($images) as $position => $image) {
                $item->images()->create([
                    'url' => $image['url'], 'description' => $image['description'] ?? null,
                    'sort_order' => $position, 'is_primary' => $hasPrimary ? (bool) $image['is_primary'] : $position === 0,
                ]);
            }

            return $item;
        });
    }
}
