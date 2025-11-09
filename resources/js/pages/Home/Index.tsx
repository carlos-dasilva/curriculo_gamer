import React from 'react';
import { Link, router } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import Hero from '@/components/ui/Hero';
import GameCards, { type GameCard } from '@/components/ui/GameCards';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
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
    <AppLayout
      title="Currículo Gamer"
      description="Explore jogos legendados e dublados em PT-BR e organize seu currÃ­culo gamer."
    >
      <main>
        {/* SEO: garantir um h1 Ãºnico e descritivo */}
        <h1 className="sr-only">CurrÃ­culo Gamer â€” Descubra, filtre e organize seus jogos</h1>

        {flash?.error && (
          <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 lg:px-8">
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
              {flash.error}
            </div>
          </div>
        )}

        <Hero onCtaClick={handleCta} />

        {/* Filtros (server-side) */}
        <section aria-label="Filtros de busca" className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <form onSubmit={apply} className="mb-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="sm:flex-1">
                <Input
                  id="q"
                  label="Buscar"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={strings.cards.buscaPlaceholder}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  aria-pressed={!!sub}
                  onClick={() => setSub((v) => !v)}
                  variant={sub ? 'primary' : 'outline'}
                  size="sm"
                  pill
                  className="gap-2"
                >
                  <span className="sm:hidden">Legendado</span>
                  <span className="hidden sm:inline">Legendado em PT-BR</span>
                </Button>
                <Button
                  type="button"
                  aria-pressed={!!dub}
                  onClick={() => setDub((v) => !v)}
                  variant={dub ? 'primary' : 'outline'}
                  size="sm"
                  pill
                  className="gap-2"
                >
                  <span className="sm:hidden">Dublado</span>
                  <span className="hidden sm:inline">Dublado em PT-BR</span>
                </Button>
              </div>
              <div>
                <Button type="submit" variant="primary">Aplicar filtros</Button>
              </div>
            </div>
          </form>
        </section>

        {/* Reduz a largura para igualar o tamanho dos cards do /curriculo */}
        <div className="mx-auto max-w-5xl">
          <GameCards games={games.data} disableLocalFilters />
          {Array.isArray(games?.links) && games.links.length > 0 && (
            <Pagination links={games.links} />
          )}
        </div>
      </main>
    </AppLayout>
  );
}


