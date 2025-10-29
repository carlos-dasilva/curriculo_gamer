<?php

namespace App\Domain\Games\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Game;
use App\Models\User;
use App\Models\UserGameInfo;
use App\Models\UserGameCommentRating;

class GameCommentsController extends Controller
{
    // Lista comentários (notas/comentários) da comunidade para um jogo
    public function index(Request $request, Game $game)
    {
        $perPage = 5;
        $page = max((int) $request->query('page', 1), 1);

        // Subconsulta de médias de rating por comentário
        $ratingsSub = DB::table('user_game_comment_ratings as r')
            ->select(
                'r.game_id',
                'r.comment_user_id',
                DB::raw('AVG(r.rating) as avg_rating'),
                DB::raw('COUNT(*) as rating_count')
            )
            ->where('r.game_id', $game->id)
            ->groupBy('r.game_id', 'r.comment_user_id');

        $query = UserGameInfo::query()
            ->from('user_game_infos as ugi')
            ->join('users as u', 'u.id', '=', 'ugi.user_id')
            ->leftJoinSub($ratingsSub, 'ar', function ($join) {
                $join->on('ar.game_id', '=', 'ugi.game_id')
                     ->on('ar.comment_user_id', '=', 'ugi.user_id');
            })
            // Se autenticado, carrega a nota do usuário logado para cada comentário
            ->when(auth()->check(), function ($q) use ($game) {
                $uid = (int) auth()->id();
                $q->leftJoin('user_game_comment_ratings as ur', function ($join) use ($game, $uid) {
                    $join->on('ur.game_id', '=', 'ugi.game_id')
                        ->on('ur.comment_user_id', '=', 'ugi.user_id')
                        ->where('ur.rated_by_user_id', '=', $uid);
                });
            })
            ->where('ugi.game_id', $game->id)
            ->whereNotNull('ugi.notes')
            ->whereRaw("TRIM(ugi.notes) <> ''")
            ->where(function ($q) {
                $q->whereNull('u.is_blocked')->orWhere('u.is_blocked', false);
            })
            ->select([
                'ugi.user_id as author_id',
                'u.name as author_name',
                'ugi.notes as content',
                'ugi.updated_at as updated_at',
                DB::raw('COALESCE(ar.avg_rating, 0) as avg_rating'),
                DB::raw('COALESCE(ar.rating_count, 0) as rating_count'),
                // se autenticado, a junção já adiciona esta coluna
                DB::raw(auth()->check() ? 'ur.rating as user_rating' : 'NULL as user_rating'),
            ])
            ->orderByDesc(DB::raw('COALESCE(ar.avg_rating, 0)'))
            ->orderByDesc('ugi.updated_at');

        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        $items = collect($paginator->items())->map(function ($r) use ($game) {
            return [
                'id' => $game->id . ':' . $r->author_id,
                'author' => [
                    'id' => (int) $r->author_id,
                    'name' => (string) $r->author_name,
                ],
                'content' => (string) $r->content,
                'updated_at' => (string) $r->updated_at,
                'avg_rating' => round((float) $r->avg_rating, 2),
                'rating_count' => (int) $r->rating_count,
                'user_rating' => $r->user_rating !== null ? (int) $r->user_rating : null,
            ];
        })->all();

        return response()->json([
            'data' => $items,
            'pagination' => [
                'page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ]);
    }

    // Avaliar (1..5) um comentário específico (identificado por autor)
    public function rate(Request $request, Game $game, User $commentUser)
    {
        if (!auth()->check()) abort(401);

        $data = $request->validate([
            'rating' => ['required','integer','min:1','max:5'],
        ]);

        // Verifica se o comentário existe (notes preenchido)
        $commentExists = UserGameInfo::query()
            ->where('game_id', $game->id)
            ->where('user_id', $commentUser->id)
            ->whereNotNull('notes')
            ->whereRaw("TRIM(notes) <> ''")
            ->exists();

        if (!$commentExists) {
            return response()->json(['ok' => false, 'message' => 'Comentário não encontrado.'], 404);
        }

        DB::transaction(function () use ($game, $commentUser, $data) {
            UserGameCommentRating::query()->updateOrCreate(
                [
                    'game_id' => $game->id,
                    'comment_user_id' => $commentUser->id,
                    'rated_by_user_id' => auth()->id(),
                ],
                [
                    'rating' => (int) $data['rating'],
                ]
            );
        });

        // Recalcula média do comentário
        $avg = UserGameCommentRating::query()
            ->where('game_id', $game->id)
            ->where('comment_user_id', $commentUser->id)
            ->avg('rating');
        $count = UserGameCommentRating::query()
            ->where('game_id', $game->id)
            ->where('comment_user_id', $commentUser->id)
            ->count();

        return response()->json([
            'ok' => true,
            'avg_rating' => $avg !== null ? round((float) $avg, 2) : 0.0,
            'rating_count' => $count,
        ]);
    }

    // Excluir comentário (apenas moderador/admin). Remove apenas o texto do comentário.
    public function destroy(Game $game, User $commentUser)
    {
        // Middleware de role aplicado na rota
        $info = UserGameInfo::query()
            ->where('game_id', $game->id)
            ->where('user_id', $commentUser->id)
            ->first();

        if (!$info || empty(trim((string) $info->notes))) {
            return response()->json(['ok' => false, 'message' => 'Comentário não encontrado.'], 404);
        }

        DB::transaction(function () use ($info, $game, $commentUser) {
            // limpa o comentário
            $info->update(['notes' => null]);
            // remove avaliações associadas a este comentário
            UserGameCommentRating::query()
                ->where('game_id', $game->id)
                ->where('comment_user_id', $commentUser->id)
                ->delete();
        });

        return response()->json(['ok' => true]);
    }
}
