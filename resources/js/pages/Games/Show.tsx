import React from 'react';
import { Head } from '@inertiajs/react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

type Studio = { id: number; name: string } | null;
type Platform = { id: number; name: string; release_date?: string | null };
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

type Props = {
  game: GameDto;
  auth: AuthInfo;
};

export default function GameShow({ game, auth }: Props) {
  const placeholder = '/img/sem-imagem.svg';
  const allImages = React.useMemo(() => {
    const arr = [game.cover_url, ...(game.gallery_urls || [])].filter(Boolean) as string[];
    // remove duplicadas preservando ordem
    return Array.from(new Set(arr));
  }, [game.cover_url, game.gallery_urls]);

  const [isOpen, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  const openAt = (idx: number) => {
    setIndex(idx);
    setOpen(true);
  };
  const close = () => setOpen(false);
  const prev = () => setIndex((i) => (i > 0 ? i - 1 : allImages.length - 1));
  const next = () => setIndex((i) => (i + 1) % allImages.length);

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
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" aria-hidden="true" />

          <div className="relative z-10 mx-auto flex h-full max-w-7xl items-end px-4 pb-6 sm:px-6 lg:px-8">
            <div className="w-full">
              <h1 className="text-2xl font-bold text-white sm:text-3xl md:text-4xl">{game.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-sky-50/90">
                {game.studio?.name && (
                  <span className="rounded bg-white/10 px-2 py-1">Estúdio: {game.studio.name}</span>
                )}
                {game.age_rating && (
                  <span className="rounded bg-white/10 px-2 py-1">Classificação: {game.age_rating}</span>
                )}
                <PtbrBadges subtitled={game.ptbr_subtitled} dubbed={game.ptbr_dubbed} />
              </div>

              {/* Destaques de notas */}
              <div className="mt-4 flex flex-wrap items-center gap-4">
                {game.overall_score != null && (
                  <Badge label="Nota da comunidade" value={`${Number(game.overall_score).toFixed(2)} / 10.00`} />
                )}
                <MetacriticBadge label="Metascore" value={game.metacritic_metascore} suffix="/100" max={100} decimals={0} />
                <MetacriticBadge label="User Score" value={game.metacritic_user_score} suffix="/10.00" max={10} decimals={2} />
              </div>
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
                {allImages.map((url, i) => (
                  <li key={i} className="flex-shrink-0">
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
                      />
                    </button>
                  </li>
                ))}
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
                {game.platforms.length === 0 && (
                  <li className="text-sm text-gray-600">—</li>
                )}
                {game.platforms.map((p) => (
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
            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">Detalhes</h3>
              <dl className="mt-2 space-y-1 text-sm text-gray-800">
                {game.difficulty != null && (
                  <div className="flex items-center justify-between"><dt>Dificuldade</dt><dd>{`${Number(game.difficulty).toFixed(2)} / 10.00`}</dd></div>
                )}
                {game.gameplay_hours != null && (
                  <div className="flex items-center justify-between"><dt>Gameplay médio</dt><dd>{Number(game.gameplay_hours).toFixed(1)} h</dd></div>
                )}
              </dl>
            </div>

            {/* Links externos */}
            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">Links</h3>
              <ul className="mt-2 space-y-2">
                {game.external_links.length === 0 && <li className="text-sm text-gray-600">—</li>}
                {game.external_links.map((l, idx) => (
                  <li key={idx}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-sky-700 hover:text-sky-900 hover:underline">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {/* Tags */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Marcadores</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {game.tags.length === 0 && <span className="text-sm text-gray-600">—</span>}
            {game.tags.map((t) => (
              <span key={t.id} className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-1 text-sm text-gray-800 ring-1 ring-inset ring-gray-200">#{t.slug}</span>
            ))}
          </div>
        </section>
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

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-bold text-gray-900 ring-1 ring-amber-300">
      <span>{label}:</span>
      <span>{value}</span>
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
