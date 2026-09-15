<?php

namespace App\Domain\Collection\Support;

use Illuminate\Database\Eloquent\Model;

class CollectionCatalogs
{
    public const ENTRIES = [
        'regions' => [\App\Models\CollectionRegion::class, 'Regiões'],
        'originalities' => [\App\Models\CollectionOriginality::class, 'Originalidade'],
        'editions' => [\App\Models\CollectionEdition::class, 'Edições'],
        'functional-states' => [\App\Models\CollectionFunctionalState::class, 'Estados funcionais'],
        'accessory-types' => [\App\Models\CollectionAccessoryType::class, 'Tipos de acessórios'],
        'accessory-classifications' => [\App\Models\CollectionAccessoryClassification::class, 'Classificações de acessórios'],
        'acquisition-types' => [\App\Models\CollectionAcquisitionType::class, 'Formas de aquisição'],
        'digital-services' => [\App\Models\CollectionDigitalService::class, 'Serviços digitais'],
        'digital-ownership-types' => [\App\Models\CollectionDigitalOwnershipType::class, 'Posse digital'],
        'item-statuses' => [\App\Models\CollectionItemStatus::class, 'Status dos itens'],
        'digital-stores' => [\App\Models\CollectionDigitalStore::class, 'Lojas digitais'],
        'companies' => [\App\Models\CollectionCompany::class, 'Empresas'],
    ];

    public static function model(string $catalog): Model
    {
        abort_unless(isset(self::ENTRIES[$catalog]), 404);

        return new (self::ENTRIES[$catalog][0]);
    }

    public static function menu(): array
    {
        return collect(self::ENTRIES)->map(fn ($entry, $key) => ['key' => $key, 'label' => $entry[1]])->values()->all();
    }
}
