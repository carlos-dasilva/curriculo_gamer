<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\Studio;
use App\Models\Tag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SyncApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.sync_api.token' => 'sync-test-token']);
    }

    public function test_sync_api_can_check_game_by_rawg_id(): void
    {
        $this->withToken('sync-test-token')
            ->getJson('/api/sync/games/rawg/12345')
            ->assertOk()
            ->assertJsonPath('exists', false)
            ->assertJsonPath('rawg_id', 12345)
            ->assertJsonPath('data', null);

        $studio = Studio::query()->create(['name' => 'Studio Existente']);

        Game::query()->create([
            'rawg_id' => 12345,
            'studio_id' => $studio->id,
            'name' => 'Jogo RAWG Existente',
            'status' => 'liberado',
        ]);

        $this->withToken('sync-test-token')
            ->getJson('/api/sync/games/rawg/12345')
            ->assertOk()
            ->assertJsonPath('exists', true)
            ->assertJsonPath('data.rawg_id', 12345)
            ->assertJsonPath('data.name', 'Jogo RAWG Existente');
    }

    public function test_sync_api_can_create_game_from_enriched_payload_and_prevent_duplicate_rawg_id(): void
    {
        $payload = [
            'id' => 98765,
            'rawg_id' => 98765,
            'name' => 'Jogo Novo RAWG',
            'cover_url' => 'https://example.com/cover.jpg',
            'status' => 'liberado',
            'studio' => ['id' => null, 'name' => 'Studio Novo'],
            'age_rating' => '12+',
            'description' => 'Descricao em PT-BR.',
            'hours_to_finish' => 14,
            'metacritic_metascore' => 82,
            'metacritic_user_score' => 7.8,
            'ptbr_subtitled' => true,
            'ptbr_dubbed' => false,
            'tags' => [
                ['id' => null, 'name' => 'Adventure', 'slug' => 'adventure'],
            ],
            'platforms' => [
                ['id' => null, 'name' => 'PC', 'release_date' => '2026-04-01'],
            ],
            'images' => [
                ['url' => 'https://example.com/image-1.jpg', 'sort_order' => 0],
            ],
            'external_links' => [
                ['label' => 'Trailer oficial', 'url' => 'https://example.com/trailer'],
            ],
        ];

        $this->withToken('sync-test-token')
            ->postJson('/api/sync/games', $payload)
            ->assertCreated()
            ->assertJsonPath('data.rawg_id', 98765)
            ->assertJsonPath('data.name', 'Jogo Novo RAWG')
            ->assertJsonPath('data.studio.name', 'Studio Novo')
            ->assertJsonPath('data.ptbr_subtitled', true)
            ->assertJsonPath('data.platforms.0.name', 'PC')
            ->assertJsonPath('data.images.0.url', 'https://example.com/image-1.jpg')
            ->assertJsonPath('data.external_links.0.label', 'Trailer oficial');

        $this->assertDatabaseHas('games', [
            'rawg_id' => 98765,
            'name' => 'Jogo Novo RAWG',
            'times_updated' => 1,
        ]);

        $this->withToken('sync-test-token')
            ->postJson('/api/sync/games', $payload)
            ->assertStatus(409)
            ->assertJsonPath('exists', true)
            ->assertJsonPath('data.rawg_id', 98765);
    }

    public function test_sync_api_exposes_tags_catalog(): void
    {
        Tag::query()->create(['name' => 'Action', 'slug' => 'action']);

        $this->withToken('sync-test-token')
            ->getJson('/api/sync/tags-catalog')
            ->assertOk()
            ->assertJsonPath('tags_catalog.0.name', 'Action')
            ->assertJsonPath('tags_catalog.0.slug', 'action')
            ->assertJsonPath('rules.max_tags', 8);
    }
}
