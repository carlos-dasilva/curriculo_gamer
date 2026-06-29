<?php

namespace App\Domain\Chronologies\Services;

use App\Models\Chronology;
use Illuminate\Support\Facades\DB;

class ChronologyProgressService
{
    private const COMPLETED_STATUSES = ['finalizei', 'cem_por_cento'];

    public function listForUser(int $userId): array
    {
        $rows = DB::table('chronologies as c')
            ->join('chronology_steps as cs', 'cs.chronology_id', '=', 'c.id')
            ->leftJoin('chronology_step_games as csg', 'csg.chronology_step_id', '=', 'cs.id')
            ->leftJoin('user_game_platform_statuses as ugps', function ($join) use ($userId) {
                $join->on('ugps.game_id', '=', 'csg.game_id')
                    ->where('ugps.user_id', '=', $userId)
                    ->whereIn('ugps.status', self::COMPLETED_STATUSES);
            })
            ->where('c.status', 'liberado')
            ->whereNull('c.deleted_at')
            ->select([
                'c.id',
                'c.name',
                'c.description',
                DB::raw('COUNT(DISTINCT cs.id) as total_steps'),
                DB::raw('COUNT(DISTINCT CASE WHEN ugps.id IS NOT NULL THEN cs.id END) as completed_steps'),
            ])
            ->groupBy('c.id', 'c.name', 'c.description')
            ->get();

        $ids = $rows->pluck('id')->map(fn ($id) => (int) $id)->all();
        $covers = $this->coverUrlsByChronology($ids);

        return $rows
            ->map(function ($row) use ($covers) {
                $total = max(0, (int) $row->total_steps);
                $completed = max(0, (int) $row->completed_steps);

                return [
                    'id' => (int) $row->id,
                    'name' => (string) $row->name,
                    'description' => $row->description,
                    'total_steps' => $total,
                    'completed_steps' => $completed,
                    'completion_percent' => $total > 0 ? (int) round(($completed / $total) * 100) : 0,
                    'cover_urls' => $covers[(int) $row->id] ?? [],
                ];
            })
            ->filter(fn ($row) => $row['completed_steps'] > 0)
            ->sort(function ($a, $b) {
                $percent = $b['completion_percent'] <=> $a['completion_percent'];
                if ($percent !== 0) {
                    return $percent;
                }

                $steps = $b['completed_steps'] <=> $a['completed_steps'];
                if ($steps !== 0) {
                    return $steps;
                }

                return strcasecmp($a['name'], $b['name']);
            })
            ->values()
            ->all();
    }

    public function detailForUser(Chronology $chronology, int $userId): array
    {
        $chronology->load([
            'steps.stepGames.game' => fn ($query) => $query->select(['id', 'name', 'cover_url', 'status']),
        ]);

        $gameIds = $chronology->steps
            ->flatMap(fn ($step) => $step->stepGames->pluck('game_id'))
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $statusByGame = $this->bestStatusByGame($userId, $gameIds);

        $steps = $chronology->steps->map(function ($step) use ($statusByGame) {
            $games = $step->stepGames
                ->map(function ($stepGame) use ($statusByGame) {
                    $game = $stepGame->game;
                    if (!$game) {
                        return null;
                    }

                    $status = $statusByGame[(int) $game->id] ?? null;

                    return [
                        'id' => (int) $game->id,
                        'name' => (string) $game->name,
                        'cover_url' => $game->cover_url,
                        'status' => $status['status'] ?? null,
                        'status_label' => $status['label'] ?? 'Não concluído',
                        'is_completed' => (bool) ($status['is_completed'] ?? false),
                        'is_perfected' => (bool) (($status['status'] ?? null) === 'cem_por_cento'),
                        'platforms' => $status['platforms'] ?? [],
                    ];
                })
                ->filter()
                ->values()
                ->all();

            $completed = collect($games)->contains(fn ($game) => (bool) $game['is_completed']);

            return [
                'id' => (int) $step->id,
                'position' => (int) $step->position,
                'title' => $step->title,
                'is_completed' => $completed,
                'games' => $games,
            ];
        })->values()->all();

        $total = count($steps);
        $completed = collect($steps)->filter(fn ($step) => (bool) $step['is_completed'])->count();

        return [
            'chronology' => [
                'id' => (int) $chronology->id,
                'name' => (string) $chronology->name,
                'description' => $chronology->description,
            ],
            'progress' => [
                'total_steps' => $total,
                'completed_steps' => $completed,
                'completion_percent' => $total > 0 ? (int) round(($completed / $total) * 100) : 0,
            ],
            'steps' => $steps,
        ];
    }

    private function bestStatusByGame(int $userId, array $gameIds): array
    {
        if (empty($gameIds)) {
            return [];
        }

        $rank = [
            'nao_joguei' => 0,
            'quero_jogar' => 1,
            'joguei' => 2,
            'finalizei' => 3,
            'cem_por_cento' => 4,
        ];

        $labels = [
            'nao_joguei' => 'Não joguei',
            'quero_jogar' => 'Quero jogar',
            'joguei' => 'Joguei',
            'finalizei' => 'Finalizei',
            'cem_por_cento' => 'Fiz 100%',
        ];

        $rows = DB::table('user_game_platform_statuses as ugps')
            ->leftJoin('platforms as p', 'p.id', '=', 'ugps.platform_id')
            ->where('ugps.user_id', $userId)
            ->whereIn('ugps.game_id', $gameIds)
            ->select(['ugps.game_id', 'ugps.status', 'p.name as platform_name'])
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $gameId = (int) $row->game_id;
            $status = (string) $row->status;
            $currentRank = $rank[$map[$gameId]['status'] ?? 'nao_joguei'] ?? 0;
            $incomingRank = $rank[$status] ?? 0;

            if (!isset($map[$gameId]) || $incomingRank > $currentRank) {
                $map[$gameId] = [
                    'status' => $status,
                    'label' => $labels[$status] ?? $status,
                    'is_completed' => in_array($status, self::COMPLETED_STATUSES, true),
                    'platforms' => [],
                ];
            }

            if (in_array($status, self::COMPLETED_STATUSES, true) && $row->platform_name) {
                $map[$gameId]['platforms'][] = [
                    'name' => (string) $row->platform_name,
                    'status' => $status,
                    'label' => $labels[$status] ?? $status,
                ];
            }
        }

        foreach ($map as $gameId => $status) {
            $map[$gameId]['platforms'] = collect($status['platforms'])
                ->unique(fn ($platform) => $platform['name'].'|'.$platform['status'])
                ->values()
                ->all();
        }

        return $map;
    }

    private function coverUrlsByChronology(array $chronologyIds): array
    {
        if (empty($chronologyIds)) {
            return [];
        }

        $rows = DB::table('chronology_steps as cs')
            ->join('chronology_step_games as csg', 'csg.chronology_step_id', '=', 'cs.id')
            ->join('games as g', 'g.id', '=', 'csg.game_id')
            ->whereIn('cs.chronology_id', $chronologyIds)
            ->whereNotNull('g.cover_url')
            ->whereNull('g.deleted_at')
            ->orderBy('cs.position')
            ->orderBy('csg.position')
            ->get(['cs.chronology_id', 'g.cover_url']);

        $covers = [];
        foreach ($rows as $row) {
            $id = (int) $row->chronology_id;
            $covers[$id] ??= [];
            if (count($covers[$id]) < 4 && !in_array($row->cover_url, $covers[$id], true)) {
                $covers[$id][] = (string) $row->cover_url;
            }
        }

        return $covers;
    }
}
