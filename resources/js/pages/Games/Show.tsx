import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import GameTitle from '@/components/ui/GameTitle';

type Studio = { id: number; name: string } | null;
type Platform = { id: number; name: string; release_date?: string | null; release_year?: number | null };
type Tag = { id: number; name: string; slug: string };
type ExternalLink = { label: string; url: string };

type GameDto = {
  id: number;
  name: string;
  cover_url?: string | null;
  description?: string | null;
  age_rating?: string | null;
  overall_score?: number | null;
  metacritic_metascore?: number | null;
  metacritic_user_score?: number | null;
  difficulty?: number | null;
  gameplay_hours?: number | null;
  hours_to_finish?: number | null;
  ptbr_subtitled: boolean;
  ptbr_dubbed: boolean;
  studio: Studio;
  platforms: Platform[];
  tags: Tag[];
  gallery_urls: string[];
  external_links: ExternalLink[];
};

type AuthInfo = {
  isAuthenticated: boolean;
  user?: { name: string; email: string; currentlyPlayingGameId?: number | null } | null;
  loginUrl?: string;
  logoutUrl?: string;
  abilities?: { manageUsers?: boolean };
};

type MyInfoDto = { score?: number | null; difficulty?: number | null; gameplay_hours?: number | null; notes?: string | null } | null;

type Props = {
  game: GameDto;
  auth: AuthInfo;
  myInfo?: MyInfoDto;
  myPlatformStatuses?: Record<number, 'nao_joguei' | 'quero_jogar' | 'joguei' | 'finalizei' | 'cem_por_cento'>;
};

