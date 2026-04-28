import React from 'react';
import { Head } from '@inertiajs/react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import GameTitle from '@/components/ui/GameTitle';

type AuthInfo = {
  isAuthenticated: boolean;
  user?: { name: string; email: string } | null;
  loginUrl?: string;
  logoutUrl?: string;
  abilities?: { manageUsers?: boolean };
};

type BacklogGame = {
  id: number;
  name: string;
  cover_url?: string | null;
  description?: string | null;
  overall_score?: number | null;
  metacritic_metascore?: number | null;
  ptbr_subtitled: boolean;
  ptbr_dubbed: boolean;
  studio?: { id: number; name: string } | null;
  platforms: { id: number; name: string }[];
  tags: { id: number; name: string; slug: string }[];
};

type BacklogItem = {
  id: number;
  position: number;
  added_at?: string | null;
  game: BacklogGame;
};

type Props = {
  auth: AuthInfo;
  items: BacklogItem[];
};

export default function BacklogIndex({ auth, items: initialItems }: Props) {
  const [items, setItems] = React.useState<BacklogItem[]>(initialItems || []);
  const [draggingId, setDraggingId] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<number | null>(null);
  const [message, setMessage] = React.useState<null | { type: 'success' | 'error'; text: string }>(null);

  React.useEffect(() => {
    setItems(initialItems || []);
  }, [initialItems]);

  const persistOrder = async (nextItems: BacklogItem[]) => {
    try {
      setSaving(true);
      // @ts-ignore
      await window.axios.put('/meu-backlog/ordem', {
        game_ids: nextItems.map((item) => item.game.id),
      });
      setMessage({ type: 'success', text: 'Ordem salva.' });
    } catch (e) {
      setItems(initialItems || []);
      setMessage({ type: 'error', text: 'Não foi possível salvar a ordem.' });
    } finally {
      setSaving(false);
      window.setTimeout(() => setMessage(null), 3000);
    }
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const next = [...items];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    const normalized = next.map((item, index) => ({ ...item, position: index + 1 }));
    setItems(normalized);
    persistOrder(normalized);
  };

  const removeItem = async (gameId: number) => {
    try {
      setRemovingId(gameId);
      // @ts-ignore
      await window.axios.delete(`/jogos/${gameId}/backlog`);
      setItems((current) => current.filter((item) => item.game.id !== gameId).map((item, index) => ({ ...item, position: index + 1 })));
      setMessage({ type: 'success', text: 'Jogo removido do backlog.' });
    } catch (e) {
      setMessage({ type: 'error', text: 'Não foi possível remover o jogo.' });
    } finally {
      setRemovingId(null);
      window.setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Meu Backlog">
        <meta name="description" content="Backlog pessoal de jogos organizado por prioridade." />
      </Head>
      <Header auth={auth} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Meu Backlog</h1>
            <p className="mt-1 text-sm text-gray-600">{items.length} {items.length === 1 ? 'jogo priorizado' : 'jogos priorizados'}</p>
          </div>
          <div className="min-h-9">
            {saving && (
              <span className="inline-flex rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
                Salvando ordem...
              </span>
            )}
            {message && (
              <span className={`inline-flex rounded-md px-3 py-2 text-sm font-medium ring-1 ring-inset ${message.type === 'success' ? 'bg-green-50 text-green-800 ring-green-200' : 'bg-red-50 text-red-800 ring-red-200'}`}>
                {message.text}
              </span>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <section className="mt-6 rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">Nenhum jogo no backlog</h2>
            <p className="mt-2 text-sm text-gray-600">Adicione jogos pela tela de informações de cada jogo.</p>
            <a
              href="/"
              className="mt-5 inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              Ver jogos
            </a>
          </section>
        ) : (
          <ol className="mt-6 space-y-3" aria-label="Jogos do meu backlog">
            {items.map((item, index) => {
              const game = item.game;
              const dragging = draggingId === item.id;
              return (
                <li
                  key={item.id}
                  draggable
                  onDragStart={(event) => {
                    setDraggingId(item.id);
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', String(item.id));
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const sourceId = Number(event.dataTransfer.getData('text/plain')) || draggingId;
                    const fromIndex = items.findIndex((current) => current.id === sourceId);
                    const toIndex = items.findIndex((current) => current.id === item.id);
                    setDraggingId(null);
                    moveItem(fromIndex, toIndex);
                  }}
                  className={`rounded-lg border bg-white p-3 shadow-sm transition ${dragging ? 'border-brand-400 opacity-70 ring-2 ring-brand-200' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <article className="grid grid-cols-[auto_1fr] gap-3 sm:grid-cols-[auto_88px_1fr_auto] sm:items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-900 text-sm font-semibold text-white">
                      {index + 1}
                    </div>

                    <a href={`/jogos/${game.id}`} className="hidden overflow-hidden rounded-md bg-gray-100 sm:block">
                      <img
                        src={game.cover_url || '/img/sem-imagem.svg'}
                        alt={game.name}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/img/sem-imagem.svg'; }}
                        className="h-24 w-[88px] object-cover"
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        width={88}
                        height={96}
                      />
                    </a>

                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <a href={`/jogos/${game.id}`} className="block overflow-hidden rounded-md bg-gray-100 sm:hidden">
                          <img
                            src={game.cover_url || '/img/sem-imagem.svg'}
                            alt={game.name}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/img/sem-imagem.svg'; }}
                            className="h-20 w-16 object-cover"
                            loading="lazy"
                            decoding="async"
                            fetchPriority="low"
                            width={64}
                            height={80}
                          />
                        </a>
                        <div className="min-w-0 flex-1">
                          <a href={`/jogos/${game.id}`} className="hover:underline">
                            <GameTitle as="h2" text={game.name} className="truncate text-base font-semibold text-gray-900 sm:text-lg" />
                          </a>
                          <p className="mt-1 text-sm text-gray-600">
                            {game.studio?.name || 'Estúdio não informado'}
                            {game.platforms.length > 0 ? ` · ${game.platforms.slice(0, 3).map((platform) => platform.name).join(', ')}` : ''}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {game.overall_score != null && Number(game.overall_score) > 0 && (
                              <span className="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-800 ring-1 ring-inset ring-green-200">
                                Comunidade {Number(game.overall_score).toFixed(2)}
                              </span>
                            )}
                            {game.metacritic_metascore != null && Number(game.metacritic_metascore) > 0 && (
                              <span className="rounded bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-200">
                                Metascore {Number(game.metacritic_metascore).toFixed(0)}
                              </span>
                            )}
                            {game.ptbr_subtitled && <span className="rounded bg-sky-50 px-2 py-1 text-xs font-medium text-sky-800 ring-1 ring-inset ring-sky-200">Legendado PT-BR</span>}
                            {game.ptbr_dubbed && <span className="rounded bg-sky-50 px-2 py-1 text-xs font-medium text-sky-800 ring-1 ring-inset ring-sky-200">Dublado PT-BR</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1">
                      <button
                        type="button"
                        onClick={() => moveItem(index, index - 1)}
                        disabled={index === 0 || saving}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Aumentar prioridade de ${game.name}`}
                        title="Aumentar prioridade"
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(index, index + 1)}
                        disabled={index === items.length - 1 || saving}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Reduzir prioridade de ${game.name}`}
                        title="Reduzir prioridade"
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(game.id)}
                        disabled={removingId === game.id}
                        className="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {removingId === game.id ? 'Removendo...' : 'Remover'}
                      </button>
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ArrowUpIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M10 3.75a.75.75 0 01.53.22l4.25 4.25a.75.75 0 11-1.06 1.06l-2.97-2.97v9.19a.75.75 0 01-1.5 0V6.31L6.28 9.28a.75.75 0 01-1.06-1.06l4.25-4.25A.75.75 0 0110 3.75z" clipRule="evenodd" />
    </svg>
  );
}

function ArrowDownIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M10 16.25a.75.75 0 01-.53-.22L5.22 11.78a.75.75 0 111.06-1.06l2.97 2.97V4.5a.75.75 0 011.5 0v9.19l2.97-2.97a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-.53.22z" clipRule="evenodd" />
    </svg>
  );
}
