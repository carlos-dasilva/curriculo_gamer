import React from 'react';
import strings from '@/i18n/pt-BR/home.json';

export type Site = {
  name: string;
  path: string;
  category: string;
  description: string;
};

type Props = {
  sites: Site[];
};

export default function CardsGrid({ sites }: Props) {
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter((s) =>
      [s.name, s.category, s.description].some((v) => v.toLowerCase().includes(q))
    );
  }, [query, sites]);

  return (
    <section id="sites" aria-label="Lista de sites">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <label htmlFor="busca" className="sr-only">
            {strings.cards.buscaPlaceholder}
          </label>
          <input
            id="busca"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={strings.cards.buscaPlaceholder}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:text-sm"
            aria-describedby="resultado-contagem"
          />
          <p id="resultado-contagem" className="mt-2 text-sm text-gray-600">
            {filtered.length} resultado(s)
          </p>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-gray-600" role="status">
            {strings.cards.semResultados}
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {filtered.map((s, idx) => (
              <li key={`${s.path}-${idx}`} className="group rounded-2xl border border-gray-200/80 bg-white/95 p-5 shadow-md ring-1 ring-gray-100/80 transition duration-200 hover:shadow-lg hover:-translate-y-0.5 supports-[backdrop-filter]:bg-white/80 focus-within:ring-2 focus-within:ring-brand-500">
                <div className="mb-3 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-1 text-xs font-medium text-brand-800 ring-1 ring-inset ring-brand-200">
                    {s.category}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  <a
                    href={s.path}
                    target={s.path.startsWith('http') ? '_blank' : undefined}
                    rel={s.path.startsWith('http') ? 'noopener noreferrer' : undefined}
                    aria-label={`${s.name}: ${s.description}`}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:rounded-sm"
                  >
                    {s.name}
                  </a>
                </h3>
                <p className="mt-2 line-clamp-3 text-sm text-gray-600">{s.description}</p>
                <div className="mt-4">
                  <a
                    href={s.path}
                    target={s.path.startsWith('http') ? '_blank' : undefined}
                    rel={s.path.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                  >
                    {strings.cards.botaoAcessar}
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
