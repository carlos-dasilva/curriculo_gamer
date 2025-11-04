import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Header from '@/components/ui/Header';
import Hero from '@/components/ui/Hero';
import GameCards, { type GameCard } from '@/components/ui/GameCards';
import Footer from '@/components/ui/Footer';
import Pagination from '@/components/ui/Pagination';
import strings from '@/i18n/pt-BR/home.json';
type AuthInfo = {
  isAuthenticated: boolean;
  user?: { name: string; email: string } | null;
  loginUrl?: string;
  logoutUrl?: string;
  abilities?: { manageUsers?: boolean };
};

type Paginator<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
  games: Paginator<GameCard>;
  auth: AuthInfo;
  flash?: { success?: string; error?: string };
  filters?: { q?: string; sub?: boolean; dub?: boolean };
};

export default function HomeIndex({ games, auth, flash, filters }: Props) {
  const [q, setQ] = React.useState<string>(filters?.q || '');
  const [sub, setSub] = React.useState<boolean>(!!filters?.sub);
  const [dub, setDub] = React.useState<boolean>(!!filters?.dub);
  const handleCta = () => {
    const el = document.getElementById('sites');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    const params: Record<string, any> = {};
    if (q.trim()) params.q = q.trim();
    if (sub) params.sub = 1;
    if (dub) params.dub = 1;
    router.get('/', params, { preserveScroll: true, preserveState: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title={strings.header.inicio} />
      <Header auth={auth} />
      <main>
        {flash?.error && (
          <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
              {flash.error}
            </div>
          </div>
        )}
        <Hero onCtaClick={handleCta} />
        {/* Filtros (server-side) */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <form onSubmit={apply} className="mb-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="sm:flex-1">
                <label htmlFor="q" className="block text-sm font-medium text-gray-700">Buscar</label>
                <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={strings.cards.buscaPlaceholder}
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
        </div>
        {/* Reduz a largura para igualar o tamanho dos cards do /curriculo */}
        <div className="mx-auto max-w-5xl">
          <GameCards games={games.data} disableLocalFilters />
          {Array.isArray(games?.links) && games.links.length > 0 && (
            <Pagination links={games.links} />
          )}
          {false && Array.isArray(games?.links) && games.links.length > 0 && (
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
        </div>
      </main>
      <Footer />
    </div>
  );
}


