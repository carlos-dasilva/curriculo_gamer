<?php

namespace App\Domain\Games\Http\Controllers;

use App\Domain\Auth\Enums\Role;
use App\Models\Game;
use App\Models\User;
use App\Models\UserGameBacklog;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class BacklogController extends Controller
{
    public function index()
    {
        if (!auth()->check()) {
            return redirect()->route('home');
        }

        return $this->renderBacklog(auth()->user(), true);
    }

    public function show(User $user)
    {
        return $this->renderBacklog($user, false);
    }

    private function renderBacklog(User $user, bool $editable)
    {
        $query = UserGameBacklog::query()
            ->where('user_id', $user->id)
            ->with([
                'game:id,name,cover_url,description,overall_score,metacritic_metascore,ptbr_subtitled,ptbr_dubbed,status,studio_id',
                'game.studio:id,name',
                'game.platforms:id,name',
                'game.tags:id,name,slug',
            ])
            ->orderBy('position')
            ->orderBy('id');

        if (!$editable) {
            $query->whereHas('game', fn ($gameQuery) => $gameQuery->where('status', 'liberado'));
        }

        $items = $query->get()
            ->filter(fn (UserGameBacklog $item) => $item->game !== null)
            ->map(fn (UserGameBacklog $item) => [
                'id' => $item->id,
                'position' => $item->position,
                'added_at' => optional($item->created_at)->toISOString(),
                'game' => [
                    'id' => $item->game->id,
                    'name' => $item->game->name,
                    'cover_url' => $item->game->cover_url,
                    'description' => $item->game->description,
                    'overall_score' => $item->game->overall_score,
                    'metacritic_metascore' => $item->game->metacritic_metascore,
                    'ptbr_subtitled' => (bool) $item->game->ptbr_subtitled,
                    'ptbr_dubbed' => (bool) $item->game->ptbr_dubbed,
                    'studio' => $item->game->studio ? [
                        'id' => $item->game->studio->id,
                        'name' => $item->game->studio->name,
                    ] : null,
                    'platforms' => $item->game->platforms
                        ->map(fn ($platform) => ['id' => $platform->id, 'name' => $platform->name])
                        ->values(),
                    'tags' => $item->game->tags
                        ->map(fn ($tag) => ['id' => $tag->id, 'name' => $tag->name, 'slug' => $tag->slug])
                        ->values(),
                ],
            ])
            ->values();

        return Inertia::render('Backlog/Index', [
            'items' => $items,
            'subject' => [
                'id' => $user->id,
                'name' => $user->name,
                'avatar_url' => $user->avatar_url ?? null,
                'isMe' => auth()->check() && (int) auth()->id() === (int) $user->id,
            ],
            'editable' => $editable,
        ]);
    }

    public function store(Request $request, Game $game)
    {
        $this->authorizeBacklogAccess($game);

        $item = DB::transaction(function () use ($game) {
            $existing = UserGameBacklog::query()
                ->where('user_id', auth()->id())
                ->where('game_id', $game->id)
                ->first();

            if ($existing) {
                return $existing;
            }

            $nextPosition = ((int) UserGameBacklog::query()
                ->where('user_id', auth()->id())
                ->max('position')) + 1;

            return UserGameBacklog::query()->create([
                'user_id' => auth()->id(),
                'game_id' => $game->id,
                'position' => $nextPosition,
            ]);
        });

        return response()->json([
            'ok' => true,
            'is_backlogged' => true,
            'position' => $item->position,
        ]);
    }

    public function destroy(Game $game)
    {
        UserGameBacklog::query()
            ->where('user_id', auth()->id())
            ->where('game_id', $game->id)
            ->delete();

        $this->normalizePositions((int) auth()->id());

        return response()->json([
            'ok' => true,
            'is_backlogged' => false,
        ]);
    }

    public function reorder(Request $request)
    {
        $data = $request->validate([
            'game_ids' => ['required', 'array', 'min:1'],
            'game_ids.*' => ['integer', 'distinct'],
        ]);

        $userId = (int) auth()->id();
        $incomingIds = array_map('intval', $data['game_ids']);
        $existingIds = UserGameBacklog::query()
            ->where('user_id', $userId)
            ->pluck('game_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        sort($incomingIds);
        sort($existingIds);

        if ($incomingIds !== $existingIds) {
            throw ValidationException::withMessages([
                'game_ids' => 'A ordem enviada deve conter todos os jogos atuais do backlog.',
            ]);
        }

        DB::transaction(function () use ($userId, $data) {
            foreach (array_values($data['game_ids']) as $index => $gameId) {
                UserGameBacklog::query()
                    ->where('user_id', $userId)
                    ->where('game_id', (int) $gameId)
                    ->update(['position' => $index + 1]);
            }
        });

        return response()->json(['ok' => true]);
    }

    private function authorizeBacklogAccess(Game $game): void
    {
        if ($game->status === 'liberado') {
            return;
        }

        $user = auth()->user();
        $role = $user?->role;
        $roleValue = $role instanceof Role ? $role->value : (string) ($role ?? '');

        if ((int) ($game->created_by ?? 0) === (int) auth()->id()) {
            return;
        }

        if (in_array(strtolower(trim($roleValue)), ['moderador', 'admin'], true)) {
            return;
        }

        abort(403);
    }

    private function normalizePositions(int $userId): void
    {
        DB::transaction(function () use ($userId) {
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
        });
    }
}