export default function GameShow({ game, auth, myInfo, myPlatformStatuses }: Props) {
  const placeholder = '/img/sem-imagem.svg';
  const [isPlayingThis, setIsPlayingThis] = React.useState<boolean>(
    !!(auth?.user && (auth.user as any).currentlyPlayingGameId === game.id)
  );
  const [gallery, setGallery] = React.useState<{ id: number; url: string }[]>([...((game as any).gallery || [])]);
  const imagesMap = React.useMemo(() => new Map(gallery.map((g) => [g.url, g.id])), [gallery]);
  const allImages = React.useMemo(() => {
    const arr = [game.cover_url, ...gallery.map((g) => g.url)].filter(Boolean) as string[];
    return Array.from(new Set(arr));
  }, [game.cover_url, gallery]);

  const [isOpen, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  // Ordenação de plataformas
  const sortedPlatforms = React.useMemo(() => {
    const toIso = (d?: string | null): string | null => {
      if (!d) return null;
      return /^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(0, 10) : null;
    };
    const items = [...(game.platforms || [])];
    items.sort((a, b) => {
      const ad = toIso(a.release_date);
      const bd = toIso(b.release_date);
      if (ad !== bd) {
        if (ad == null) return 1;
        if (bd == null) return -1;
        const cmp = ad.localeCompare(bd);
        if (cmp !== 0) return cmp;
      }
      const ay = (a as any).release_year ?? null;
      const by = (b as any).release_year ?? null;
      if (ay !== by) {
        if (ay == null) return 1;
        if (by == null) return -1;
        return ay - by;
      }
      return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
    });
    return items;
  }, [game.platforms]);
  // Estado local (apenas UI neste momento)
  type LocalPlayStatus = 'nao_joguei' | 'quero_jogar' | 'joguei' | 'finalizei' | 'cem_por_cento';
  const STATUS_LABELS: Record<LocalPlayStatus, string> = {
    nao_joguei: 'Não joguei',
    quero_jogar: 'Quero Jogar',
    joguei: 'Joguei',
    finalizei: 'Finalizei',
    cem_por_cento: 'Fiz 100%',
  };
  const defaultStatuses = React.useMemo(() => {
    const m: Record<number, LocalPlayStatus> = {};
    (game.platforms || []).forEach((p) => {
      const preset = myPlatformStatuses?.[p.id];
      m[p.id] = (preset as LocalPlayStatus) || 'nao_joguei';
    });
    return m;
  }, [game.platforms, myPlatformStatuses]);
  const [myStatuses, setMyStatuses] = React.useState<Record<number, LocalPlayStatus>>(defaultStatuses);
  const [myScore, setMyScore] = React.useState<number>(typeof myInfo?.score === 'number' ? myInfo!.score! : 0);
  const [myDifficulty, setMyDifficulty] = React.useState<number>(typeof myInfo?.difficulty === 'number' ? myInfo!.difficulty! : 0);
  const [myNotes, setMyNotes] = React.useState(myInfo?.notes || '');
  const [myGameplayHours, setMyGameplayHours] = React.useState<number | ''>(typeof myInfo?.gameplay_hours === 'number' ? (myInfo!.gameplay_hours! as number) : 0);
  const [communityScore, setCommunityScore] = React.useState<number | null>(
    typeof game.overall_score === 'number' ? game.overall_score : (game.overall_score != null ? Number(game.overall_score) : null)
  );
  const [communityDifficulty, setCommunityDifficulty] = React.useState<number | null>(
    game.difficulty != null ? Number(game.difficulty) : null
  );
  const [communityGameplay, setCommunityGameplay] = React.useState<number | null>(
    game.gameplay_hours != null ? Number(game.gameplay_hours) : null
  );
  const [saving, setSaving] = React.useState(false);
  const [saveState, setSaveState] = React.useState<null | { type: 'success' | 'error'; message: string }>(null);

  const openAt = (idx: number) => {
    setIndex(idx);
    setOpen(true);
  };
  const close = () => setOpen(false);
  const prev = () => setIndex((i) => (i > 0 ? i - 1 : allImages.length - 1));
  const next = () => setIndex((i) => (i + 1) % allImages.length);
  const canManage = !!auth?.abilities?.manageUsers;
  const removeImage = async (imageId: number, url: string) => {
    if (!canManage || !imageId) return;
    if (!confirm('Remover esta imagem da galeria?')) return;
    try {
      // @ts-ignore
      await window.axios.delete(`/admin/jogos/${game.id}/imagens/${imageId}`);
      setGallery((prev) => prev.filter((g) => g.id !== imageId));
      setIndex((i) => {
        const currentUrl = allImages[i];
        if (currentUrl === url) {
          const nextLen = Math.max(0, allImages.length - 1);
          return i >= nextLen ? Math.max(0, nextLen - 1) : i;
        }
        return i;
      });
    } catch {}
  };

  React.useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, allImages.length]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title={game.name} />
      <Header auth={auth} />

      <main>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 pt-3 sm:px-6 lg:px-8">
        <ol className="flex items-center gap-2 text-sm text-gray-600">
          <li>
            <a href="/" className="hover:text-gray-900 hover:underline">Início</a>
          </li>
          <li aria-hidden="true" className="text-gray-400">/</li>
          <li aria-current="page" className="text-gray-900 font-medium truncate max-w-[60ch]">{game.name}</li>
        </ol>
      </nav>
      {/* Hero com imagem de capa */}
      <section aria-label={`Capa de ${game.name}`}>
        <div
          className="relative h-[46vh] min-h-[320px] w-full overflow-hidden"
          role="img"
          aria-label={`Capa do jogo ${game.name}`}
        >
          <img
            src={game.cover_url || placeholder}
            onError={(e) => {
              const t = e.currentTarget; t.onerror = null; t.src = placeholder;
            }}
            alt={game.cover_url ? `Capa: ${game.name}` : 'Sem imagem'}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            width={1600}
            height={900}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" aria-hidden="true" />

          <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-4 pb-6 sm:px-6 lg:px-8">
            <div className="w-full">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <GameTitle as="h1" text={game.name} className="text-2xl font-bold text-white sm:text-3xl md:text-4xl" />
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-sky-50/90">
                    {game.studio?.name && (
                      <span className="rounded bg-white/10 px-2 py-1">Estúdio: {game.studio.name}</span>
                    )}
                    {game.age_rating && (
                      <span className="rounded bg-white/10 px-2 py-1">Classificação: {game.age_rating}</span>
                    )}
                    <PtbrBadges subtitled={game.ptbr_subtitled} dubbed={game.ptbr_dubbed} />
                  </div>
                </div>
              </div>

              {/* Destaques de notas */}
              <div className="mt-4 flex flex-wrap items-center gap-4">
                {communityScore != null && (
                  <CommunityBadge label="Nota desta comunidade" value={Number(communityScore)} max={10} decimals={2} />
                )}
                {(game.metacritic_metascore != null && Number(game.metacritic_metascore) > 0) && (
                  <MetacriticBadge label="Metascore" value={game.metacritic_metascore} suffix="/100" max={100} decimals={0} />
                )}
                {(game.metacritic_user_score != null && Number(game.metacritic_user_score) > 0) && (
                  <MetacriticBadge label="User Score" value={game.metacritic_user_score} suffix="/10.00" max={10} decimals={2} />
                )}
              </div>

              {/* Botão Editar: último no mobile; ancorado no canto inferior direito no desktop */}
              {auth?.abilities?.manageUsers && (
                <Link
                  href={`/admin/jogos/${game.id}/editar`}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 sm:absolute sm:bottom-6 sm:right-8 sm:w-auto"
                >
                  Editar
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Miniaturas da galeria - 75% do tamanho e em linha única com setas */}
      {allImages.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8" aria-label="Galeria de imagens">
          <div className="relative">
            <button
              type="button"
              aria-label="Rolar imagens para a esquerda"
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded bg-white/90 p-2 text-gray-900 shadow ring-1 ring-gray-200 hover:bg-white"
              onClick={() => {
                const el = document.getElementById('thumb-track');
                if (el) el.scrollBy({ left: -360, behavior: 'smooth' });
              }}
            >
              ‹
            </button>
            <div className="overflow-x-auto px-10">
              <ul id="thumb-track" className="flex flex-nowrap items-center gap-2" role="list">
                {allImages.map((url, i) => {
                  const imageId = imagesMap.get(url || '');
                  return (
                    <li key={i} className="relative flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => openAt(i)}
                        className="group block overflow-hidden rounded-md border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                      >
                        <img
                          src={url || placeholder}
                          onError={(e) => { const t = e.currentTarget; t.onerror = null; t.src = placeholder; }}
                          alt={`Imagem ${i + 1} de ${game.name}`}
                          className="h-24 w-24 sm:h-28 sm:w-28 md:h-36 md:w-36 object-cover transition group-hover:scale-[1.03]"
                          loading="lazy"
                          decoding="async"
                          fetchPriority="low"
                          width={144}
                          height={144}
                        />
                      </button>
                      {null}
                    </li>
                  );
                })}
              </ul>
            </div>
            <button
              type="button"
              aria-label="Rolar imagens para a direita"
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded bg-white/90 p-2 text-gray-900 shadow ring-1 ring-gray-200 hover:bg-white"
              onClick={() => {
                const el = document.getElementById('thumb-track');
                if (el) el.scrollBy({ left: 360, behavior: 'smooth' });
              }}
            >
              ›
            </button>
          </div>
        </section>
      )}

      {/* Conteúdo principal */}
      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Coluna esquerda: descrição */}
          <section className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900">Descrição</h2>
            <p className="mt-2 whitespace-pre-line text-gray-700">{game.description || 'Sem descrição.'}</p>

            {/* Marcadores (movido logo após a descrição) */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-900">Marcadores</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {game.tags.length === 0 && <span className="text-sm text-gray-600">—</span>}
                {game.tags.map((t) => (
                  <span key={t.id} className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1 text-sm text-gray-800 ring-1 ring-inset ring-gray-200">#{t.slug}</span>
                ))}
              </div>
            </div>

            {/* Comentários da Comunidade */}
            <section className="mt-10" aria-label="Comentários da Comunidade">
              <h3 className="text-lg font-semibold text-gray-900">Comentários da Comunidade</h3>
              <CommunityComments
                gameId={game.id}
                isAuthenticated={!!auth?.isAuthenticated}
                canModerate={!!auth?.abilities?.manageUsers}
              />
            </section>
          </section>

          {/* Coluna direita: dados e links */}
          <aside>
            {/* Plataformas */}
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Plataformas</h3>
                <span className="text-sm font-semibold text-gray-900">Release</span>
              </div>
              <ul className="mt-2 space-y-2">
                {sortedPlatforms.length === 0 && (
                  <li className="text-sm text-gray-600">—</li>
                )}
                {sortedPlatforms.map((p) => (
                  <li key={p.id} className="text-sm text-gray-800">
                    <div className="flex items-center justify-between gap-3">
                      <span>{p.name}</span>
                      {p.release_date && (
                        <time className="text-xs text-gray-500" dateTime={p.release_date}>
                          {formatDate(p.release_date)}
                        </time>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Metas adicionais */}
            {(game.difficulty != null || game.gameplay_hours != null || ((game as any).hours_to_finish != null && Number((game as any).hours_to_finish) > 0)) && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">Detalhes</h3>
              <dl className="mt-2 space-y-1 text-sm text-gray-800">
                {game.difficulty != null && (
                  <div className="flex items-center justify-between"><dt>Dificuldade</dt><dd>{`${Number(communityDifficulty).toFixed(2)} / 10.00`}</dd></div>
                )}
                {(game as any).hours_to_finish != null && Number((game as any).hours_to_finish) > 0 && (
                  <div className="flex items-center justify-between"><dt>Horas para Finalizar</dt><dd>{Number((game as any).hours_to_finish).toFixed(0)} h</dd></div>
                )}
                {game.gameplay_hours != null && (
                  <div className="flex items-center justify-between"><dt>Média de horas jogadas</dt><dd>{Number(game.gameplay_hours).toFixed(1)} h</dd></div>
                )}
              </dl>
            </div>
            )}

            {/* Links externos */}
            {game.external_links.length > 0 && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">Links</h3>
              <ul className="mt-2 space-y-2">
                {game.external_links.map((l, idx) => (
                  <li key={idx}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            )}

            {/* Minhas Informações */}
            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">Minhas Informações</h3>

              {/* Progresso por plataforma */}
              <div className="mt-3 space-y-2">
                {sortedPlatforms.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-800">{p.name}</span>
                    <select
                      value={myStatuses[p.id] || 'nao_joguei'}
                      onChange={async (e) => {
                        const value = e.target.value as LocalPlayStatus;
                        setMyStatuses((s) => ({ ...s, [p.id]: value }));
                        if (auth?.isAuthenticated) {
                          try {
                            // @ts-ignore
                            await window.axios.post(`/jogos/${game.id}/plataformas/${p.id}/status`, { status: value });
                          } catch (err) {
                            // opcional: indicar erro visual se necessário
                          }
                        }
                      }}
                      className="w-44 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      aria-label={`Meu status em ${p.name}`}
                    >
                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Notas pessoais */}
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                <div>
                  <label htmlFor="myScore" className="block text-xs font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">Minha nota (1 a 10)</label>
                  <input
                    id="myScore"
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={myScore}
                    onChange={(e) => setMyScore(Math.round(Number(e.target.value)))}
                    className="mt-2 w-full accent-sky-600"
                  />
                  <div className="mt-1 text-xs text-gray-700">{myScore} / 10</div>
                </div>
                <div>
                  <label htmlFor="myDifficulty" className="block text-xs font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">Dificuldade (1 a 10)</label>
                  <input
                    id="myDifficulty"
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={myDifficulty}
                    onChange={(e) => setMyDifficulty(Math.round(Number(e.target.value)))}
                    className="mt-2 w-full accent-sky-600"
                  />
                  <div className="mt-1 text-xs text-gray-700">{myDifficulty} / 10</div>
                </div>
                <div>
                  <label htmlFor="myGameplayHours" className="block text-xs font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis">Horas de Jogo</label>
                  <input
                    id="myGameplayHours"
                    type="number"
                    min={0}
                    step={1}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={myGameplayHours === '' ? '' : String(myGameplayHours)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === '') return setMyGameplayHours('');
                      const n = Number(raw);
                      if (Number.isFinite(n)) setMyGameplayHours(Math.max(0, Math.trunc(n)));
                    }}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Considerações */}
              <div className="mt-4">
                <label htmlFor="myNotes" className="block text-xs font-medium text-gray-700">Minhas considerações</label>
                <textarea
                  id="myNotes"
                  rows={4}
                  value={myNotes}
                  onChange={(e) => setMyNotes(e.target.value)}
                  placeholder="Compartilhe suas impressões sobre o jogo..."
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                {/* Ações */}
                <div className="mt-4 flex items-center gap-3">
                  {auth?.isAuthenticated ? (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={async () => {
                        try {
                          setSaving(true);
                          const played = Object.values(myStatuses || {}).some((v) => v === 'joguei' || v === 'finalizei' || v === 'cem_por_cento');
                          const payload = {
                            score: myScore,
                            difficulty: myDifficulty,
                            gameplay_hours: myGameplayHours === '' ? null : myGameplayHours,
                            notes: myNotes,
                          } as any;
                          if (!played) {
                            payload.score = 0;
                            payload.difficulty = 0;
                            payload.gameplay_hours = 0;
                          }
                          // @ts-ignore
                          const resp = await window.axios.post(`/jogos/${game.id}/minhas-informacoes`, payload);
                          if (resp?.data && typeof resp.data.overall_score !== 'undefined') {
                            const os = resp.data.overall_score;
                            setCommunityScore(os === null ? null : Number(os));
                          }
                          if (resp?.data && typeof resp.data.avg_difficulty !== 'undefined') {
                            const ad = resp.data.avg_difficulty;
                            setCommunityDifficulty(ad === null ? null : Number(ad));
                          }
                          if (resp?.data && typeof resp.data.avg_gameplay_hours !== 'undefined') {
                            const agh = resp.data.avg_gameplay_hours;
                            setCommunityGameplay(agh === null ? null : Number(agh));
                          }
                          setSaveState({ type: 'success', message: 'Informações salvas.' });
                        } catch (e: any) {
                          setSaveState({ type: 'error', message: 'Não foi possível salvar.' });
                        } finally {
                          setSaving(false);
                          window.setTimeout(() => setSaveState(null), 3000);
                        }
                      }}
                      className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? 'Salvando…' : 'Salvar'}
                    </button>
                  ) : (
                    <a href={auth?.loginUrl || '#'} className="text-sm text-sky-700 underline-offset-2 hover:underline">Entre para salvar suas informações</a>
                  )}
                  {auth?.isAuthenticated && !isPlayingThis && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          // @ts-ignore
                          await window.axios.post(`/jogos/${game.id}/estou-jogando`);
                          setIsPlayingThis(true);
                        } catch (e) {
                          // silencioso conforme solicitado: sem mensagens visuais
                        } finally {
                          // nada a fazer
                        }
                      }}
                      className="ml-auto inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 cursor-pointer"
                      title="Definir este jogo como Estou Jogando"
                    >
                      Estou Jogando
                    </button>
                  )}
                  {saveState && (
                    <span
                      role="status"
                      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm shadow-sm ring-1 ring-inset ${saveState.type === 'success' ? 'bg-green-50 text-green-800 ring-green-200' : 'bg-red-50 text-red-800 ring-red-200'}`}
                    >
                      {saveState.type === 'success' ? <CheckIcon className="h-4 w-4" /> : <AlertIcon className="h-4 w-4" />}
                      <span>{saveState.message}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>

        
      </div>

      {/* Modal + Carrossel */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Galeria de imagens"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={close}
        >
          <div className="relative h-full w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={close}
              aria-label="Fechar"
              className="absolute right-2 top-2 z-10 rounded bg-white/90 p-2 text-gray-900 hover:bg-white"
            >
              <span className="block h-5 w-5">×</span>
            </button>
            {canManage && imagesMap.get(allImages[index] || '') && (
              <button
                onClick={() => {
                  const url = allImages[index] || '';
                  const id = imagesMap.get(url || '');
                  if (id) removeImage(id, url);
                }}
                aria-label="Excluir imagem atual"
                className="absolute right-14 top-2 z-10 rounded bg-red-600/90 px-2 py-1 text-sm font-semibold text-white shadow hover:bg-red-600"
              >
                Excluir
              </button>
            )}

            <div className="flex h-full w-full items-center justify-center">
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                aria-label="Anterior"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded bg-white/90 px-2 py-1 text-gray-900 hover:bg-white"
              >‹</button>
              <img
                src={allImages[index]}
                alt={`Imagem ${index + 1} de ${game.name}`}
                className="max-h-[80vh] max-w-full rounded-md object-contain shadow"
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                width={1600}
                height={900}
              />
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                aria-label="Próxima"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-white/90 px-2 py-1 text-gray-900 hover:bg-white"
              >›</button>
            </div>

            {/* Indicadores */}
            {allImages.length > 1 && (
              <div className="mt-3 flex justify-center gap-1">
                {allImages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIndex(i)}
                    aria-label={`Ir para imagem ${i + 1}`}
                    className={`h-2 w-2 rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </main>
      <Footer />
    </div>
  );
}

