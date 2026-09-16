<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminGameSortingTest extends TestCase
{
    use RefreshDatabase;

    private function createGame(array $attributes): Game
    {
        $studio = \App\Models\Studio::firstOrCreate(['name' => 'Sorting Studio']);
        return Game::create(['studio_id' => $studio->id] + $attributes);
    }

    public function test_sorting_dates_names_and_scores_with_missing_values_last(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $alpha = $this->createGame(['name' => 'Alpha', 'overall_score' => 8, 'metacritic_metascore' => 90, 'metacritic_user_score' => 7]);
        $beta = $this->createGame(['name' => 'Beta', 'overall_score' => 2, 'metacritic_metascore' => 40, 'metacritic_user_score' => 3]);
        $gamma = $this->createGame(['name' => 'Gamma']);
        $alpha->forceFill(['created_at' => '2026-01-03', 'updated_at' => '2026-02-01'])->save();
        $beta->forceFill(['created_at' => '2026-01-01', 'updated_at' => '2026-02-03'])->save();
        $gamma->forceFill(['created_at' => '2026-01-02', 'updated_at' => '2026-02-02'])->save();
        $cases = [
            '' => [$alpha->id, $gamma->id, $beta->id],
            'invalid' => [$alpha->id, $gamma->id, $beta->id],
            'oldest' => [$beta->id, $gamma->id, $alpha->id],
            'updated' => [$beta->id, $gamma->id, $alpha->id],
            'name_asc' => [$alpha->id, $beta->id, $gamma->id],
            'name_desc' => [$gamma->id, $beta->id, $alpha->id],
        ];
        foreach (['score', 'metascore', 'user_score'] as $score) {
            $cases[$score.'_asc'] = [$beta->id, $alpha->id, $gamma->id];
            $cases[$score.'_desc'] = [$alpha->id, $beta->id, $gamma->id];
        }
        foreach ($cases as $sort => $ids) {
            $this->get('/admin/jogos?'.http_build_query(['sort' => $sort]))
                ->assertOk()->assertInertia(fn (Assert $page) => $page
                    ->component('Admin/Games/Index', false)
                    ->where('filters.sort', in_array($sort, ['', 'invalid']) ? 'newest' : $sort)
                    ->where('games.data', fn ($rows) => collect($rows)->pluck('id')->all() === $ids));
        }
    }

    public function test_sorting_preserves_filters_pagination_and_stable_ties(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'admin']));
        $ids = [];
        for ($i = 0; $i < 17; $i++) {
            $game = $this->createGame(['name' => 'Matching '.$i, 'status' => 'liberado', 'overall_score' => 8]);
            $ids[] = $game->id;
        }
        $this->createGame(['name' => 'Matching', 'status' => 'inativo', 'overall_score' => 10]);
        $this->createGame(['name' => 'Other', 'status' => 'liberado', 'overall_score' => 10]);
        $url = '/admin/jogos?name=Matching&status=liberado&sort=score_desc';
        $this->get($url)->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('games.total', 17)
            ->where('games.data', fn ($rows) => collect($rows)->pluck('id')->all() === array_slice(array_reverse($ids), 0, 15))
            ->where('games.next_page_url', function ($url) {
                parse_str(parse_url($url, PHP_URL_QUERY), $query);
                return $query === ['name' => 'Matching', 'status' => 'liberado', 'sort' => 'score_desc', 'page' => '2'];
            }));
        $this->get($url.'&page=2')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('games.data', fn ($rows) => collect($rows)->pluck('id')->all() === [$ids[1], $ids[0]]));
    }
}
