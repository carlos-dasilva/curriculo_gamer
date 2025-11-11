import React from 'react';
import { usePage } from '@inertiajs/react';
import strings from '@/i18n/pt-BR/home.json';

type Props = {
  onCtaClick?: () => void;
};

export default function Hero({ onCtaClick }: Props) {
  const page = usePage();
  const auth = (page.props as any).auth as {
    isAuthenticated: boolean;
    loginUrl?: string;
  };
  const site = (page.props as any).site as {
    socials?: { facebook?: string | null };
  } | undefined;
  const fbUrl = (site?.socials?.facebook || '').trim();
  /*
   * Imagens públicas: /img/banner.png (mobile) e /img/bannerWide.png (md+)
   * Usamos <picture> para garantir troca por breakpoint, com overlay por cima.
   */
  return (
    <section id="inicio" aria-label={strings.hero.altImagem} className="relative isolate overflow-hidden">
      {/* Imagem responsiva */}
      <picture className="pointer-events-none absolute inset-0 -z-10">
        <source media="(min-width: 768px)" srcSet="/img/hero.png" />
        <img
          src="/img/hero.png"
          alt={strings.hero.altImagem}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          width={1600}
          height={900}
          /* TODO: Ajustar dimensões para o arquivo real e variações responsivas se disponíveis */
        />
      </picture>

      {/* Overlay gamer: degrade escuro com acento brand */}
      <div className="absolute inset-0 -z-0 bg-gradient-to-b from-black/70 via-brand-900/40 to-black/60" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 py-[4.5rem] sm:py-[5.25rem] sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            {strings.hero.titulo}
          </h1>
          <p className="mt-6 text-lg leading-8 text-brand-100">
            {strings.hero.subtitulo}
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <a
              href={auth?.isAuthenticated ? '/meu-curriculo' : (() => {
                const base = auth?.loginUrl || '/auth/redirect/google';
                const sep = base.indexOf('?') >= 0 ? '&' : '?';
                return `${base}${sep}intended=${encodeURIComponent('/meu-curriculo')}`;
              })()}
              className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-brand-600 shadow-sm ring-1 ring-inset ring-brand-600 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              {strings.hero.cta}
            </a>
            {fbUrl && (
              <a
                href={fbUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Siga no Facebook"
                title="Siga no Facebook"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/5 px-5 py-3 text-sm font-medium text-white shadow-sm hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <FacebookIcon className="h-5 w-5" />
                <span>Siga no Facebook</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M22 12.06C22 6.5 17.52 2 11.94 2 6.37 2 2 6.5 2 12.06 2 17.1 5.66 21.24 10.44 22v-7.03H7.9v-2.91h2.54V9.41c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.55v1.87h2.78l-.44 2.91h-2.34V22C18.34 21.24 22 17.1 22 12.06z" />
    </svg>
  );
}
