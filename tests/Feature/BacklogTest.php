<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\Platform;
use App\Models\Studio;
use App\Models\User;
use App\Models\UserGameBacklog;
use App\Models\UserGamePlatformStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BacklogTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_add_reorder_and_remove_backlog_games(): void
    {
        $user = User::factory()->create();
        $studio = Studio::query()->create(['name' => 'Studio Teste']);

        $first = $this->createReleasedGame($studio, 'Jogo A');
        $second = $this->createReleasedGame($studio, 'Jogo B');
        $third = $this->createReleasedGame($studio, 'Jogo C');

        $this->actingAs($user)
            ->postJson("/jogos/{$first->id}/backlog")
            ->assertOk()
            ->assertJsonPath('is_backlogged', true)
            ->assertJsonPath('position', 1);

        $this->actingAs($user)
            ->postJson("/jogos/{$second->id}/backlog")
            ->assertOk()
            ->assertJsonPath('position', 2);

        $this->actingAs($user)
            ->postJson("/jogos/{$third->id}/backlog")
            ->assertOk()
            ->assertJsonPath('position', 3);

        $this->actingAs($user)
            ->putJson('/meu-backlog/ordem', [
                'game_ids' => [$third->id, $first->id, $second->id],
            ])
            ->assertOk();

        $this->assertSame(1, $this->positionFor($user->id, $third->id));
        $this->assertSame(2, $this->positionFor($user->id, $first->id));
        $this->assertSame(3, $this->positionFor($user->id, $second->id));

        $this->actingAs($user)
            ->deleteJson("/jogos/{$first->id}/backlog")
            ->assertOk()
            ->assertJsonPath('is_backlogged', false);

        $this->assertDatabaseMissing('user_game_backlogs', [
            'user_id' => $user->id,
            'game_id' => $first->id,
        ]);
        $this->assertSame(1, $this->positionFor($user->id, $third->id));
        $this->assertSame(2, $this->positionFor($user->id, $second->id));
    }

    public function test_curriculum_now_playing_uses_top_backlog_game(): void
    {
        $user = User::factory()->create();
        $studio = Studio::query()->create(['name' => 'Studio Teste']);

        $first = $this->createReleasedGame($studio, 'Topo do Backlog');
        $second = $this->createReleasedGame($studio, 'Segundo do Backlog');

        UserGameBacklog::query()->create(['user_id' => $user->id, 'game_id' => $first->id, 'position' => 1]);
        UserGameBacklog::query()->create(['user_id' => $user->id, 'game_id' => $second->id, 'position' => 2]);

        $this->actingAs($user)
            ->get('/meu-curriculo')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Curriculum/Index', false)
                ->where('nowPlaying.id', $first->id)
                ->where('nowPlaying.name', 'Topo do Backlog')
            );
    }

    public function test_public_backlog_can_be_viewed_without_authentication_as_read_only(): void
    {
        $user = User::factory()->create();
        $studio = Studio::query()->create(['name' => 'Studio Teste']);

        $released = $this->createReleasedGame($studio, 'Jogo Público');
        $draft = Game::query()->create([
            'studio_id' => $studio->id,
            'name' => 'Jogo em Avaliação',
            'status' => 'avaliacao',
        ]);

        UserGameBacklog::query()->create(['user_id' => $user->id, 'game_id' => $released->id, 'position' => 1]);
        UserGameBacklog::query()->create(['user_id' => $user->id, 'game_id' => $draft->id, 'position' => 2]);

        $this->get("/backlog/{$user->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Backlog/Index', false)
                ->where('editable', false)
                ->where('subject.id', $user->id)
                ->where('subject.isMe', false)
                ->has('items', 1)
                ->where('items.0.game.id', $released->id)
                ->where('items.0.game.name', 'Jogo Público')
            );
    }

    public function test_game_leaves_backlog_only_when_status_changes_to_finished_or_one_hundred_percent(): void
    {
        $user = User::factory()->create();
        $studio = Studio::query()->create(['name' => 'Studio Teste']);
        $platform = Platform::query()->create(['name' => 'Plataforma Teste']);
        $game = $this->createReleasedGame($studio, 'Jogo com Progresso');
        $game->platforms()->attach($platform->id);

        UserGameBacklog::query()->create(['user_id' => $user->id, 'game_id' => $game->id, 'position' => 1]);
        UserGamePlatformStatus::query()->create([
            'user_id' => $user->id,
            'game_id' => $game->id,
            'platform_id' => $platform->id,
            'status' => 'finalizei',
        ]);

        $this->actingAs($user)
            ->postJson("/jogos/{$game->id}/plataformas/{$platform->id}/status", ['status' => 'finalizei'])
            ->assertOk()
            ->assertJsonPath('is_backlogged', true)
            ->assertJsonPath('backlog_removed', false);

        $this->assertDatabaseHas('user_game_backlogs', [
            'user_id' => $user->id,
            'game_id' => $game->id,
        ]);

        $this->actingAs($user)
            ->postJson("/jogos/{$game->id}/plataformas/{$platform->id}/status", ['status' => 'cem_por_cento'])
            ->assertOk()
            ->assertJsonPath('is_backlogged', false)
            ->assertJsonPath('backlog_removed', true);

        $this->assertDatabaseMissing('user_game_backlogs', [
            'user_id' => $user->id,
            'game_id' => $game->id,
        ]);
    }

    private function createReleasedGame(Studio $studio, string $name): Game
    {
        return Game::query()->create([
            'studio_id' => $studio->id,
            'name' => $name,
            'status' => 'liberado',
        ]);
    }

    private function positionFor(int $userId, int $gameId): int
    {
        return (int) UserGameBacklog::query()
            ->where('user_id', $userId)
            ->where('game_id', $gameId)
            ->value('position');
    }
}
