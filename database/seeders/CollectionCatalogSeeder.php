<?php

namespace Database\Seeders;

use App\Models\CollectionAccessoryClassification;
use App\Models\CollectionAccessoryType;
use App\Models\CollectionAcquisitionType;
use App\Models\CollectionDigitalOwnershipType;
use App\Models\CollectionDigitalService;
use App\Models\CollectionDigitalStore;
use App\Models\CollectionEdition;
use App\Models\CollectionFunctionalState;
use App\Models\CollectionItemStatus;
use App\Models\CollectionOriginality;
use App\Models\CollectionRegion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CollectionCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $catalogs = [
            CollectionRegion::class => ['NTSC-U', 'NTSC-J', 'PAL', 'PAL-M', 'Brasil', 'Europa', 'Japão', 'Estados Unidos', 'Outra'],
            CollectionOriginality::class => ['Original', 'Reprodução / Repro', 'Bootleg', 'Cópia', 'Não identificado', 'Outro'],
            CollectionEdition::class => ['Standard', 'Greatest Hits', 'Platinum', 'Player\'s Choice', 'Collector\'s Edition', 'Limited Edition', 'Steelbook', 'Edição brasileira', 'Outra'],
            CollectionFunctionalState::class => ['Funcionando perfeitamente', 'Funcionando com ressalvas', 'Necessita manutenção', 'Não funcionando', 'Não testado'],
            CollectionAccessoryType::class => ['Controle', 'Memory Card', 'Expansion Pak', 'Rumble Pak', 'Câmera', 'Headset', 'Dock', 'Fonte', 'Cabo', 'Adaptador', 'Volante', 'Arcade Stick', 'Light Gun', 'Cartão de memória', 'Carregador', 'Case', 'Suporte', 'Sensor', 'Microfone', 'Teclado', 'Mouse', 'Outros'],
            CollectionAccessoryClassification::class => ['Oficial / First-party', 'Licenciado', 'Third-party', 'Genérico', 'Não identificado'],
            CollectionAcquisitionType::class => ['Comprado', 'Resgatado gratuitamente', 'Presente', 'Assinatura', 'Bundle', 'Código promocional', 'Outro'],
            CollectionDigitalService::class => ['PlayStation Plus', 'Xbox Game Pass', 'Nintendo Switch Online', 'Amazon Prime Gaming', 'Epic Games', 'Humble Bundle'],
            CollectionDigitalOwnershipType::class => ['Permanente', 'Dependente de assinatura', 'Desconhecido'],
            CollectionItemStatus::class => ['Na coleção'],
            CollectionDigitalStore::class => ['Steam', 'PlayStation Store', 'Microsoft Store', 'Xbox Store', 'Nintendo eShop', 'Epic Games Store', 'GOG', 'Battle.net', 'EA App', 'Ubisoft Connect'],
        ];

        DB::transaction(function () use ($catalogs) {
            foreach ($catalogs as $model => $names) {
                foreach ($names as $position => $name) {
                    $model::firstOrCreate(
                        ['slug' => Str::slug($name)],
                        ['name' => $name, 'sort_order' => $position, 'is_active' => true],
                    );
                }
            }
        });
    }
}