function CommunityBadge({ label, value, max = 10, decimals = 2 }: { label: string; value: number; max?: number; decimals?: number }) {
  if (value == null) return null as any;
  const score = Number(value);
  const percent = isFinite(score) && max > 0 ? (score / max) * 100 : score;
  const color = percent >= 75 ? 'bg-green-500' : percent >= 50 ? 'bg-yellow-400' : 'bg-red-500';
  const suffix = `/${max.toFixed(decimals)}`;
  return (
    <span className="inline-flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-200">
      <span>{label}:</span>
      <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded ${color} px-2 text-white`}>{score.toFixed(decimals)}</span>
      <span className="text-xs font-normal text-gray-700">{suffix}</span>
    </span>
  );
}

function PtbrBadges({ subtitled, dubbed }: { subtitled: boolean; dubbed: boolean }) {
  if (!subtitled && !dubbed) return null;
  return (
    <span className="inline-flex items-center gap-2">
      {subtitled && <span className="rounded bg-emerald-500/20 px-2 py-1 text-emerald-100 ring-1 ring-inset ring-emerald-400/40">Legendado PT-BR</span>}
      {dubbed && <span className="rounded bg-emerald-500/20 px-2 py-1 text-emerald-100 ring-1 ring-inset ring-emerald-400/40">Dublado PT-BR</span>}
    </span>
  );
}

function MetacriticBadge({ label, value, suffix, max = 100, decimals = 0 }: { label: string; value?: number | null; suffix?: string; max?: number; decimals?: number }) {
  if (value == null) return null;
  const score = Number(value);
  const percent = isFinite(score) && max > 0 ? (score / max) * 100 : score;
  const color = percent >= 75 ? 'bg-green-500' : percent >= 50 ? 'bg-yellow-400' : 'bg-red-500';
  return (
    <span className="inline-flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-200">
      <MetacriticIcon className="h-5 w-5" />
      <span>{label}:</span>
      <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded ${color} px-2 text-white`}>{score.toFixed(decimals)}</span>
      {suffix && <span className="text-xs font-normal text-gray-700">{suffix}</span>}
    </span>
  );
}

