<?php

namespace Tests\Feature;

use App\Models\CollectionAccessoryType;
use App\Models\CollectionCompany;
use App\Models\CollectionDigitalStore;
use App\Models\CollectionItemStatus;
use App\Models\CollectionPlatformCompany;
use App\Models\Game;
use App\Models\Platform;
use App\Models\Studio;
use App\Models\User;
use Database\Seeders\CollectionCatalogSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CollectionSchemaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CollectionCatalogSeeder::class);
    }

    public function test_catalog_seeding_is_repeatable_and_preserves_customizations(): void
    {
        $store = CollectionDigitalStore::where('slug', 'steam')->firstOrFail();
        $store->update(['name' => 'Minha Steam', 'is_active' => false, 'sort_order' => 99]);
        $count = CollectionDigitalStore::count();

        $this->seed(CollectionCatalogSeeder::class);

        $this->assertSame($count, CollectionDigitalStore::count());
        $this->assertSame('Minha Steam', $store->fresh()->name);
        $this->assertFalse($store->fresh()->is_active);
        $this->assertSame(99, $store->fresh()->sort_order);
        $this->assertSame(0, CollectionCompany::count());
        $this->assertSame(0, CollectionPlatformCompany::count());
    }

    public function test_repeated_consoles_and_game_copies_keep_individual_data(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $platform = Platform::create(['name' => 'PlayStation 2']);
        $console = $owner->collectionConsoles()->create($this->consoleData($platform) + [
            'nickname' => 'Sala', 'box_serial_matches' => null, 'aesthetic_condition' => 8,
        ]);
        $second = $owner->collectionConsoles()->create($this->consoleData($platform) + [
            'nickname' => 'Quarto', 'box_serial_matches' => false,
        ]);
        $game = $this->game($platform);
        $copy = $owner->collectionGames()->create([
            'game_id' => $game->id, 'platform_id' => $platform->id,
            'item_status_id' => $this->statusId(), 'media_type' => 'physical',
            'purchase_price' => '123.45', 'has_manual' => true,
        ]);
        $owner->collectionGames()->create([
            'game_id' => $game->id, 'platform_id' => $platform->id,
            'item_status_id' => $this->statusId(), 'media_type' => 'physical',
        ]);

        $this->assertSame(2, $owner->collectionConsoles()->count());
        $this->assertSame(2, $owner->collectionGames()->count());
        $this->assertSame(0, $other->collectionConsoles()->count());
        $this->assertSame(0, $other->collectionGames()->count());
        $this->assertNull($console->fresh()->box_serial_matches);
        $this->assertFalse($second->fresh()->box_serial_matches);
        $this->assertTrue($copy->fresh()->has_manual);
        $this->assertSame('123.45', $copy->fresh()->purchase_price);
        $this->assertSame($owner->id, $console->user->id);
        $this->assertFalse($console->isFillable('user_id'));
        $this->assertFalse($copy->isFillable('user_id'));

        $game->delete();
        $this->assertSame($game->id, $copy->fresh()->game->id);
    }

    public function test_accessory_quantity_and_compatibility_do_not_duplicate_inventory(): void
    {
        $owner = User::factory()->create();
        $platform = Platform::create(['name' => 'Nintendo Switch']);
        $pc = Platform::create(['name' => 'PC']);
        $company = CollectionCompany::create(['name' => 'Nintendo', 'slug' => 'nintendo']);
        $manufacturer = CollectionCompany::create(['name' => '8BitDo', 'slug' => '8bitdo']);
        CollectionPlatformCompany::create(['platform_id' => $platform->id, 'company_id' => $company->id]);
        $console = $owner->collectionConsoles()->create($this->consoleData($platform));
        $accessory = $owner->collectionAccessories()->create([
            'name' => 'Ultimate', 'quantity' => 3, 'manufacturer_id' => $manufacturer->id,
            'collection_console_id' => $console->id,
            'accessory_type_id' => CollectionAccessoryType::firstOrFail()->id,
            'item_status_id' => $this->statusId(),
        ]);
        $accessory->platforms()->sync([$platform->id, $pc->id]);

        $this->assertSame(2, $accessory->platforms()->count());
        $this->assertSame(1, $owner->collectionAccessories()->count());
        $this->assertSame(3, (int) $owner->collectionAccessories()->sum('quantity'));
        $this->assertSame($company->id, $platform->collectionCompanyMapping->company->id);
        $this->assertSame($manufacturer->id, $accessory->manufacturer->id);
        $this->assertSame($accessory->id, $manufacturer->accessories->sole()->id);
        $this->assertSame($platform->id, $company->platforms->sole()->id);
        $this->assertSame($console->id, $accessory->console->id);
        $this->assertFalse($accessory->isFillable('user_id'));

        $console->forceDelete();
        $this->assertNull($accessory->fresh()->collection_console_id);
    }

    public function test_digital_copy_uses_store_and_leaves_physical_attributes_unknown(): void
    {
        $owner = User::factory()->create();
        $platform = Platform::create(['name' => 'PC']);
        $game = $this->game($platform);
        $store = CollectionDigitalStore::where('slug', 'steam')->firstOrFail();
        $copy = $owner->collectionGames()->create([
            'game_id' => $game->id, 'platform_id' => $platform->id,
            'item_status_id' => $this->statusId(), 'media_type' => 'digital',
            'digital_store_id' => $store->id,
        ])->fresh();

        $this->assertSame($store->id, $copy->digitalStore->id);
        $this->assertNull($copy->has_box);
        $this->assertNull($copy->overall_condition);
        $this->assertNull($copy->digital_service_id);
    }

    public function test_images_and_items_survive_soft_deletion_and_are_removed_with_owner(): void
    {
        $owner = User::factory()->create();
        $platform = Platform::create(['name' => 'Saturn']);
        $console = $owner->collectionConsoles()->create($this->consoleData($platform));
        $copy = $owner->collectionGames()->create([
            'game_id' => $this->game($platform)->id, 'platform_id' => $platform->id,
            'item_status_id' => $this->statusId(), 'media_type' => 'physical',
        ]);
        $accessory = $owner->collectionAccessories()->create([
            'name' => 'Controle', 'collection_console_id' => $console->id,
            'accessory_type_id' => CollectionAccessoryType::firstOrFail()->id,
            'item_status_id' => $this->statusId(),
        ])->fresh();
        $this->assertSame(1, $accessory->quantity);
        $accessory->platforms()->attach($platform);

        foreach ([$console, $copy, $accessory] as $item) {
            $later = $item->images()->create(['url' => 'https://example.com/later.jpg', 'sort_order' => 5]);
            $first = $item->images()->create(['url' => 'https://example.com/first.jpg', 'is_primary' => true]);
            $this->assertSame($first->id, $item->images->first()->id);
            $item->delete();
            $this->assertSoftDeleted($item);
            $this->assertSame(2, $item->images()->count());
            $item->restore();
            $this->assertSame($later->url, $item->images()->get()->last()->url);
        }

        $owner->delete();
        foreach (['consoles', 'games', 'accessories', 'console_images', 'game_images', 'accessory_images', 'accessory_platform'] as $suffix) {
            $this->assertDatabaseCount('user_collection_'.$suffix, 0);
        }
        $this->assertDatabaseHas('platforms', ['id' => $platform->id]);
    }

    public function test_referenced_platform_cannot_be_deleted(): void
    {
        $platform = Platform::create(['name' => 'Saturn']);
        User::factory()->create()->collectionConsoles()->create($this->consoleData($platform));
        $this->expectException(QueryException::class);
        $platform->delete();
    }

    public function test_invalid_foreign_key_is_rejected(): void
    {
        $owner = User::factory()->create();
        $this->expectException(QueryException::class);
        $owner->collectionConsoles()->create([
            'platform_id' => 999999, 'item_status_id' => $this->statusId(),
        ]);
    }

    public function test_platform_has_only_one_ecosystem_mapping(): void
    {
        $platform = Platform::create(['name' => 'Saturn']);
        $company = CollectionCompany::create(['name' => 'Sega', 'slug' => 'sega']);
        CollectionPlatformCompany::create(['platform_id' => $platform->id, 'company_id' => $company->id]);
        $this->expectException(QueryException::class);
        CollectionPlatformCompany::create(['platform_id' => $platform->id, 'company_id' => $company->id]);
    }

    public function test_collection_migrations_can_be_reversed_and_reapplied_without_changing_catalog(): void
    {
        $platform = Platform::create(['name' => 'Catálogo preservado', 'manufacturer' => 'Legado']);
        $files = glob(database_path('migrations/2026_09_15_*create*collection*.php'));
        $this->assertCount(3, $files);
        foreach (array_reverse($files) as $file) {
            (require $file)->down();
        }
        $this->assertFalse(Schema::hasTable('user_collection_consoles'));
        $this->assertDatabaseHas('platforms', ['id' => $platform->id, 'manufacturer' => 'Legado']);
        foreach ($files as $file) {
            (require $file)->up();
        }
        $this->seed(CollectionCatalogSeeder::class);
        $this->assertTrue(Schema::hasTable('user_collection_consoles'));
        $this->assertGreaterThan(0, DB::table('collection_regions')->count());
    }

    private function statusId(): int
    {
        return CollectionItemStatus::where('slug', 'na-colecao')->firstOrFail()->id;
    }

    private function consoleData(Platform $platform): array
    {
        return ['platform_id' => $platform->id, 'item_status_id' => $this->statusId()];
    }

    private function game(Platform $platform): Game
    {
        $studio = Studio::create(['name' => 'Estúdio Teste']);
        $game = Game::create(['name' => 'Jogo Teste', 'studio_id' => $studio->id, 'status' => 'liberado']);
        $game->platforms()->attach($platform);

        return $game;
    }
}
