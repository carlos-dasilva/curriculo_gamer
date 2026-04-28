<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\Studio;
use App\Models\User;
use App\Models\UserGameBacklog;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