function MetacriticIcon({ className }: { className?: string }) {
  // Ícone simples (círculo com "m") para representar Metacritic
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="#202020" />
      <text x="12" y="16" textAnchor="middle" fontSize="12" fontFamily="Arial, Helvetica, sans-serif" fill="#fbd38d">m</text>
    </svg>
  );
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.586c.75 1.333-.21 2.99-1.742 2.99H3.48c-1.532 0-2.492-1.657-1.742-2.99L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V8a1 1 0 112 0v3a1 1 0 01-1 1z" clipRule="evenodd" />
    </svg>
  );
}

// --- Comentários da Comunidade ---
type CommunityComment = {
  id: string;
  author: { id: number; name: string; score?: number | null; platform?: { id: number; name: string; status?: 'nao_joguei' | 'quero_jogar' | 'joguei' | 'finalizei' | 'cem_por_cento' | null } | null };
  content: string;
  updated_at: string;
  avg_rating: number;
  rating_count: number;
  user_rating: number | null;
};

function StarIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.802 2.035a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.802-2.035a1 1 0 00-1.176 0l-2.802 2.035c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
      />
    </svg>
  );
}

function StarRating({
  value,
  max = 5,
  editable = false,
  onChange,
  ariaLabel,
}: {
  value: number | null;
  max?: number;
  editable?: boolean;
  onChange?: (v: number) => void;
  ariaLabel?: string;
}) {
  const v = Math.max(0, Math.min(max, value ?? 0));
  return (
    <div className="inline-flex items-center gap-1" aria-label={ariaLabel}>
      {Array.from({ length: max }).map((_, i) => {
        const idx = i + 1;
        const filled = v >= idx;
        return (
          <button
            key={idx}
            type="button"
            disabled={!editable}
            onClick={() => editable && onChange && onChange(idx)}
            className={`h-5 w-5 ${editable ? 'cursor-pointer' : 'cursor-default'} text-yellow-400 disabled:opacity-70`}
            aria-label={`${ariaLabel || 'nota'}: ${idx}`}
            title={editable ? `Definir nota ${idx}` : undefined}
          >
            <StarIcon filled={filled} className="h-5 w-5" />
          </button>
        );
      })}
    </div>
  );
}

