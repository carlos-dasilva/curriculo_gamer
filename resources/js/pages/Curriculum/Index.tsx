import React from 'react';
import { Head, router, Link } from '@inertiajs/react';
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

type Paginator<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
  mode: 'all' | 'platform';
  summary: Counts;
  byPlatform: PlatformCounts[];
  selected: Selected;
  games: Paginator<GameCard>;
  subject: { id: number; name: string; isMe: boolean; isFollowed?: boolean };
  auth: AuthInfo;
  flash?: { success?: string; error?: string };
  filters?: { q?: string; sub?: boolean; dub?: boolean };
};

const STATUS_LABELS: Record<StatusKey, string> = {
  cem_por_cento: 'Fiz 100%',
  finalizei: 'Finalizei',
  joguei: 'Joguei',
  quero_jogar: 'Quero Jogar',
};

export default function CurriculumIndex({ mode, summary, byPlatform, selected, games, subject, auth, flash, filters }: Props) {
  const [currentMode, setCurrentMode] = React.useState<'all' | 'platform'>(mode || 'all');
  const basePath = subject?.isMe ? '/meu-curriculo' : `/curriculo/${subject?.id}`;
  const [q, setQ] = React.useState<string>(filters?.q || '');
  const [sub, setSub] = React.useState<boolean>(!!filters?.sub);
  const [dub, setDub] = React.useState<boolean>(!!filters?.dub);

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
    if (q.trim()) params.q = q.trim();
    if (sub) params.sub = 1;
    if (dub) params.dub = 1;
    router.get(basePath, params, { preserveScroll: true, preserveState: true });
  };
  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    const params: Record<string, string | number> = { mode: currentMode, status: selected.status };
    if (currentMode === 'platform' && selected.platformId) params.platform = selected.platformId;
    if (q.trim()) params.q = q.trim();
    if (sub) params.sub = 1;
    if (dub) params.dub = 1;
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
          {subject?.isMe ? (
            <ShareMyCurriculum userId={subject.id} />
          ) : (auth?.isAuthenticated ? (
            <FollowButton subjectId={subject.id} initialFollowing={!!subject?.isFollowed} />
          ) : null)}
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
            <form onSubmit={applyFilters} className="mb-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="sm:flex-1">
                  <label htmlFor="q2" className="block text-sm font-medium text-gray-700">Buscar</label>
                  <input id="q2" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, estúdio, plataforma ou marcador"
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={!!sub}
                    onClick={() => setSub((v) => !v)}
                    className={`${sub ? 'bg-gray-900 text-white ring-gray-900' : 'bg-white text-gray-800 ring-gray-300 hover:bg-gray-50'} inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1 ring-inset shadow-sm transition cursor-pointer`}
                  >
                    <span className="sm:hidden">Legendado</span>
                    <span className="hidden sm:inline">Legendado em PT-BR</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={!!dub}
                    onClick={() => setDub((v) => !v)}
                    className={`${dub ? 'bg-gray-900 text-white ring-gray-900' : 'bg-white text-gray-800 ring-gray-300 hover:bg-gray-50'} inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1 ring-inset shadow-sm transition cursor-pointer`}
                  >
                    <span className="sm:hidden">Dublado</span>
                    <span className="hidden sm:inline">Dublado em PT-BR</span>
                  </button>
                </div>
                <div>
                  <button type="submit" className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800">Aplicar filtros</button>
                </div>
              </div>
            </form>
            <h2 className="sr-only">Jogos filtrados</h2>
            {games.data.length === 0 ? (
              <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">Nenhum jogo encontrado para o filtro selecionado.</p>
            ) : (
              <>
                <GameCards games={games.data} subjectName={subject?.name} disableLocalFilters />
                {Array.isArray(games?.links) && games.links.length > 0 && (
                  <nav className="mt-8 flex justify-center" aria-label="Paginação">
                    <ul className="inline-flex items-center gap-1">
                      {games.links.map((l, idx) => {
                        const label = l.label.replace('&laquo;', '«').replace('&raquo;', '»');
                        const isPrev = idx === 0;
                        const isNext = idx === games.links.length - 1;
                        const common = 'min-w-9 select-none rounded-md px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900';
                        if (!l.url) {
                          return (
                            <li key={idx}>
                              <span className={`${common} cursor-not-allowed bg-gray-100 text-gray-400`} aria-hidden={isPrev || isNext} aria-label={isPrev ? 'Anterior' : isNext ? 'Próxima' : undefined}>
                                {isPrev ? '‹' : isNext ? '›' : label}
                              </span>
                            </li>
                          );
                        }
                        return (
                          <li key={idx}>
                            <Link
                              href={l.url}
                              className={`${common} ${l.active ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50'}`}
                              aria-label={isPrev ? 'Anterior' : isNext ? 'Próxima' : undefined}
                              preserveScroll
                            >
                              {isPrev ? '‹' : isNext ? '›' : label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </nav>
                )}
              </>
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

function ShareMyCurriculum({ userId }: { userId: number }) {
  const [copied, setCopied] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const url = `${origin}/curriculo/${userId}`;

  const enc = encodeURIComponent;
  const wa = `https://wa.me/?text=${enc('Meu Currículo Gamer: ' + url)}`;
  const ig = `https://www.instagram.com/?url=${enc(url)}`;
  const x = `https://twitter.com/intent/tweet?text=${enc('Meu Currículo Gamer')}&url=${enc(url)}`;
  const mail = `mailto:?subject=${enc('Meu Currículo Gamer')}&body=${enc('Acesse meu currículo gamer: ' + url)}`;

  const legacyCopy = (text: string) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'absolute';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      const selection = document.getSelection();
      const selectedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (selectedRange && selection) {
        selection.removeAllRanges();
        selection.addRange(selectedRange);
      }
    } catch {}
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch (_) {
      legacyCopy(url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
      >
        Compartilhar meu currículo
      </button>
      {copied && <span className="ml-2 text-xs text-gray-600 align-middle">Link copiado!</span>}

      {open && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900">Compartilhar meu currículo</h3>
                <button onClick={() => setOpen(false)} className="rounded-md p-1 text-gray-500 hover:bg-gray-100" aria-label="Fechar">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={async () => { await copy(); setOpen(false); }} className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 cursor-pointer">
                  <CopyIcon className="h-5 w-5" />
                  Copiar Link
                </button>
                <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 cursor-pointer">
                  <WhatsAppIcon className="h-5 w-5" />
                  WhatsApp
                </a>
                <button
                  type="button"
                  onClick={async () => {
                    // Tenta compartilhar nativamente se disponível
                    // @ts-ignore
                    if (navigator.share) {
                      try {
                        // @ts-ignore
                        await navigator.share({ title: 'Meu Currículo Gamer', text: 'Acesse meu currículo gamer:', url });
                        setOpen(false);
                        return;
                      } catch {}
                    }
                    // Fallback: copia o link e abre Instagram para o usuário colar
                    await copy();
                    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
                    setOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 cursor-pointer"
                >
                  <InstagramIcon className="h-5 w-5" />
                  Instagram
                </button>
                <a href={x} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 cursor-pointer">
                  <XIcon className="h-5 w-5" />
                  X (Twitter)
                </a>
                <a href={mail} onClick={() => setOpen(false)} className="col-span-2 flex items-center justify-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 cursor-pointer">
                  <MailIcon className="h-5 w-5" />
                  E-mail
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 7a3 3 0 013-3h7a3 3 0 013 3v7a3 3 0 01-3 3h-7a3 3 0 01-3-3V7z" />
      <path d="M5 8a2 2 0 00-2 2v7a4 4 0 004 4h7a2 2 0 002-2v-1H9a4 4 0 01-4-4V8H5z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M.057 24l1.687-6.163A11.867 11.867 0 010 11.985C0 5.367 5.373 0 11.99 0 18.606 0 24 5.367 24 11.985 24 18.6 18.606 24 11.99 24a11.9 11.9 0 01-6.077-1.652L.057 24zm6.597-3.807c1.734 1.043 3.276 1.674 5.392 1.674 5.448 0 9.89-4.434 9.89-9.882 0-5.448-4.442-9.89-9.89-9.89-5.45 0-9.882 4.442-9.882 9.89 0 2.225.73 3.794 1.957 5.392l-.957 3.48 3.49-.664zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.03-.967-.272-.1-.47-.149-.669.149-.198.297-.767.967-.94 1.164-.174.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.174-.297-.019-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.496.099-.198.05-.372-.025-.521-.074-.149-.669-1.611-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/>
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.9.2 2.4.4.6.2 1 .5 1.5 1s.8.9 1 1.5c.2.5.3 1.2.4 2.4.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.9-.4 2.4-.2.6-.5 1-1 1.5s-.9.8-1.5 1c-.5.2-1.2.3-2.4.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.9-.2-2.4-.4-.6-.2-1-.5-1.5-1s-.8-.9-1-1.5c-.2-.5-.3-1.2-.4-2.4C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.2-1.9.4-2.4.2-.6.5-1 1-1.5s.9-.8 1.5-1c.5-.2 1.2-.3 2.4-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.8.1-1 .1-1.6.2-1.9.3-.5.2-.8.4-1.1.7-.3.3-.5.6-.7 1.1-.1.3-.2.9-.3 1.9-.1 1.3-.1 1.7-.1 4.8s0 3.5.1 4.8c.1 1 .2 1.6.3 1.9.2.5.4.8.7 1.1.3.3.6.5 1.1.7.3.1.9.2 1.9.3 1.3.1 1.7.1 4.8.1s3.5 0 4.8-.1c1-.1 1.6-.2 1.9-.3.5-.2.8-.4 1.1-.7.3-.3.5-.6.7-1.1.1-.3.2-.9.3-1.9.1-1.3.1-1.7.1-4.8s0-3.5-.1-4.8c-.1-1-.2-1.6-.3-1.9-.2-.5-.4-.8-.7-1.1-.3-.3-.6-.5-1.1-.7-.3-.1-.9-.2-1.9-.3-1.3-.1-1.7-.1-4.8-.1zm0 3.2a5.8 5.8 0 1 1 0 11.6 5.8 5.8 0 0 1 0-11.6zm0 1.8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm5.9-2.5a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6z"/>
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.9 2H22l-7.1 8.1L23 22h-6.8l-5.3-6.9L4.6 22H2l7.6-8.7L1.5 2h6.9l4.8 6.3L18.9 2zm-1.2 18h1.9L8.4 4H6.4l11.3 16z"/>
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M1.5 6.75A2.25 2.25 0 013.75 4.5h16.5A2.25 2.25 0 0122.5 6.75v10.5A2.25 2.25 0 0120.25 19.5H3.75A2.25 2.25 0 011.5 17.25V6.75z" />
      <path d="M2.723 6.8l7.98 5.09a2.25 2.25 0 002.594 0l7.98-5.09" />
    </svg>
  );
}

// removed duplicate ShareMyCurriculum definition
