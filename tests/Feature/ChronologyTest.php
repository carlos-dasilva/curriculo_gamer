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

    public function test_admin_can_edit_approved_chronology(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $creator = User::factory()->create();
        $studio = Studio::query()->create(['name' => 'Studio Teste']);

        $first = $this->createReleasedGame($studio, 'Primeiro Jogo');
        $second = $this->createReleasedGame($studio, 'Segundo Jogo');

        $chronology = Chronology::query()->create([
            'name' => 'Cronologia Aprovada',
            'description' => 'Descrição antiga.',
            'status' => 'liberado',
            'created_by' => $creator->id,
            'approved_by' => $admin->id,
        ]);

        $step = $chronology->steps()->create([
            'position' => 1,
            'title' => 'Parte antiga',
        ]);
        $step->stepGames()->create([
            'game_id' => $first->id,
            'position' => 1,
        ]);

        $this->actingAs($admin)
            ->get("/opcoes/cronologias/{$chronology->id}/editar")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Chronologies/Edit', false)
                ->where('abilities.canEdit', true)
            );

        $this->actingAs($admin)
            ->put("/opcoes/cronologias/{$chronology->id}", [
                'name' => 'Cronologia Aprovada Editada',
                'description' => 'Descrição nova.',
                'steps' => [
                    ['title' => 'Parte nova', 'game_ids' => [$first->id, $second->id]],
                ],
            ])
            ->assertRedirect(route('options.chronologies.edit', $chronology));

        $this->assertDatabaseHas('chronologies', [
            'id' => $chronology->id,
            'name' => 'Cronologia Aprovada Editada',
            'description' => 'Descrição nova.',
            'status' => 'liberado',
        ]);
        $this->assertDatabaseHas('chronology_steps', [
            'chronology_id' => $chronology->id,
            'position' => 1,
            'title' => 'Parte nova',
        ]);
        $this->assertDatabaseHas('chronology_step_games', [
            'game_id' => $second->id,
            'position' => 2,
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
}
