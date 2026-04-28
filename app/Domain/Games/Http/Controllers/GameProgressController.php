<?php

namespace App\Domain\Games\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use App\Models\Game;
use App\Models\Platform;
use App\Models\UserGameBacklog;
use App\Models\UserGamePlatformStatus;
use Illuminate\Support\Facades\DB;

class GameProgressController extends Controller
{
    public function update(Request $request, Game $game, Platform $platform)
    {
        if (!auth()->check()) {
            abort(401);
        }

        $status = (string) $request->input('status', '');
        $allowed = ['nao_joguei','quero_jogar','joguei','finalizei','cem_por_cento'];
        if (!in_array($status, $allowed, true)) {
            return response()->json(['message' => 'Status inválido.'], 422);
        }

        // Garante que a plataforma pertence ao jogo
        $belongs = $game->platforms()->wherePivot('platform_id', $platform->id)->exists();
        if (!$belongs) {
            return response()->json(['message' => 'Plataforma não associada ao jogo.'], 422);
        }

        $userId = (int) auth()->id();

        $record = DB::transaction(function () use ($userId, $game, $platform, $status) {
            $previous = UserGamePlatformStatus::query()
                ->where('user_id', $userId)
                ->where('game_id', $game->id)
                ->where('platform_id', $platform->id)
                ->first();

            $previousStatus = $previous?->status;

            $record = UserGamePlatformStatus::query()->updateOrCreate(
                [
                    'user_id' => $userId,
                    'game_id' => $game->id,
                    'platform_id' => $platform->id,
                ],
                [
                    'status' => $status,
                ]
            );

            if (in_array($status, ['finalizei','cem_por_cento'], true) && $previousStatus !== $status) {
                $deleted = UserGameBacklog::query()
                    ->where('user_id', $userId)
                    ->where('game_id', $game->id)
                    ->delete();

                if ($deleted > 0) {
                    $this->normalizeBacklogPositions($userId);
                }
            }

            return $record;
        });

        return response()->json([
            'status' => $record->status,
        ]);
    }

    private function normalizeBacklogPositions(int $userId): void
    {
        $ids = UserGameBacklog::query()
            ->where('user_id', $userId)
            ->orderBy('position')
            ->orderBy('id')
            ->pluck('id');

        foreach ($ids as $index => $id) {
            UserGameBacklog::query()
                ->where('id', $id)
                ->update(['position' => $index + 1]);
        }
    }
}
