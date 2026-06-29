<?php

namespace Tests\Feature;

use App\Models\Chronology;
use App\Models\Game;
use App\Models\Platform;
use App\Models\Studio;
use App\Models\User;
use App\Models\UserGamePlatformStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ChronologyTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_chronology_and_admin_can_approve_it(): void
    {
        $user = User::factory()->create();
        $admin = User::factory()->create(['role' => 'admin']);
        $studio = Studio::query()->create(['name' => 'Studio Teste']);
        $platform = Platform::query()->create(['name' => 'Plataforma Teste']);

        $original = $this->createReleasedGame($studio, 'Jogo Original');
        $remake = $this->createReleasedGame($studio, 'Jogo Remake');
        $sequel = $this->createReleasedGame($studio, 'Jogo Sequência');

        $this->actingAs($user)
            ->post('/opcoes/cronologias', [
                'name' => 'Cronologia Teste',
                'description' => 'Ordem principal da série.',
                'steps' => [
                    ['title' => 'Parte inicial', 'game_ids' => [$original->id, $remake->id]],
                    ['title' => 'Continuação', 'game_ids' => [$sequel->id]],
                ],
            ])
            ->assertRedirect(route('options.index', ['tab' => 'cronologias']));

        $chronology = Chronology::query()->where('name', 'Cronologia Teste')->firstOrFail();

        $this->assertSame('avaliacao', $chronology->status);
        $this->assertDatabaseCount('chronology_steps', 2);
        $this->assertDatabaseCount('chronology_step_games', 3);

        $this->actingAs($admin)
            ->put("/admin/cronologias/{$chronology->id}/liberar")
            ->assertRedirect();

        $this->assertDatabaseHas('chronologies', [
            'id' => $chronology->id,
            'status' => 'liberado',
            'approved_by' => $admin->id,
        ]);

        UserGamePlatformStatus::query()->create([
            'user_id' => $user->id,
            'game_id' => $remake->id,
            'platform_id' => $platform->id,
            'status' => 'finalizei',
        ]);

        $this->actingAs($user)
            ->get('/meu-curriculo?view=chronologies')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Curriculum/Index', false)
                ->where('view', 'chronologies')
                ->has('chronologies', 1)
                ->where('chronologies.0.id', $chronology->id)
                ->where('chronologies.0.completed_steps', 1)
                ->where('chronologies.0.total_steps', 2)
                ->where('chronologies.0.completion_percent', 50)
            );

        $this->actingAs($user)
            ->get("/meu-curriculo/cronologias/{$chronology->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Chronologies/Show', false)
                ->where('progress.completed_steps', 1)
                ->where('progress.total_steps', 2)
                ->where('steps.0.is_completed', true)
                ->where('steps.0.games.1.id', $remake->id)
                ->where('steps.0.games.1.is_completed', true)
                ->where('steps.1.is_completed', false)
            );
    }

    private function createReleasedGame(Studio $studio, string $name): Game
    {
        return Game::query()->create([
            'studio_id' => $studio->id,
            'name' => $name,
            'status' => 'liberado',
        ]);
    }
}
