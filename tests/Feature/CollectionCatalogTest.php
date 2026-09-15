<?php

namespace Tests\Feature;

use App\Models\CollectionCompany;
use App\Models\CollectionDigitalStore;
use App\Models\Platform;
use App\Models\User;
use Database\Seeders\CollectionCatalogSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CollectionCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_only_admin_can_manage_catalogs(): void
    {
        $this->actingAs(User::factory()->create())->postJson('/admin/colecao/cadastros/companies', [
            'name' => 'Sony', 'is_active' => true,
        ])->assertForbidden();
        $this->assertDatabaseCount('collection_companies', 0);
        $this->actingAs(User::factory()->create(['role' => 'admin']))
            ->post('/admin/colecao/cadastros/companies', ['name' => 'Sony', 'is_active' => true])->assertRedirect();
        $this->assertDatabaseHas('collection_companies', ['slug' => 'sony']);
    }

    public function test_admin_can_deactivate_store_and_map_platform_without_changing_legacy_manufacturer(): void
    {
        $this->seed(CollectionCatalogSeeder::class);
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $store = CollectionDigitalStore::firstOrFail();
        $this->put('/admin/colecao/cadastros/digital-stores/'.$store->id, [
            'name' => 'Loja revisada', 'slug' => $store->slug, 'is_active' => false, 'sort_order' => 2,
        ])->assertRedirect();
        $this->assertFalse($store->fresh()->is_active);
        $platform = Platform::create(['name' => 'PS2', 'manufacturer' => 'Legado']);
        $company = CollectionCompany::create(['name' => 'Sony', 'slug' => 'sony']);
        $this->put('/admin/colecao/plataformas/'.$platform->id, ['company_id' => $company->id])->assertRedirect();
        $this->assertSame('Legado', $platform->fresh()->manufacturer);
        $this->assertDatabaseHas('collection_platform_companies', ['platform_id' => $platform->id, 'company_id' => $company->id]);
    }

    public function test_invalid_catalogs_and_unsafe_image_urls_are_rejected(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $this->getJson('/admin/colecao/cadastros/users')->assertNotFound();
        foreach (['data:image/png;base64,AAA', 'file:///tmp/image.jpg', 'http://127.0.0.1/image.jpg'] as $url) {
            $this->postJson('/admin/colecao/cadastros/companies', ['name' => 'Sony', 'is_active' => true, 'logo_url' => $url])
                ->assertUnprocessable()->assertJsonValidationErrors('logo_url');
        }
    }
}
