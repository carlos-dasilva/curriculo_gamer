import React from 'react';
import { Head, router } from '@inertiajs/react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import GameCards, { type GameCard } from '@/components/ui/GameCards';

type AuthInfo = {
  isAuthenticated: boolean;
  user?: { name: string; email: string } | null;
  loginUrl?: string;
  logoutUrl?: string;
  abilities?: { manageUsers?: boolean };
};

type Counts = {
  cem_por_cento: number;
  finalizei: number;
  joguei: number;
  quero_jogar: number;
};

type PlatformCounts = {
  platform: { id: number; name: string };
  counts: Counts;
};

type Selected = {
  mode: 'all' | 'platform';
  status: StatusKey;
  platformId?: number | null;
};

type StatusKey = 'cem_por_cento' | 'finalizei' | 'joguei' | 'quero_jogar';

type Props = {
  mode: 'all' | 'platform';
  summary: Counts;
  byPlatform: PlatformCounts[];
  selected: Selected;
  games: GameCard[];
  subject: { id: number; name: string; isMe: boolean; isFollowed?: boolean };
  auth: AuthInfo;
  flash?: { success?: string; error?: string };
};

const STATUS_LABELS: Record<StatusKey, string> = {
  cem_por_cento: 'Fiz 100%',
  finalizei: 'Finalizei',
  joguei: 'Joguei',
  quero_jogar: 'Quero Jogar',
};

export default function CurriculumIndex({ mode, summary, byPlatform, selected, games, subject, auth, flash }: Props) {
  const [currentMode, setCurrentMode] = React.useState<'all' | 'platform'>(mode || 'all');
  const basePath = subject?.isMe ? '/meu-curriculo' : `/curriculo/${subject?.id}`;

  React.useEffect(() => {
    setCurrentMode(mode);
  }, [mode]);

  const changeMode = (m: 'all' | 'platform') => {
    if (m === currentMode) return;
    const params: Record<string, string | number> = { mode: m, status: selected.status };
    if (m === 'platform' && selected.platformId) params.platform = selected.platformId;
    router.get(basePath, params, { preserveScroll: true, preserveState: true });
  };

  const onPick = (s: StatusKey, platformId?: number) => {
    const params: Record<string, string | number> = { mode: currentMode, status: s };
    if (currentMode === 'platform' && platformId) params.platform = platformId;
    router.get(basePath, params, { preserveScroll: true, preserveState: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title={subject?.isMe ? 'Meu Currículo' : `Currículo do ${subject?.name || ''}`} />
      <Header auth={auth} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{subject?.isMe ? 'Meu Currículo' : `Currículo do ${subject?.name}`}</h1>
            <p className="mt-1 text-sm text-gray-600">{subject?.isMe ? 'Resumo do seu progresso por status e por plataforma.' : 'Resumo do progresso deste usuário por status e por plataforma.'}</p>
          </div>
          {!subject?.isMe && (
            <FollowButton subjectId={subject.id} initialFollowing={!!subject?.isFollowed} />
          )}
        </div>

        {flash?.error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">{flash.error}</div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Sidebar esquerda (ou bloco superior no mobile) */}
          <aside className="lg:sticky lg:top-20 self-start">
            {/* Modo de visualização */}
            <fieldset className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm" aria-labelledby="filtro-modo-label">
              <legend id="filtro-modo-label" className="text-sm font-semibold text-gray-900">Filtrar por</legend>
              <div className="mt-3 flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="radio"
                    name="modo"
                    value="all"
                    checked={currentMode === 'all'}
                    onChange={() => changeMode('all')}
                    className="h-4 w-4 border-gray-300 text-sky-600 focus:ring-sky-600"
                  />
                  <span>Todos</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="radio"
                    name="modo"
                    value="platform"
                    checked={currentMode === 'platform'}
                    onChange={() => changeMode('platform')}
                    className="h-4 w-4 border-gray-300 text-sky-600 focus:ring-sky-600"
                  />
                  <span>Plataforma</span>
                </label>
              </div>
            </fieldset>

            {/* Lista de filtros */}
            <div className="mt-4">
              {currentMode === 'all' ? (
                <ul className="space-y-1" role="list" aria-label="Status gerais">
                  {(['cem_por_cento','finalizei','joguei','quero_jogar'] as StatusKey[]).map((key) => {
                    const active = selected.mode === 'all' && selected.status === key;
                    return (
                      <li key={key}>
                        <button
                          onClick={() => onPick(key)}
                          className={`${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-800 hover:bg-gray-50'} flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-medium ring-1 ring-inset ring-gray-200`}
                          aria-current={active ? 'true' : undefined}
                        >
                          <span>{STATUS_LABELS[key]}</span>
                          <Badge value={summary[key]} inverted={active} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="space-y-4" aria-label="Status por plataforma">
                  {byPlatform.length === 0 && (
                    <p className="text-sm text-gray-600">Nenhuma plataforma com progresso registrado.</p>
                  )}
                  {byPlatform.map((group) => (
                    <div key={group.platform.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-gray-900">{group.platform.name}</h3>
                        <span className="text-xs text-gray-500">Selecione um status</span>
                      </div>
                      <ul className="space-y-1" role="list">
                        {(['cem_por_cento','finalizei','joguei','quero_jogar'] as StatusKey[]).map((key) => {
                          const active = selected.mode === 'platform' && selected.status === key && selected.platformId === group.platform.id;
                          return (
                            <li key={`${group.platform.id}-${key}`}>
                              <button
                                onClick={() => onPick(key, group.platform.id)}
                                className={`${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-800 hover:bg-gray-50'} flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm font-medium ring-1 ring-inset ring-gray-200`}
                                aria-current={active ? 'true' : undefined}
                              >
                                <span>{STATUS_LABELS[key]}</span>
                                <Badge value={group.counts[key]} inverted={active} />
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Conteúdo principal: cards */}
          <section className="lg:col-start-2 min-w-0">
            <h2 className="sr-only">Jogos filtrados</h2>
            {games.length === 0 ? (
              <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">Nenhum jogo encontrado para o filtro selecionado.</p>
            ) : (
              <GameCards games={games} />
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Badge({ value, inverted }: { value: number; inverted?: boolean }) {
  return (
    <span className={`inline-flex min-w-8 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold ${inverted ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'}`}>{value}</span>
  );
}

function FollowButton({ subjectId, initialFollowing }: { subjectId: number; initialFollowing: boolean }) {
  const [following, setFollowing] = React.useState<boolean>(initialFollowing);
  const [saving, setSaving] = React.useState<boolean>(false);

  const toggle = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (!following) {
        // @ts-ignore
        const res = await window.axios.post(`/usuarios/${subjectId}/seguir`);
        if (res?.data?.following === true) setFollowing(true);
      } else {
        // @ts-ignore
        const res = await window.axios.delete(`/usuarios/${subjectId}/seguir`);
        if (res?.data?.following === false) setFollowing(false);
      }
    } catch (e) {
      // opcional: exibir toast/erro
    } finally {
      setSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={following}
      disabled={saving}
      className={`${following ? 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50' : 'bg-gray-900 text-white hover:bg-gray-800'} inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {following ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
      {following ? 'Seguindo' : 'Seguir'}
    </button>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M10 3a.75.75 0 01.75.75v5.5h5.5a.75.75 0 010 1.5h-5.5v5.5a.75.75 0 01-1.5 0v-5.5h-5.5a.75.75 0 010-1.5h5.5v-5.5A.75.75 0 0110 3z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}