function CommunityComments({ gameId, isAuthenticated, canModerate }: { gameId: number; isAuthenticated: boolean; canModerate: boolean }) {
  const [comments, setComments] = React.useState<CommunityComment[]>([]);
  const [page, setPage] = React.useState(1);
  const [lastPage, setLastPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<null | { authorId: number; name: string }>(null);
  const [deleting, setDeleting] = React.useState(false);

  const statusToLabel = (s?: string | null): string | null => {
    switch (s) {
      case 'cem_por_cento':
        return 'Fiz 100%';
      case 'finalizei':
        return 'Finalizei';
      case 'joguei':
        return 'Joguei';
      case 'quero_jogar':
        return 'Quero jogar';
      case 'nao_joguei':
        return 'Não joguei';
      default:
        return null;
    }
  };

  const fetchComments = React.useCallback(async (p = 1) => {
    try {
      setLoading(true);
      setError(null);
      // @ts-ignore
      const resp = await window.axios.get(`/jogos/${gameId}/comentarios`, { params: { page: p } });
      const data = resp?.data;
      setComments(Array.isArray(data?.data) ? data.data : []);
      setPage(data?.pagination?.page || p);
      setLastPage(data?.pagination?.last_page || 1);
      setTotal(data?.pagination?.total || 0);
    } catch (e: any) {
      setError('Não foi possível carregar os comentários.');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  React.useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  const rateComment = async (authorId: number, rating: number) => {
    try {
      // @ts-ignore
      const resp = await window.axios.post(`/jogos/${gameId}/comentarios/${authorId}/nota`, { rating });
      const { avg_rating, rating_count } = resp?.data || {};
      setComments((list) =>
        list.map((c) =>
          c.author.id === authorId
            ? { ...c, user_rating: rating, avg_rating: typeof avg_rating === 'number' ? avg_rating : c.avg_rating, rating_count: typeof rating_count === 'number' ? rating_count : c.rating_count }
            : c
        )
      );
    } catch (e) {
      // ignore silently or show message
    }
  };

  const deleteComment = async (authorId: number) => {
    if (!canModerate) return;
    try {
      // @ts-ignore
      await window.axios.delete(`/jogos/${gameId}/comentarios/${authorId}`);
      const willBeEmpty = comments.length === 1 && page > 1;
      fetchComments(willBeEmpty ? page - 1 : page);
    } catch (e) {
      // ignore silently or show message
    }
  };

  return (
    <div className="mt-4">
      {loading && <p className="text-sm text-gray-600">Carregando comentários…</p>}
      {error && <p className="text-sm text-red-700">{error}</p>}
      {!loading && comments.length === 0 && (
        <p className="text-sm text-gray-600">Ainda não há comentários para este jogo.</p>
      )}

      <ul className="mt-2 space-y-4" role="list">
        {comments.map((c) => (
          <li key={c.id} className="relative rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start">
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 pr-4">
                    <p className="truncate text-sm font-semibold text-gray-900" title={c.author.name}>
                      {c.author.name}
                    </p>
                    {(c.author.platform?.name || (c.author.score ?? 0) > 0) && (
                      <p className="mt-0.5 text-xs text-gray-600">
                        {c.author.platform?.name || ''}
                        {(() => {
                          const lab = statusToLabel(c.author.platform?.status ?? null);
                          return lab ? `(${lab})` : '';
                        })()}
                        {(c.author.platform?.name && (c.author.score ?? 0) > 0) ? ' · ' : ''}
                        {(c.author.score ?? 0) > 0 ? `Nota ${Number(c.author.score)}` : ''}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-500">Atualizado em {new Date(c.updated_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-[11px] font-medium text-gray-600">Nota Geral</p>
                      <div className="flex items-center gap-2">
                        <StarRating value={c.avg_rating || 0} editable={false} ariaLabel={`Nota geral para comentário de ${c.author.name}`} />
                      </div>
                    </div>
                    {isAuthenticated && (
                      <div className="text-right">
                        <p className="text-[11px] font-medium text-gray-600">Minha Nota</p>
                        <StarRating value={c.user_rating ?? 0} editable={true} onChange={(v) => rateComment(c.author.id, v)} ariaLabel={`Minha nota para comentário de ${c.author.name}`} />
                      </div>
                    )}
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm text-gray-800">{c.content}</p>
              </div>
            </div>

            {canModerate && (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmDelete({ authorId: c.author.id, name: c.author.name })}
                  className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                >
                  Excluir
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Paginação */}
      {lastPage > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => page > 1 && fetchComments(page - 1)}
            disabled={page <= 1}
            className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>
          <p className="text-sm text-gray-600">Página {page} de {lastPage}</p>
          <button
            type="button"
            onClick={() => page < lastPage && fetchComments(page + 1)}
            disabled={page >= lastPage}
            className="inline-flex items-center rounded-md bg-white px-3 py-1.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}

      {/* Modal de confirmação para excluir comentário */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" aria-hidden="true" onClick={() => (!deleting ? setConfirmDelete(null) : null)} />
          <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-2xl ring-1 ring-gray-200">
            <h4 id="confirm-title" className="text-base font-semibold text-gray-900">Excluir comentário</h4>
            <p className="mt-2 text-sm text-gray-700">Tem certeza que deseja excluir o comentário de <strong>{confirmDelete.name}</strong>? Esta ação não pode ser desfeita.</p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (deleting) return;
                  try {
                    setDeleting(true);
                    await deleteComment(confirmDelete.authorId);
                    setConfirmDelete(null);
                  } finally {
                    setDeleting(false);
                  }
                }}
                disabled={deleting}
                className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
