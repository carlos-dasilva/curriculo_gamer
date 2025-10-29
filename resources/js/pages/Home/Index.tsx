import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Header from '@/components/ui/Header';
import Hero from '@/components/ui/Hero';
import GameCards, { type GameCard } from '@/components/ui/GameCards';
import Footer from '@/components/ui/Footer';

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
};

export default function HomeIndex({ games, auth, flash }: Props) {
  const handleCta = () => {
    const el = document.getElementById('sites');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Início" />
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
        {/* Reduz a largura para igualar o tamanho dos cards do /curriculo */}
        <div className="mx-auto max-w-5xl">
          <GameCards games={games.data} />
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
