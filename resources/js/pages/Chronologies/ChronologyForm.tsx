import React from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import OptionsSidebar from '@/components/layouts/OptionsSidebar';

export type GameOption = {
  id: number;
  name: string;
  cover_url?: string | null;
  studio_name?: string | null;
};

export type ChronologyFormData = {
  name: string;
  description: string;
  steps: Array<{
    title: string;
    game_ids: number[];
  }>;
};

type Props = {
  mode: 'create' | 'edit';
  games: GameOption[];
  chronology?: {
    id: number;
    name: string;
    description?: string | null;
    status: 'avaliacao' | 'liberado';
    steps: ChronologyFormData['steps'];
  };
  abilities?: {
    canApprove?: boolean;
    canEdit?: boolean;
  };
};

export default function ChronologyForm({ mode, games, chronology, abilities }: Props) {
  const page = usePage();
  const auth = (page.props as any).auth;
  const flash = (page.props as any).flash as { success?: string; error?: string } | undefined;
  const isEdit = mode === 'edit';
  const canEdit = !isEdit || abilities?.canEdit !== false;
  const [selectedByStep, setSelectedByStep] = React.useState<Record<number, number>>({});
  const [gameSearchByStep, setGameSearchByStep] = React.useState<Record<number, string>>({});
  const [activeSearchStep, setActiveSearchStep] = React.useState<number | null>(null);

  const { data, setData, post, put, processing, errors } = useForm<ChronologyFormData>({
    name: chronology?.name || '',
    description: chronology?.description || '',
    steps: chronology?.steps?.length ? chronology.steps : [{ title: '', game_ids: [] }],
  });

  const gameMap = React.useMemo(() => new Map(games.map((game) => [game.id, game])), [games]);
  const usedGameIds = React.useMemo(() => new Set(data.steps.flatMap((step) => step.game_ids)), [data.steps]);
  const gameLabel = (game: GameOption) => `${game.name}${game.studio_name ? ` - ${game.studio_name}` : ''}`;
  const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const filteredGamesForStep = (stepIndex: number) => {
    const query = normalizeSearch(gameSearchByStep[stepIndex] || '');
    if (query.length < 2) {
      return [];
    }

    return games
      .filter((game) => !usedGameIds.has(game.id))
      .filter((game) => normalizeSearch(`${game.name} ${game.studio_name || ''}`).includes(query))
      .slice(0, 10);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (isEdit && chronology) {
      put(`/opcoes/cronologias/${chronology.id}`);
      return;
    }

    post('/opcoes/cronologias');
  };

  const updateStep = (index: number, next: ChronologyFormData['steps'][number]) => {
    const steps = [...data.steps];
    steps[index] = next;
    setData('steps', steps);
  };

  const addStep = () => {
    setData('steps', [...data.steps, { title: '', game_ids: [] }]);
  };

  const removeStep = (index: number) => {
    if (data.steps.length === 1) return;
    const steps = [...data.steps];
    steps.splice(index, 1);
    setData('steps', steps);
  };

  const moveStep = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= data.steps.length) return;
    const steps = [...data.steps];
    [steps[index], steps[target]] = [steps[target], steps[index]];
    setData('steps', steps);
  };

  const addGame = (stepIndex: number) => {
    const selected = Number(selectedByStep[stepIndex] || 0);
    if (!selected || usedGameIds.has(selected)) return;
    const step = data.steps[stepIndex];
    updateStep(stepIndex, { ...step, game_ids: [...step.game_ids, selected] });
    setSelectedByStep({ ...selectedByStep, [stepIndex]: 0 });
    setGameSearchByStep({ ...gameSearchByStep, [stepIndex]: '' });
    setActiveSearchStep(null);
  };

  const selectGameForStep = (stepIndex: number, game: GameOption) => {
    setSelectedByStep({ ...selectedByStep, [stepIndex]: game.id });
    setGameSearchByStep({ ...gameSearchByStep, [stepIndex]: gameLabel(game) });
    setActiveSearchStep(null);
  };

  const removeGame = (stepIndex: number, gameId: number) => {
    const step = data.steps[stepIndex];
    updateStep(stepIndex, { ...step, game_ids: step.game_ids.filter((id) => id !== gameId) });
  };

  const moveGame = (stepIndex: number, gameIndex: number, direction: -1 | 1) => {
    const step = data.steps[stepIndex];
    const target = gameIndex + direction;
    if (target < 0 || target >= step.game_ids.length) return;
    const gameIds = [...step.game_ids];
    [gameIds[gameIndex], gameIds[target]] = [gameIds[target], gameIds[gameIndex]];
    updateStep(stepIndex, { ...step, game_ids: gameIds });
  };

  const approve = () => {
    if (!chronology) return;
    router.put(`/opcoes/cronologias/${chronology.id}/liberar`, {}, { preserveScroll: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title={isEdit ? 'Editar Cronologia' : 'Nova Cronologia'} />
      <Header auth={auth} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Opções</h2>
          <p className="mt-1 text-sm text-gray-600">Acesse suas opções de conta e ações rápidas.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <OptionsSidebar active="cronologias" />
          <section className="min-w-0">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{isEdit ? 'Editar Cronologia' : 'Nova Cronologia'}</h1>
                <p className="mt-1 max-w-3xl text-sm text-gray-600">
                  Monte uma sequência cronológica com etapas ordenadas. Jogos equivalentes, como remakes, ficam juntos na mesma etapa.
                </p>
              </div>
              <Link href="/opcoes?tab=cronologias" className="text-sm text-gray-700 underline-offset-2 hover:underline">Voltar</Link>
            </div>

            {flash?.success && <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{flash.success}</div>}
            {flash?.error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{flash.error}</div>}
            {errors.steps && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{errors.steps}</div>}

            {isEdit && chronology?.status === 'liberado' && (
              <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                Esta cronologia já foi aprovada. Para preservar o que aparece nos currículos, este fluxo deixa o conteúdo aprovado bloqueado para edição.
              </div>
            )}

            <form onSubmit={submit} className="space-y-6">
              <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="chronology-name" className="block text-sm font-medium text-gray-700">Nome da cronologia</label>
                    <input
                      id="chronology-name"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      disabled={!canEdit}
                      required
                      maxLength={160}
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Ex.: Linha principal de Resident Evil"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>
                  <div>
                    <label htmlFor="chronology-description" className="block text-sm font-medium text-gray-700">Descrição</label>
                    <textarea
                      id="chronology-description"
                      value={data.description}
                      onChange={(e) => setData('description', e.target.value)}
                      disabled={!canEdit}
                      rows={4}
                      maxLength={5000}
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                      placeholder="Explique o recorte usado na ordem cronológica."
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                  </div>
                </div>
              </section>

              <section>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Etapas da cronologia</h2>
                    <p className="mt-1 text-sm text-gray-600">Cada etapa conta uma vez no progresso, mesmo que tenha mais de um jogo equivalente.</p>
                  </div>
                  {canEdit && (
                    <button type="button" onClick={addStep} className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800">
                      Adicionar etapa
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {data.steps.map((step, stepIndex) => (
                    <article key={stepIndex} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">{stepIndex + 1}</span>
                            <label htmlFor={`step-title-${stepIndex}`} className="sr-only">Título da etapa {stepIndex + 1}</label>
                            <input
                              id={`step-title-${stepIndex}`}
                              value={step.title}
                              onChange={(e) => updateStep(stepIndex, { ...step, title: e.target.value })}
                              disabled={!canEdit}
                              maxLength={160}
                              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                              placeholder="Título opcional da etapa"
                            />
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex flex-wrap items-center gap-2">
                            <IconButton label="Subir etapa" disabled={stepIndex === 0} onClick={() => moveStep(stepIndex, -1)}>
                              <ArrowUpIcon className="h-4 w-4" />
                            </IconButton>
                            <IconButton label="Descer etapa" disabled={stepIndex === data.steps.length - 1} onClick={() => moveStep(stepIndex, 1)}>
                              <ArrowDownIcon className="h-4 w-4" />
                            </IconButton>
                            <button type="button" disabled={data.steps.length === 1} onClick={() => removeStep(stepIndex)} className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50">
                              Remover
                            </button>
                          </div>
                        )}
                      </div>

                      {canEdit && (
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                          <div className="relative min-w-0 flex-1">
                            <label htmlFor={`game-search-${stepIndex}`} className="sr-only">Pesquisar jogo para a etapa {stepIndex + 1}</label>
                            <input
                              id={`game-search-${stepIndex}`}
                              type="search"
                              value={gameSearchByStep[stepIndex] || ''}
                              onFocus={() => setActiveSearchStep(stepIndex)}
                              onBlur={() => window.setTimeout(() => setActiveSearchStep((current) => current === stepIndex ? null : current), 150)}
                              onChange={(e) => {
                                setGameSearchByStep({ ...gameSearchByStep, [stepIndex]: e.target.value });
                                setSelectedByStep({ ...selectedByStep, [stepIndex]: 0 });
                                setActiveSearchStep(stepIndex);
                              }}
                              onKeyDown={(e) => {
                                if (e.key !== 'Enter') return;
                                const options = filteredGamesForStep(stepIndex);
                                if (options.length === 1) {
                                  e.preventDefault();
                                  selectGameForStep(stepIndex, options[0]);
                                }
                              }}
                              autoComplete="off"
                              role="combobox"
                              aria-autocomplete="list"
                              aria-expanded={activeSearchStep === stepIndex}
                              aria-controls={`game-search-results-${stepIndex}`}
                              placeholder={games.length > 0 ? 'Pesquisar jogo cadastrado...' : 'Nenhum jogo liberado encontrado'}
                              disabled={games.length === 0}
                              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                            />
                            {activeSearchStep === stepIndex && (
                              <div
                                id={`game-search-results-${stepIndex}`}
                                role="listbox"
                                className="absolute z-20 mt-1 max-h-80 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
                              >
                                {(gameSearchByStep[stepIndex] || '').trim().length < 2 ? (
                                  <div className="px-3 py-3 text-sm text-gray-600">Digite pelo menos 2 letras para pesquisar.</div>
                                ) : filteredGamesForStep(stepIndex).length === 0 ? (
                                  <div className="px-3 py-3 text-sm text-gray-600">Nenhum jogo liberado encontrado para esta busca.</div>
                                ) : (
                                  filteredGamesForStep(stepIndex).map((game) => (
                                    <button
                                      key={game.id}
                                      type="button"
                                      role="option"
                                      aria-selected={selectedByStep[stepIndex] === game.id}
                                      onMouseDown={(e) => e.preventDefault()}
                                      onClick={() => selectGameForStep(stepIndex, game)}
                                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                                    >
                                      <img src={game.cover_url || '/img/sem-imagem.svg'} alt="" className="h-12 w-9 flex-none rounded object-cover ring-1 ring-gray-200" loading="lazy" decoding="async" width={36} height={48} />
                                      <span className="min-w-0">
                                        <span className="block truncate text-sm font-semibold text-gray-900">{game.name}</span>
                                        <span className="block truncate text-xs text-gray-500">{game.studio_name || 'Sem estúdio'}</span>
                                      </span>
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => addGame(stepIndex)}
                            disabled={!selectedByStep[stepIndex]}
                            className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Adicionar jogo
                          </button>
                        </div>
                      )}

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {step.game_ids.length === 0 ? (
                          <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
                            Nenhum jogo nesta etapa.
                          </div>
                        ) : step.game_ids.map((gameId, gameIndex) => {
                          const game = gameMap.get(gameId);
                          return (
                            <div key={gameId} className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-2">
                              <img src={game?.cover_url || '/img/sem-imagem.svg'} alt="" className="h-16 w-12 flex-none rounded object-cover ring-1 ring-gray-200" loading="lazy" decoding="async" width={48} height={64} />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-gray-900">{game?.name || `Jogo #${gameId}`}</p>
                                <p className="truncate text-xs text-gray-500">{game?.studio_name || 'Sem estúdio'}</p>
                              </div>
                              {canEdit && (
                                <div className="flex flex-col gap-1">
                                  <IconButton label="Subir jogo" disabled={gameIndex === 0} onClick={() => moveGame(stepIndex, gameIndex, -1)}>
                                    <ArrowUpIcon className="h-4 w-4" />
                                  </IconButton>
                                  <IconButton label="Descer jogo" disabled={gameIndex === step.game_ids.length - 1} onClick={() => moveGame(stepIndex, gameIndex, 1)}>
                                    <ArrowDownIcon className="h-4 w-4" />
                                  </IconButton>
                                  <IconButton label="Remover jogo" onClick={() => removeGame(stepIndex, gameId)} tone="danger">
                                    <TrashIcon className="h-4 w-4" />
                                  </IconButton>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {canEdit && (
                  <button type="submit" disabled={processing} className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">
                    {processing ? 'Salvando...' : (isEdit ? 'Salvar cronologia' : 'Criar cronologia')}
                  </button>
                )}
                {isEdit && chronology?.status === 'avaliacao' && abilities?.canApprove && (
                  <button type="button" onClick={approve} className="inline-flex items-center justify-center rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-600">
                    Aprovar cronologia
                  </button>
                )}
                <Link href="/opcoes?tab=cronologias" className="text-sm text-gray-700 underline-offset-2 hover:underline">Cancelar</Link>
              </div>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function IconButton({ label, disabled, onClick, tone = 'neutral', children }: { label: string; disabled?: boolean; onClick: () => void; tone?: 'neutral' | 'danger'; children: React.ReactNode }) {
  const cls = tone === 'danger'
    ? 'bg-red-600 text-white hover:bg-red-500 focus-visible:outline-red-600'
    : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline-gray-900';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`${cls} inline-flex h-9 w-9 items-center justify-center rounded-md shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M10 3.25a.75.75 0 01.53.22l4.25 4.25a.75.75 0 11-1.06 1.06l-2.97-2.97V16a.75.75 0 01-1.5 0V5.81L6.28 8.78a.75.75 0 01-1.06-1.06l4.25-4.25a.75.75 0 01.53-.22z" clipRule="evenodd" />
    </svg>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M10 16.75a.75.75 0 01-.53-.22l-4.25-4.25a.75.75 0 111.06-1.06l2.97 2.97V4a.75.75 0 011.5 0v10.19l2.97-2.97a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-.53.22z" clipRule="evenodd" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M8 2a1 1 0 00-.894.553L6.382 4H3.75a.75.75 0 000 1.5h.395l.705 10.58A2 2 0 006.846 18h6.308a2 2 0 001.996-1.92l.705-10.58h.395a.75.75 0 000-1.5h-2.632l-.724-1.447A1 1 0 0012 2H8zm1 6.25a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6zm3.5 0a.75.75 0 00-1.5 0v6a.75.75 0 001.5 0v-6z" clipRule="evenodd" />
    </svg>
  );
}
