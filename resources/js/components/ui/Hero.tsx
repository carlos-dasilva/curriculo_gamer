import React from 'react';
import strings from '@/i18n/pt-BR/home.json';

type Props = {
  onCtaClick?: () => void;
};

export default function Hero({ onCtaClick }: Props) {
  /*
   * Imagens públicas: /img/banner.png (mobile) e /img/bannerWide.png (md+)
   * Usamos <picture> para garantir troca por breakpoint, com overlay por cima.
   */
  return (
    <section id="inicio" aria-label={strings.hero.altImagem} className="relative isolate overflow-hidden">
      {/* Imagem responsiva */}
      <picture className="pointer-events-none absolute inset-0 -z-10">
        <source media="(min-width: 768px)" srcSet="/img/bannerWide.png" />
        <img src="/img/banner.png" alt={strings.hero.altImagem} className="h-full w-full object-cover" />
      </picture>

      {/* Overlay de gradiente para contraste e legibilidade (opacidade reduzida de 75% -> 60%) */}
      <div className="absolute inset-0 -z-0 bg-gradient-to-r from-sky-700/60 to-sky-800/60" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:py-28 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            {strings.hero.titulo}
          </h1>
          <p className="mt-6 text-lg leading-8 text-sky-50">
            {strings.hero.subtitulo}
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            <a
              href="#sites"
              onClick={onCtaClick}
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
