import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

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
  user?: { name: string; email: string } | null;
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

  const allImages = React.useMemo(() => {
    const arr = [game.cover_url, ...(game.gallery_urls || [])].filter(Boolean) as string[];
    return Array.from(new Set(arr));
  }, [game.cover_url, game.gallery_urls]);

  const [isOpen, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  const sortedPlatforms = React.useMemo(() => {
    const toIsoDate = (d?: string | null): string | null => {
      if (!d || typeof d !== 'string') return null;
      // Expecting YYYY-MM-DD; if valid, lexical compare works for chronology
      return /^\d{4}-\d{2}-\d{2}/.test(d) ? d.slice(0, 10) : null;
    };
    const items = [...(game.platforms || [])];
    items.sort((a, b) => {
      // 1) Full release date of the game on that platform (asc), nulls last
      const ad = toIsoDate(a.release_date);
      const bd = toIsoDate(b.release_date);
      if (ad !== bd) {
        if (ad == null) return 1;
        if (bd == null) return -1;
        const cmp = ad.localeCompare(bd);
        if (cmp !== 0) return cmp;
      }
      // 2) Platform release year (asc), nulls last
      const ay = a.release_year ?? null;
      const by = b.release_year ?? null;
      if (ay !== by) {
        if (ay == null) return 1;
        if (by == null) return -1;
        if (ay !== by) return ay - by;
      }
      // 3) Platform name alphabetical
      return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
    });
    return items;
  }, [game.platforms]);

  const STATUS_LABELS: Record<'nao_joguei' | 'quero_jogar' | 'joguei' | 'finalizei' | 'cem_por_cento', string> = {
    nao_joguei: 'Não joguei',
    quero_jogar: 'Quero Jogar',
    joguei: 'Joguei',
    finalizei: 'Finalizei',
    cem_por_cento: 'Fiz 100%',
  };

  const defaultStatuses = React.useMemo(() => {
    const m: Record<number, keyof typeof STATUS_LABELS> = {};
    (game.platforms || []).forEach((p) => {
      const preset = myPlatformStatuses?.[p.id];
      m[p.id] = (preset as any) || 'nao_joguei';
    });
    return m;
  }, [game.platforms, myPlatformStatuses]);

  const [myStatuses, setMyStatuses] = React.useState<Record<number, keyof typeof STATUS_LABELS>>(defaultStatuses);

  const openAt = (idx: number) => { setIndex(idx); setOpen(true); };
  const close = () => setOpen(false);
  const prev = () => setIndex((i) => (i > 0 ? i - 1 : allImages.length - 1));
  const next = () => setIndex((i) => (i + 1) % allImages.length);

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
          <div className="relative h-[46vh] min-h-[320px] w-full overflow-hidden" role="img" aria-label={`Capa do jogo ${game.name}`}>
            <img
              src={game.cover_url || placeholder}
              onError={(e) => { const t = e.currentTarget; t.onerror = null; t.src = placeholder; }}
              alt={game.cover_url ? `Capa: ${game.name}` : 'Sem imagem'}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" aria-hidden="true" />

            <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-4 pb-6 sm:px-6 lg:px-8">
              <div className="w-full">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">{game.name}</h1>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-sky-50/90">
                      {game.studio?.name && (
                        <span className="rounded bg-white/10 px-2 py-1">Estúdio: {game.studio.name}</span>
                      )}
                      {game.age_rating && (
                        <span className="rounded bg-white/10 px-2 py-1">Classificação: {game.age_rating}</span>
                      )}
                    </div>
                  </div>
                  {auth?.abilities?.manageUsers && (
                    <Link
                      href={`/admin/jogos/${game.id}/editar`}
                      className="inline-flex items-center justify-center rounded-md bg-white/90 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-white"
                    >
                      Editar
                    </Link>
                  )}
                </div>

                {/* Destaques */}
                <div className="mt-4 flex flex-wrap items-center gap-4">
                  {typeof game.overall_score === 'number' && (
                    <Badge label="Nota desta comunidade" value={Number(game.overall_score)} max={10} decimals={2} />
                  )}
                  {typeof game.metacritic_metascore === 'number' && (
                    <Badge label="Metascore" value={Number(game.metacritic_metascore)} max={100} decimals={0} suffix="/100" />
                  )}
                  {(game.metacritic_user_score != null && Number(game.metacritic_user_score) > 0) && (
                    <Badge label="User Score" value={Number(game.metacritic_user_score)} max={10} decimals={2} suffix="/10.00" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Conteúdo principal */}
        <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Coluna esquerda: descrição */}
            <section className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900">Descrição</h2>
              <p className="mt-2 whitespace-pre-line text-gray-700">{game.description || 'Sem descrição.'}</p>

              {/* Marcadores */}
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-gray-900">Marcadores</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {game.tags.length === 0 && <span className="text-sm text-gray-600">-</span>}
                  {game.tags.map((t) => (
                    <span key={t.id} className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1 text-sm text-gray-800 ring-1 ring-inset ring-gray-200">#{t.slug}</span>
                  ))}
                </div>
              </div>
            </section>

            {/* Coluna direita */}
            <aside>
              {/* Plataformas */}
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Plataformas</h3>
                  <span className="text-sm font-semibold text-gray-900">Release</span>
                </div>
                <ul className="mt-2 space-y-2">
                  {sortedPlatforms.length === 0 && (
                    <li className="text-sm text-gray-600">-</li>
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

              {/* Minhas Informações */}
              <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900">Minhas Informações</h3>
                <div className="mt-3 space-y-2">
                  {sortedPlatforms.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-800">{p.name}</span>
                      <select
                        value={myStatuses[p.id] || 'nao_joguei'}
                        onChange={async (e) => {
                          const value = e.target.value as keyof typeof STATUS_LABELS;
                          setMyStatuses((s) => ({ ...s, [p.id]: value }));
                          if (auth?.isAuthenticated) {
                            try {
                              // @ts-ignore
                              await window.axios.post(`/jogos/${game.id}/plataformas/${p.id}/status`, { status: value });
                            } catch {}
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
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function formatDate(iso: string): string {
  const y = iso.slice(0, 4);
  const m = iso.slice(5, 7);
  const d = iso.slice(8, 10);
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

function Badge({ label, value, max = 10, decimals = 2, suffix }: { label: string; value: number; max?: number; decimals?: number; suffix?: string }) {
  const percent = isFinite(value) && max > 0 ? (value / max) * 100 : value;
  const color = percent >= 75 ? 'bg-green-500' : percent >= 50 ? 'bg-yellow-400' : 'bg-red-500';
  return (
    <span className="inline-flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-200">
      <span>{label}:</span>
      <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded ${color} px-2 text-white`}>{value.toFixed(decimals)}</span>
      {suffix && <span className="text-xs font-normal text-gray-700">{suffix}</span>}
    </span>
  );
}
