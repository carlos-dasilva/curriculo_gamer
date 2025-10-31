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

      {/* Overlay de gradiente para contraste e legibilidade (opacidade reduzida de 75% -> 60%) */}
      <div className="absolute inset-0 -z-0 bg-black/70" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 py-[4.5rem] sm:py-[5.25rem] sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            {strings.hero.titulo}
          </h1>
          <p className="mt-6 text-lg leading-8 text-sky-50">
            {strings.hero.subtitulo}
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <a
              href={auth?.isAuthenticated ? '/meu-curriculo' : (() => {
                const base = auth?.loginUrl || '/auth/redirect/google';
                const sep = base.indexOf('?') >= 0 ? '&' : '?';
                return `${base}${sep}intended=${encodeURIComponent('/meu-curriculo')}`;
              })()}
              className="rounded-md bg-white px-5 py-3 text-sm font-semibold text-sky-700 shadow-sm hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {strings.hero.cta}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
