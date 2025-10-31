<?php

namespace App\Domain\Games\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use App\Models\Game;
use App\Models\UserGameInfo;
use Illuminate\Support\Facades\DB;
use App\Models\UserGameCommentRating;

class UserGameInfoController extends Controller
{
    public function setPlaying(Request $request, Game $game)
    {
        if (!auth()->check()) {
            abort(401);
        }
        $user = auth()->user();
        $user->currently_playing_game_id = $game->id;
        $user->save();

        return response()->json([
            'ok' => true,
            'currently_playing_game_id' => $user->currently_playing_game_id,
        ]);
    }

    public function save(Request $request, Game $game)
    {
        if (!auth()->check()) {
            abort(401);
        }

        $data = $request->validate([
            'score' => ['nullable','integer','min:0','max:10'],
            'difficulty' => ['nullable','integer','min:0','max:10'],
            'gameplay_hours' => ['nullable','integer','min:0'],
            'notes' => ['nullable','string','max:10000'],
        ]);

        // Regra: se nenhuma plataforma do usuário para este jogo tiver status
        // em {joguei, finalizei, cem_por_cento}, então score/difficulty/gameplay_hours
        // devem ser gravados como 0
        $hasProgress = \App\Models\UserGamePlatformStatus::query()
            ->where('user_id', auth()->id())
            ->where('game_id', $game->id)
            ->whereIn('status', ['joguei','finalizei','cem_por_cento'])
            ->exists();

        if (!$hasProgress) {
            $data['score'] = 0;
            $data['difficulty'] = 0;
            $data['gameplay_hours'] = 0;
            // Exclui o comentário (notes) se não houver progresso em nenhuma plataforma
            $data['notes'] = null;
        }

        $overall = null;
        $record = DB::transaction(function () use ($data, $game, &$overall) {
            // Verifica se o texto de notas foi alterado (normalizado)
            $prev = UserGameInfo::query()
                ->where('user_id', auth()->id())
                ->where('game_id', $game->id)
                ->first(['notes']);
            $prevNotes = is_null($prev?->notes) ? null : trim((string) $prev->notes);
            $newNotes = array_key_exists('notes', $data) ? (is_null($data['notes']) ? null : trim((string) $data['notes'])) : $prevNotes;

            $rec = UserGameInfo::query()->updateOrCreate(
                [
                    'user_id' => auth()->id(),
                    'game_id' => $game->id,
                ],
                [
                    'score' => $data['score'] ?? null,
                    'difficulty' => $data['difficulty'] ?? null,
                    'gameplay_hours' => $data['gameplay_hours'] ?? null,
                    'notes' => $data['notes'] ?? null,
                ]
            );

            // Se "Minhas considerações" (notes) foi alterado, apaga todas as pontuações associadas a este comentário
            $normalizedPrev = $prevNotes === '' ? null : $prevNotes;
            $normalizedNew = $newNotes === '' ? null : $newNotes;
            if ($normalizedPrev !== $normalizedNew) {
                UserGameCommentRating::query()
                    ->where('game_id', $game->id)
                    ->where('comment_user_id', auth()->id())
                    ->delete();
            }

            // Recalcula média (ignora notas 0)
            $avg = UserGameInfo::query()
                ->where('game_id', $game->id)
                ->whereBetween('score', [1, 10])
                ->avg('score');

            $overall = $avg !== null ? round((float) $avg, 2) : null;
            $game->update(['overall_score' => $overall]);

            return $rec;
        });

        // Calcula médias também para dificuldade e horas (ignorando zeros)
        $avgDifficulty = UserGameInfo::query()
            ->where('game_id', $game->id)
            ->whereBetween('difficulty', [1, 10])
            ->avg('difficulty');
        $avgDifficulty = $avgDifficulty !== null ? round((float) $avgDifficulty, 2) : null;

        $avgGameplay = UserGameInfo::query()
            ->where('game_id', $game->id)
            ->where('gameplay_hours', '>', 0)
            ->avg('gameplay_hours');
        $avgGameplay = $avgGameplay !== null ? round((float) $avgGameplay, 1) : null;

        // Atualiza campos agregados no jogo
        $game->update([
            'difficulty' => $avgDifficulty,
            'gameplay_hours' => $avgGameplay,
        ]);

        return response()->json([
            'ok' => true,
            'saved' => [
                'score' => $record->score,
                'difficulty' => $record->difficulty,
                'gameplay_hours' => $record->gameplay_hours,
                'notes' => $record->notes,
            ],
            'overall_score' => $overall,
            'avg_difficulty' => $avgDifficulty,
            'avg_gameplay_hours' => $avgGameplay,
        ]);
    }
}
