<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\Studio;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class GameStatusTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_create_and_filter_inactive_games(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $studio = Studio::query()->create(['name' => 'Studio Teste']);

        $this->actingAs($admin)
            ->post('/admin/jogos', [
                'name' => 'Jogo Inativo',
                'studio_id' => $studio->id,
                'status' => 'inativo',
            ])
            ->assertRedirect();

        $game = Game::query()->where('name', 'Jogo Inativo')->firstOrFail();

        $this->assertSame('inativo', $game->status);

        Game::query()->create([
            'studio_id' => $studio->id,
            'name' => 'Jogo Liberado',
            'status' => 'liberado',
        ]);

        $this->actingAs($admin)
            ->get('/admin/jogos?status=inativo')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Games/Index', false)
                ->where('filters.status', 'inativo')
                ->has('games.data', 1)
                ->where('games.data.0.id', $game->id)
                ->where('games.data.0.status', 'inativo')
            );
    }

    public function test_inactive_game_does_not_open_on_public_game_page(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $studio = Studio::query()->create(['name' => 'Studio Teste']);
        $game = Game::query()->create([
            'studio_id' => $studio->id,
            'name' => 'Jogo Oculto',
            'status' => 'inativo',
        ]);

        $this->actingAs($admin)
            ->get("/jogos/{$game->id}")
            ->assertRedirect(route('home'));
    }
}
