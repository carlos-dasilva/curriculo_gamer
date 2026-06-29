<?php

namespace App\Domain\Chronologies\Http\Controllers;

use App\Domain\Chronologies\Http\Requests\StoreChronologyRequest;
use App\Domain\Chronologies\Services\ChronologyProgressService;
use App\Models\Chronology;
use App\Models\ChronologyStep;
use App\Models\ChronologyStepGame;
use App\Models\Game;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ChronologyController extends Controller
{
    public function create()
    {
        return Inertia::render('Chronologies/Create', [
            'games' => $this->gameOptions(),
        ]);
    }

    public function store(StoreChronologyRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data) {
            $chronology = Chronology::create([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'status' => 'avaliacao',
                'created_by' => auth()->id(),
                'approved_by' => null,
            ]);

            $this->syncSteps($chronology, $data['steps']);
        });

        return redirect()->route('options.index', ['tab' => 'cronologias'])
            ->with('success', 'Cronologia criada com sucesso. Ela ficará em avaliação até aprovação de um admin.');
    }

    public function edit(Chronology $chronology)
    {
        $this->ensureCanView($chronology);

        $chronology->load(['steps.stepGames.game:id,name,cover_url']);

        return Inertia::render('Chronologies/Edit', [
            'chronology' => $this->serializeForForm($chronology),
            'games' => $this->gameOptions(),
            'abilities' => [
                'canApprove' => $this->isAdmin(),
                'canEdit' => $this->canManageDraft($chronology),
            ],
        ]);
    }

    public function update(StoreChronologyRequest $request, Chronology $chronology): RedirectResponse
    {
        $this->ensureCanManageDraft($chronology);
        $data = $request->validated();

        DB::transaction(function () use ($chronology, $data) {
            $chronology->update([
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
            ]);

            $this->syncSteps($chronology, $data['steps']);
        });

        return redirect()->route('options.chronologies.edit', $chronology)
            ->with('success', 'Cronologia atualizada com sucesso.');
    }

    public function destroy(Chronology $chronology): RedirectResponse
    {
        $this->ensureCanManageDraft($chronology);
        $chronology->delete();

        return redirect()->route('options.index', ['tab' => 'cronologias'])
            ->with('success', 'Cronologia removida.');
    }

    public function release(Chronology $chronology): RedirectResponse
    {
        if (!$this->isAdmin()) {
            abort(403, 'Apenas administradores podem aprovar cronologias.');
        }

        if ($chronology->status !== 'avaliacao') {
            return redirect()->back()->with('error', 'Esta cronologia não está em avaliação.');
        }

        $chronology->update([
            'status' => 'liberado',
            'approved_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Cronologia aprovada com sucesso.');
    }

    public function adminIndex(Request $request)
    {
        if (!$this->isAdmin()) {
            abort(403, 'Apenas administradores podem acessar cronologias.');
        }

        $name = trim((string) $request->input('name', ''));
        $status = (string) $request->input('status', '');
        if (!in_array($status, ['', 'avaliacao', 'liberado'], true)) {
            $status = '';
        }

        $chronologies = Chronology::query()
            ->with(['creator:id,name'])
            ->withCount('steps')
            ->when($name !== '', fn ($query) => $query->where('name', 'like', "%{$name}%"))
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->orderByRaw("CASE WHEN status = 'avaliacao' THEN 0 ELSE 1 END")
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Chronologies/Index', [
            'chronologies' => $chronologies,
            'filters' => [
                'name' => $name,
                'status' => $status,
            ],
        ]);
    }

    public function showMine(Chronology $chronology, ChronologyProgressService $progress)
    {
        if (!auth()->check()) {
            return redirect()->route('home');
        }

        return $this->renderCurriculumChronology($chronology, (int) auth()->id(), $progress);
    }

    public function showForUser(int $user, Chronology $chronology, ChronologyProgressService $progress)
    {
        $subject = User::query()->findOrFail($user);

        return $this->renderCurriculumChronology($chronology, (int) $subject->id, $progress, $subject);
    }

    private function renderCurriculumChronology(Chronology $chronology, int $userId, ChronologyProgressService $progress, ?User $subject = null)
    {
        if ($chronology->status !== 'liberado') {
            abort(404);
        }

        $subject ??= auth()->user();
        $detail = $progress->detailForUser($chronology, $userId);

        if (($detail['progress']['completed_steps'] ?? 0) < 1) {
            abort(404);
        }

        return Inertia::render('Chronologies/Show', [
            ...$detail,
            'subject' => [
                'id' => (int) $subject->id,
                'name' => (string) $subject->name,
                'avatar_url' => $subject->avatar_url ?? null,
                'isMe' => auth()->check() && (int) auth()->id() === (int) $subject->id,
            ],
        ]);
    }

    private function gameOptions()
    {
        return Game::query()
            ->select(['id', 'name', 'cover_url', 'studio_id'])
            ->where('status', 'liberado')
            ->with('studio:id,name')
            ->orderBy('name')
            ->get()
            ->map(fn (Game $game) => [
                'id' => (int) $game->id,
                'name' => (string) $game->name,
                'cover_url' => $game->cover_url,
                'studio_name' => $game->studio?->name,
            ]);
    }

    private function serializeForForm(Chronology $chronology): array
    {
        return [
            'id' => (int) $chronology->id,
            'name' => (string) $chronology->name,
            'description' => $chronology->description,
            'status' => (string) $chronology->status,
            'steps' => $chronology->steps->map(fn ($step) => [
                'title' => $step->title,
                'game_ids' => $step->stepGames->pluck('game_id')->map(fn ($id) => (int) $id)->values()->all(),
            ])->values()->all(),
        ];
    }

    private function syncSteps(Chronology $chronology, array $steps): void
    {
        $chronology->steps()->delete();

        foreach (array_values($steps) as $stepIndex => $stepData) {
            $step = ChronologyStep::create([
                'chronology_id' => $chronology->id,
                'position' => $stepIndex + 1,
                'title' => trim((string) ($stepData['title'] ?? '')) ?: null,
            ]);

            foreach (array_values($stepData['game_ids'] ?? []) as $gameIndex => $gameId) {
                ChronologyStepGame::create([
                    'chronology_step_id' => $step->id,
                    'game_id' => (int) $gameId,
                    'position' => $gameIndex + 1,
                ]);
            }
        }
    }

    private function ensureCanView(Chronology $chronology): void
    {
        if (!$this->isAdmin() && (int) $chronology->created_by !== (int) auth()->id()) {
            abort(403, 'Acesso negado.');
        }
    }

    private function ensureCanManageDraft(Chronology $chronology): void
    {
        if (!$this->canManageDraft($chronology)) {
            abort(403, 'Cronologias aprovadas não podem ser alteradas por este fluxo.');
        }
    }

    private function canManageDraft(Chronology $chronology): bool
    {
        if ($chronology->status !== 'avaliacao') {
            return false;
        }

        return $this->isAdmin() || (int) $chronology->created_by === (int) auth()->id();
    }

    private function isAdmin(): bool
    {
        if (!auth()->check()) {
            return false;
        }

        $raw = is_object(auth()->user()->role) ? auth()->user()->role->value : (auth()->user()->role ?? 'co.mum');

        return strtolower(trim((string) $raw)) === 'admin';
    }
}
