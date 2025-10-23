<?php

namespace App\Domain\Games\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use App\Models\Game;
use App\Models\Platform;
use App\Models\UserGamePlatformStatus;

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

        $record = UserGamePlatformStatus::query()->updateOrCreate(
            [
                'user_id' => auth()->id(),
                'game_id' => $game->id,
                'platform_id' => $platform->id,
            ],
            [
                'status' => $status,
            ]
        );

        return response()->json([
            'status' => $record->status,
        ]);
    }
}
