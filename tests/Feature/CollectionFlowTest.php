<?php

namespace Tests\Feature;

use App\Models\CollectionAccessoryType;
use App\Models\CollectionAcquisitionType;
use App\Models\CollectionCompany;
use App\Models\CollectionDigitalStore;
use App\Models\CollectionItemStatus;
use App\Models\CollectionPlatformCompany;
use App\Models\Game;
use App\Models\Platform;
use App\Models\Studio;
use App\Models\User;
use App\Models\UserCollectionAccessory;
use App\Models\UserCollectionConsole;
use App\Models\UserCollectionGame;
use Database\Seeders\CollectionCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CollectionFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $owner;

    private Platform $platform;

    private Game $game;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CollectionCatalogSeeder::class);
        $this->owner = User::factory()->create();
        $this->platform = Platform::create(['name' => 'PlayStation 2']);
        $studio = Studio::create(['name' => 'Estúdio']);
        $this->game = Game::create(['name' => 'Resident Evil 4', 'studio_id' => $studio->id, 'status' => 'liberado']);
        $this->game->platforms()->attach($this->platform);
        $this->actingAs($this->owner);
    }

    private function console(array $extra = []): array
    {
        return array_replace(['platform_id' => $this->platform->id, 'nickname' => 'Sala', 'images' => []], $extra);
    }

    private function game(array $extra = []): array
    {
        return array_replace(['game_id' => $this->game->id, 'platform_id' => $this->platform->id,
            'media_type' => 'physical', 'images' => [], 'has_media' => true, 'has_box' => true, 'has_manual' => true], $extra);
    }

    private function accessory(array $extra = []): array
    {
        return array_replace(['name' => 'Controle', 'accessory_type_id' => CollectionAccessoryType::firstOrFail()->id,
            'quantity' => 2, 'platform_ids' => [$this->platform->id], 'connection_type' => 'wired', 'images' => []], $extra);
    }

    public function test_console_crud_images_and_conditional_box_fields(): void
    {
        $images = [
            ['url' => 'https://example.com/a.jpg', 'description' => 'Frente', 'is_primary' => false],
            ['url' => 'https://example.com/b.jpg', 'description' => 'Verso', 'is_primary' => false],
        ];
        $this->post('/minha-colecao/consoles', $this->console(['images' => $images, 'has_box' => true, 'box_serial_matches' => true]))
            ->assertRedirect();
        $item = UserCollectionConsole::firstOrFail();
        $this->assertSame($this->owner->id, $item->user_id);
        $this->assertSame(1, $item->images()->where('is_primary', true)->count());
        $this->assertSame('https://example.com/a.jpg', $item->primaryImage->url);
        $this->get('/minha-colecao/consoles/'.$item->id)->assertOk()->assertInertia(fn (Assert $p) => $p->component('Collection/Show', false)->where('card.title', 'Sala'));
        $this->get('/minha-colecao/consoles/'.$item->id.'/editar')->assertOk()->assertInertia(fn (Assert $p) => $p->component('Collection/Form', false));
        $images[1]['is_primary'] = true;
        $this->put('/minha-colecao/consoles/'.$item->id, $this->console([
            'nickname' => 'Quarto', 'images' => array_reverse($images), 'has_box' => false, 'box_serial_matches' => true, 'box_condition' => 9,
        ]))->assertRedirect();
        $this->assertNull($item->fresh()->box_serial_matches);
        $this->assertNull($item->fresh()->box_condition);
        $this->assertSame(2, $item->images()->count());
        $this->assertSame('https://example.com/b.jpg', $item->fresh()->primaryImage->url);
        $this->delete('/minha-colecao/consoles/'.$item->id)->assertRedirect('/minha-colecao/consoles');
        $this->assertSoftDeleted($item);
        $this->get('/minha-colecao/consoles/'.$item->id)->assertNotFound();
    }

    public function test_owner_isolation_for_all_item_routes_and_lookup(): void
    {
        $this->post('/minha-colecao/consoles', $this->console())->assertRedirect();
        $this->post('/minha-colecao/jogos', $this->game())->assertRedirect();
        $this->post('/minha-colecao/acessorios', $this->accessory())->assertRedirect();
        $other = User::factory()->create();
        $this->actingAs($other);
        foreach (['consoles' => UserCollectionConsole::firstOrFail(), 'jogos' => UserCollectionGame::firstOrFail(), 'acessorios' => UserCollectionAccessory::firstOrFail()] as $kind => $item) {
            $url = '/minha-colecao/'.$kind.'/'.$item->id;
            $this->get($url)->assertNotFound();
            $this->get($url.'/editar')->assertNotFound();
            $this->putJson($url, ['images' => []])->assertNotFound();
            $this->delete($url)->assertNotFound();
            $this->get('/minha-colecao/'.$kind)->assertOk()->assertInertia(fn (Assert $p) => $p->has('items.data', 0));
        }
        $this->getJson('/minha-colecao/buscar/consoles')->assertOk()->assertExactJson([]);
        $this->get('/minha-colecao')->assertOk()->assertInertia(fn (Assert $p) => $p->where('totals.items', 0));
        $this->postJson('/minha-colecao/consoles', $this->console(['user_id' => $this->owner->id]))
            ->assertUnprocessable()->assertJsonValidationErrors('user_id');
    }

    public function test_game_platform_and_physical_digital_transitions(): void
    {
        $wrong = Platform::create(['name' => 'GameCube']);
        $this->postJson('/minha-colecao/jogos', $this->game(['platform_id' => $wrong->id]))
            ->assertUnprocessable()->assertJsonValidationErrors('platform_id');
        $this->post('/minha-colecao/jogos', $this->game(['overall_condition' => 8]))->assertRedirect();
        $item = UserCollectionGame::firstOrFail();
        $store = CollectionDigitalStore::firstOrFail();
        $acquisition = CollectionAcquisitionType::firstOrFail();
        $payload = $this->game(['media_type' => 'digital', 'digital_store_id' => $store->id,
            'acquisition_type_id' => $acquisition->id, 'overall_condition' => 8, 'has_box' => true]);
        $this->put('/minha-colecao/jogos/'.$item->id, $payload)->assertRedirect();
        $this->assertNull($item->fresh()->has_box);
        $this->assertNull($item->fresh()->overall_condition);
        $this->assertSame($store->id, $item->fresh()->digital_store_id);
        $store->update(['is_active' => false]);
        $this->put('/minha-colecao/jogos/'.$item->id, $payload)->assertRedirect();
        $this->postJson('/minha-colecao/jogos', $payload)->assertUnprocessable()->assertJsonValidationErrors('digital_store_id');
        $this->put('/minha-colecao/jogos/'.$item->id, $this->game(['digital_store_id' => $store->id]))->assertRedirect();
        $this->assertNull($item->fresh()->digital_store_id);
        $this->assertTrue($item->fresh()->has_media);
    }

    public function test_accessory_console_must_be_owned_and_compatible(): void
    {
        $this->post('/minha-colecao/consoles', $this->console())->assertRedirect();
        $console = UserCollectionConsole::firstOrFail();
        $this->post('/minha-colecao/acessorios', $this->accessory(['collection_console_id' => $console->id]))->assertRedirect();
        $pc = Platform::create(['name' => 'PC']);
        $this->postJson('/minha-colecao/acessorios', $this->accessory(['platform_ids' => [$pc->id], 'collection_console_id' => $console->id]))
            ->assertUnprocessable()->assertJsonValidationErrors('collection_console_id');
        $this->actingAs(User::factory()->create());
        $this->postJson('/minha-colecao/acessorios', $this->accessory(['collection_console_id' => $console->id]))
            ->assertUnprocessable()->assertJsonValidationErrors('collection_console_id');
    }

    public function test_validation_limits_and_image_protocols(): void
    {
        foreach ([0, -1, 1.5] as $quantity) {
            $this->postJson('/minha-colecao/acessorios', $this->accessory(['quantity' => $quantity]))
                ->assertUnprocessable()->assertJsonValidationErrors('quantity');
        }
        $this->postJson('/minha-colecao/consoles', $this->console(['aesthetic_condition' => 11, 'purchase_price' => -2]))
            ->assertUnprocessable()->assertJsonValidationErrors(['aesthetic_condition', 'purchase_price']);
        foreach (['data:image/png;base64,AAA', 'javascript:alert(1)', 'file:///image.png', 'http://localhost/image.png'] as $url) {
            $this->postJson('/minha-colecao/consoles', $this->console(['images' => [['url' => $url, 'is_primary' => true]]]))
                ->assertUnprocessable()->assertJsonValidationErrors('images.0.url');
        }
        $this->postJson('/minha-colecao/consoles', $this->console(['images' => [
            ['url' => 'https://example.com/a.jpg', 'is_primary' => true], ['url' => 'https://example.com/b.jpg', 'is_primary' => true],
        ]]))->assertUnprocessable()->assertJsonValidationErrors('images');
        $this->assertDatabaseCount('user_collection_consoles', 0);
    }

    public function test_dashboard_counts_compatible_accessory_once_per_company_and_totals_group_price_once(): void
    {
        $company = CollectionCompany::create(['name' => 'Sony', 'slug' => 'sony']);
        $ps3 = Platform::create(['name' => 'PlayStation 3']);
        foreach ([$ps3, $this->platform] as $platform) {
            CollectionPlatformCompany::create(['platform_id' => $platform->id, 'company_id' => $company->id]);
        }
        $this->post('/minha-colecao/consoles', $this->console(['purchase_price' => 100]))->assertRedirect();
        $this->post('/minha-colecao/jogos', $this->game(['purchase_price' => 50]))->assertRedirect();
        $this->post('/minha-colecao/acessorios', $this->accessory(['platform_ids' => [$ps3->id, $this->platform->id], 'quantity' => 3, 'purchase_price' => 60]))->assertRedirect();
        $this->get('/minha-colecao')->assertOk()->assertInertia(fn (Assert $p) => $p
            ->where('totals.items', 5)->where('totals.acessorios', 3)->where('totals.investment', '210.00')
            ->where('totals.cib', 1)->where('companies.0.total', 5)->has('sections.acessorios', 1));
        $this->get('/minha-colecao?company_id='.$company->id)->assertOk()->assertInertia(fn (Assert $p) => $p->where('scope.name', 'Sony')->where('totals.items', 5));
        $this->get('/minha-colecao?platform_id='.$ps3->id)->assertOk()->assertInertia(fn (Assert $p) => $p->where('totals.items', 3));
        $this->get('/minha-colecao?q=Resident')->assertOk()->assertInertia(fn (Assert $p) => $p->where('totals.items', 1));
    }

    public function test_combined_filters_ordering_pagination_and_list_payload(): void
    {
        $this->post('/minha-colecao/jogos', $this->game(['overall_condition' => 9]))->assertRedirect();
        $this->post('/minha-colecao/jogos', $this->game(['has_box' => false, 'has_manual' => false, 'overall_condition' => 4]))->assertRedirect();
        $this->get('/minha-colecao/jogos?completeness=cib&condition_min=8&q=Resident&platform_id='.$this->platform->id)
            ->assertOk()->assertInertia(fn (Assert $p) => $p->has('items.data', 1)->where('items.data.0.badges.1', 'CIB')->missing('items.data.0.images'));
        foreach (['consoles', 'jogos', 'acessorios'] as $kind) {
            foreach (['name', 'oldest', 'best', 'worst', 'price', 'platform', 'company', 'quantity'] as $sort) {
                $this->get('/minha-colecao/'.$kind.'?sort='.$sort)->assertOk();
            }
        }
        $this->getJson('/minha-colecao/jogos?sort=invalid')->assertUnprocessable();
    }

    public function test_collection_pages_require_authentication(): void
    {
        auth()->logout();
        $this->getJson('/minha-colecao')->assertUnauthorized();
        $this->getJson('/minha-colecao/buscar/games')->assertUnauthorized();
        $this->postJson('/minha-colecao/consoles', $this->console())->assertUnauthorized();
    }

    public function test_game_list_is_paginated_and_keeps_filters_without_loading_galleries(): void
    {
        $status = CollectionItemStatus::where('slug', 'na-colecao')->firstOrFail();
        for ($i = 0; $i < 30; $i++) {
            $copy = $this->owner->collectionGames()->create([
                'game_id' => $this->game->id, 'platform_id' => $this->platform->id,
                'item_status_id' => $status->id, 'media_type' => 'physical',
            ]);
            $copy->images()->create(['url' => 'https://example.com/cover.jpg', 'is_primary' => true]);
            $copy->images()->create(['url' => 'https://example.com/secondary.jpg', 'is_primary' => false]);
        }
        $this->get('/minha-colecao/jogos?q=Resident&sort=name')->assertOk()->assertInertia(fn (Assert $p) => $p
            ->has('items.data', 24)->where('items.total', 30)->where('items.data.0.image', 'https://example.com/cover.jpg')
            ->where('filters.q', 'Resident')->missing('items.data.0.images'));
        $this->get('/minha-colecao/jogos?q=Resident&sort=name&page=2')->assertOk()->assertInertia(fn (Assert $p) => $p
            ->has('items.data', 6)->where('items.current_page', 2));
    }

    public function test_catalog_removal_preserves_owned_copy_and_platform_deletion_has_clear_feedback(): void
    {
        $this->post('/minha-colecao/jogos', $this->game())->assertRedirect();
        $item = UserCollectionGame::firstOrFail();
        $this->game->platforms()->detach();
        $this->game->delete();
        $this->get('/minha-colecao/jogos/'.$item->id.'/editar')->assertOk()
            ->assertInertia(fn (Assert $p) => $p->where('selectedGame.platforms.0.id', $this->platform->id));
        $this->put('/minha-colecao/jogos/'.$item->id, $this->game(['notes' => 'Cópia preservada']))->assertRedirect();
        $this->assertSame('Cópia preservada', $item->fresh()->notes);
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $this->delete('/admin/plataformas/'.$this->platform->id)->assertRedirect('/admin/plataformas')->assertSessionHas('error');
        $this->assertDatabaseHas('platforms', ['id' => $this->platform->id]);
    }

    public function test_private_collection_content_is_not_written_to_system_logs(): void
    {
        \App\Models\SiteSetting::create(['system_logs_enabled' => true]);
        $previous = storage_path();
        $temporary = sys_get_temp_dir().DIRECTORY_SEPARATOR.'collection-log-'.bin2hex(random_bytes(8));
        mkdir($temporary);
        $this->app->useStoragePath($temporary);
        $logPath = $temporary.DIRECTORY_SEPARATOR.'logs'.DIRECTORY_SEPARATOR.'log-'.now()->format('Ymd').'.log';
        try {
            $request = \Illuminate\Http\Request::create('/minha-colecao?q=private-search', 'POST', ['notes' => 'private-note']);
            $route = new \Illuminate\Routing\Route('POST', 'minha-colecao', fn () => null);
            $route->name('collection.store');
            $request->setRouteResolver(fn () => $route);
            (new \App\Http\Middleware\SystemRequestLogger)->handle($request, fn () => response()->json(['serial' => 'private-serial']));
            $contents = file_get_contents($logPath);
            foreach (['private-search', 'private-note', 'private-serial'] as $value) {
                $this->assertStringNotContainsString($value, $contents);
            }
            $this->assertStringContainsString('collection.store', $contents);
        } finally {
            $this->app->useStoragePath($previous);
            if (is_file($logPath)) {
                unlink($logPath);
            }
            if (is_dir($temporary.DIRECTORY_SEPARATOR.'logs')) {
                rmdir($temporary.DIRECTORY_SEPARATOR.'logs');
            }
            rmdir($temporary);
        }
    }
}
