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

    public function test_acquisition_date_round_trips_through_edit_for_all_item_types(): void
    {
        foreach (['consoles' => 'console', 'jogos' => 'game', 'acessorios' => 'accessory'] as $kind => $factory) {
            $payload = $this->{$factory}(['acquired_at' => '2024-02-29']);
            $this->post('/minha-colecao/'.$kind, $payload)->assertRedirect();
            $item = \App\Domain\Collection\Support\CollectionItems::model($kind)->newQuery()->firstOrFail();
            $url = '/minha-colecao/'.$kind.'/'.$item->id;
            $this->assertSame('2024-02-29', $item->acquired_at->format('Y-m-d'));
            $this->get($url.'/editar')->assertOk()->assertInertia(fn (Assert $p) => $p->where('item.acquired_at', '2024-02-29'));
            $this->put($url, array_replace($payload, ['acquired_at' => '2024-03-01']))->assertRedirect();
            $this->get($url.'/editar')->assertInertia(fn (Assert $p) => $p->where('item.acquired_at', '2024-03-01'));
            $this->get($url)->assertInertia(fn (Assert $p) => $p->where('item.acquired_at', '2024-03-01'));
            auth()->logout();
            $this->get('/colecao/'.$this->owner->id.'/'.$kind.'/'.$item->id)->assertInertia(fn (Assert $p) => $p->where('item.acquired_at', '2024-03-01'));
            $this->actingAs($this->owner);
            $this->put($url, array_replace($payload, ['acquired_at' => '']))->assertRedirect();
            $this->assertNull($item->fresh()->acquired_at);
            $this->get($url.'/editar')->assertInertia(fn (Assert $p) => $p->where('item.acquired_at', null));
        }
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

    public function test_sales_page_filters_only_priced_items_and_preserves_privacy(): void
    {
        $this->post('/minha-colecao/consoles', $this->console(['sale_price' => 300, 'purchase_price' => 150, 'serial_number' => 'PRIVATE',
            'images' => [['url' => 'https://example.com/sale.jpg', 'description' => 'Capa', 'is_primary' => true]],
        ]))->assertRedirect();
        $console = UserCollectionConsole::firstOrFail();
        $this->post('/minha-colecao/jogos', $this->game(['sale_price' => 0]))->assertRedirect();
        $this->post('/minha-colecao/acessorios', $this->accessory(['sale_price' => 90]))->assertRedirect();
        $this->post('/minha-colecao/consoles', $this->console())->assertRedirect();
        $deleted = $console->replicate();
        $deleted->save();
        $deleted->delete();
        $company = CollectionCompany::create(['name' => 'Sony', 'slug' => 'sony']);
        CollectionPlatformCompany::create(['platform_id' => $this->platform->id, 'company_id' => $company->id]);
        $url = '/colecao/'.$this->owner->id.'/a-venda';
        $this->get('/minha-colecao/a-venda')->assertOk()->assertInertia(fn (Assert $p) => $p
            ->component('Collection/Sales', false)->where('isOwner', true)->where('items.total', 3)
            ->where('shareUrl', url($url)));
        $other = User::factory()->create();
        $this->actingAs($other);
        $this->post('/minha-colecao/consoles', $this->console(['sale_price' => 25]))->assertRedirect();
        foreach ([$other, null] as $viewer) {
            if (! $viewer) {
                auth()->logout();
            }
            $this->get($url.'?sort=price_asc')->assertOk()->assertInertia(fn (Assert $p) => $p
                ->where('items.total', 3)->where('isOwner', false)
                ->where('items.data.0.kind', 'jogos')->where('items.data.0.sale_price', '0.00')
                ->where('items.data.1.kind', 'acessorios')->where('items.data.2.kind', 'consoles')
                ->where('items.data.2.image', 'https://example.com/sale.jpg')
                ->missing('items.data.2.purchase_price')->missing('items.data.2.serial_number'));
            $this->get($url.'?kind=consoles&q=Sala&price_min=100&price_max=400&platform_id='.$this->platform->id.'&company_id='.$company->id)
                ->assertOk()->assertInertia(fn (Assert $p) => $p->where('items.total', 1)->where('items.data.0.id', $console->id));
            $this->get($url.'?sort=price_desc')->assertInertia(fn (Assert $p) => $p->where('items.data.0.sale_price', '300.00'));
            $this->get($url.'?sort=name')->assertInertia(fn (Assert $p) => $p->where('items.data.0.title', 'Controle'));
            $this->get($url.'?price_max=0')->assertInertia(fn (Assert $p) => $p->where('items.total', 1));
            $this->get($url.'?q=inexistente')->assertInertia(fn (Assert $p) => $p->where('items.total', 0));
            $this->get('/colecao/'.$this->owner->id.'/consoles/'.$console->id)->assertOk()->assertInertia(fn (Assert $p) => $p
                ->missing('item.serial_number')->missing('item.purchase_price'));
        }
        $this->getJson($url.'?kind=invalid')->assertUnprocessable();
        $this->getJson($url.'?price_min=10&price_max=5')->assertUnprocessable();
        $this->get('/colecao/999999/a-venda')->assertNotFound();
        $console->update(['sale_price' => null]);
        $this->get($url.'?kind=consoles')->assertInertia(fn (Assert $p) => $p->where('items.total', 0));
    }

    public function test_sales_pagination_keeps_filters_and_owner_scope(): void
    {
        $this->post('/minha-colecao/consoles', $this->console(['sale_price' => 10]))->assertRedirect();
        $console = UserCollectionConsole::firstOrFail();
        for ($i = 0; $i < 25; $i++) {
            $console->replicate()->save();
        }
        auth()->logout();
        $url = '/colecao/'.$this->owner->id.'/a-venda?kind=consoles&sort=price_asc';
        $this->get($url)->assertInertia(fn (Assert $p) => $p->where('items.total', 26)->has('items.data', 24)
            ->where('items.next_page_url', fn ($url) => str_contains($url, 'kind=consoles') && str_contains($url, 'page=2')));
        $this->get($url.'&page=2')->assertInertia(fn (Assert $p) => $p->has('items.data', 2));
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

    public function test_public_collection_hides_purchase_prices_from_guests_and_other_users(): void
    {
        $this->post('/minha-colecao/consoles', $this->console(['purchase_price' => '1234.56', 'sale_price' => '1700.00', 'serial_number' => 'PRIVATE-CONSOLE-123']))->assertRedirect();
        $console = UserCollectionConsole::firstOrFail();
        $this->post('/minha-colecao/jogos', $this->game(['purchase_price' => '234.56']))->assertRedirect();
        $this->post('/minha-colecao/acessorios', $this->accessory([
            'purchase_price' => '345.67', 'sale_price' => '450.00', 'collection_console_id' => $console->id,
            'serial_number' => 'PRIVATE-ACCESSORY-456',
            'images' => [['url' => 'https://example.com/controller.jpg', 'description' => 'Controle', 'is_primary' => true]],
        ]))->assertRedirect();
        $items = ['consoles' => $console, 'jogos' => UserCollectionGame::firstOrFail(), 'acessorios' => UserCollectionAccessory::firstOrFail()];
        $url = '/colecao/'.$this->owner->id;
        foreach ([null, User::factory()->create(), User::factory()->create(['role' => 'admin'])] as $viewer) {
            if ($viewer) {
                $this->actingAs($viewer);
            } else {
                auth()->logout();
            }
            $this->get($url)->assertOk()->assertInertia(fn (Assert $p) => $p
                ->where('isOwner', false)->where('totals.items', 4)
                ->missing('totals.investment')->missing('totals.priced_items')
                ->missing('sections.consoles.0.purchase_price')->missing('sections.jogos.0.purchase_price')
                ->missing('sections.acessorios.0.purchase_price')->missing('collectionOwner.email'));
            foreach ($items as $kind => $item) {
                $this->get($url.'/'.$kind)->assertOk()->assertInertia(fn (Assert $p) => $p
                    ->has('items.data', 1)->missing('items.data.0.purchase_price'));
                $this->get($url.'/'.$kind.'/'.$item->id)->assertOk()->assertInertia(fn (Assert $p) => $p
                    ->where('isOwner', false)->missing('item.purchase_price')->missing('card.purchase_price')
                    ->missing('item.console.purchase_price')->where('item.sale_price', $item->sale_price)
                    ->missing('item.serial_number')->missing('item.console.serial_number')
                    ->where('fields', fn ($fields) => ! collect($fields)->contains('key', 'serial_number')));
                $this->getJson($url.'/'.$kind.'?sort=price')->assertUnprocessable()->assertJsonValidationErrors('sort');
                $this->getJson('/minha-colecao/'.$kind.'/'.$item->id.'/exportar')->assertStatus($viewer ? 404 : 401);
            }
            $this->get($url.'/acessorios/'.$items['acessorios']->id)->assertInertia(fn (Assert $p) => $p
                ->where('item.images.0.url', 'https://example.com/controller.jpg')->where('item.console.nickname', 'Sala'));
        }
        $this->actingAs($this->owner)->get($url)->assertInertia(fn (Assert $p) => $p
            ->where('isOwner', true)->where('totals.investment', '1814.79'));
        $this->get($url.'/consoles/'.$console->id)->assertInertia(fn (Assert $p) => $p->where('item.purchase_price', '1234.56'));
        foreach (['consoles' => 'PRIVATE-CONSOLE-123', 'acessorios' => 'PRIVATE-ACCESSORY-456'] as $kind => $serial) {
            $this->get($url.'/'.$kind.'/'.$items[$kind]->id)->assertInertia(fn (Assert $p) => $p->where('item.serial_number', $serial));
            $privateUrl = '/minha-colecao/'.$kind.'/'.$items[$kind]->id;
            $this->get($privateUrl)->assertInertia(fn (Assert $p) => $p->where('item.serial_number', $serial));
            $export = $this->get($privateUrl.'/exportar')->assertOk();
            $this->assertSame($serial, json_decode($export->streamedContent(), true, 512, JSON_THROW_ON_ERROR)['item']['serial_number']);
        }
        $other = User::factory()->create();
        $this->get('/colecao/'.$other->id.'/consoles/'.$console->id)->assertNotFound();
        $console->delete();
        $this->get($url.'/consoles/'.$console->id)->assertNotFound();
        $this->get('/colecao/999999')->assertNotFound();
    }

    public function test_sale_prices_and_owner_json_export_for_all_kinds(): void
    {
        foreach (['consoles' => 'console', 'jogos' => 'game', 'acessorios' => 'accessory'] as $kind => $factory) {
            $payload = $this->{$factory}([
                'purchase_price' => '100.50', 'sale_price' => '250.75', 'notes' => 'Descrição do item',
                'images' => [
                    ['url' => 'https://example.com/front.jpg', 'description' => 'Frente', 'is_primary' => true],
                    ['url' => 'https://example.com/back.jpg', 'description' => 'Verso', 'is_primary' => false],
                ],
            ]);
            foreach ([-1, '12.345', 'invalid', '10000000000'] as $invalid) {
                $this->postJson('/minha-colecao/'.$kind, array_replace($payload, ['sale_price' => $invalid]))
                    ->assertUnprocessable()->assertJsonValidationErrors('sale_price');
            }
            $this->post('/minha-colecao/'.$kind, $payload)->assertRedirect();
            $item = \App\Domain\Collection\Support\CollectionItems::model($kind)->newQuery()->firstOrFail();
            $url = '/minha-colecao/'.$kind.'/'.$item->id;
            $this->assertSame('250.75', $item->sale_price);
            $response = $this->get($url.'/exportar')->assertOk()->assertDownload('colecao-'.$kind.'-'.$item->id.'.json');
            $this->assertStringContainsString('no-store', $response->headers->get('Cache-Control'));
            $data = json_decode($response->streamedContent(), true, 512, JSON_THROW_ON_ERROR);
            $this->assertSame($kind, $data['kind']);
            $this->assertSame('100.50', $data['item']['purchase_price']);
            $this->assertSame('250.75', $data['item']['sale_price']);
            $this->assertSame('Descrição do item', $data['item']['notes']);
            $this->assertSame(['https://example.com/front.jpg', 'https://example.com/back.jpg'], array_column($data['item']['images'], 'url'));
            $this->assertArrayHasKey('item_status', $data['item']);
            foreach (['0' => '0.00', '' => null] as $price => $expected) {
                $this->put($url, array_replace($payload, ['sale_price' => $price]))->assertRedirect();
                $this->assertSame($expected, $item->fresh()->sale_price);
            }
            $this->delete($url)->assertRedirect();
            $this->get($url.'/exportar')->assertNotFound();
        }
    }
}
