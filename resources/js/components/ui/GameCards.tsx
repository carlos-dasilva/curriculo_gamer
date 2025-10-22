import React from 'react';
import { Link } from '@inertiajs/react';
// Placeholder definido localmente para evitar confusão com o texto antigo de busca
const SEARCH_PLACEHOLDER = 'Buscar por nome, estúdio, plataforma ou marcadores...';

export type GameCard = {
  id: number;
  name: string;
  cover_url?: string | null;
  description?: string | null;
  overall_score?: number | string | null;
  studio?: { name: string } | null;
  platforms?: { name: string }[];
  tags?: { name: string; slug: string }[];
};

type Props = {
  games: GameCard[];
};

export default function GameCards({ games }: Props) {
  const placeholder = '/img/sem-imagem.svg';
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return games;
    return games.filter((g) => {
      const hay = [
        g.name,
        g.studio?.name || '',
        ...(g.platforms || []).map((p) => p.name),
        ...(g.tags || []).flatMap((t) => [t.name, t.slug]),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [games, query]);

  return (
    <section id="sites" aria-label="Lista de jogos">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          <label htmlFor="busca" className="sr-only">{SEARCH_PLACEHOLDER}</label>
          <input
            id="busca"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={SEARCH_PLACEHOLDER}
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm"
            aria-describedby="resultado-contagem"
          />
          <p id="resultado-contagem" className="mt-2 text-sm text-gray-600">{filtered.length} resultado(s)</p>
        </div>

        {filtered.length === 0 ? (
          <p className="text-center text-gray-600">Nenhum jogo liberado encontrado.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {filtered.map((g) => (
              <li key={g.id} className="group rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
                {/* Card quadrado com imagem de fundo */}
                <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                  <Link
                    href={`/jogos/${g.id}`}
                    aria-label={`Ver detalhes de ${g.name}`}
                    className="absolute inset-0 z-20 block"
                  >
                    <span className="sr-only">Ver detalhes de {g.name}</span>
                  </Link>
                  <img
                    src={g.cover_url || placeholder}
                    onError={(e) => {
                      const t = e.currentTarget; t.onerror = null; t.src = placeholder;
                    }}
                    alt={g.cover_url ? `Capa: ${g.name}` : 'Sem imagem'}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  {/* Nota destacada no topo-direito */}
                  {g.overall_score != null && g.overall_score !== '' && (
                    <div className="absolute right-3 top-3">
                      <span className="inline-flex items-center justify-center rounded-lg bg-amber-400 px-3 py-1.5 text-base font-bold text-gray-900 ring-1 ring-amber-300 drop-shadow-md">
                        {Number(g.overall_score).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {/* Gradiente para legibilidade */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" aria-hidden="true" />
                  {/* Nome + descrição no rodapé (ellipsis) */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="line-clamp-2 text-base font-semibold text-white">{g.name}</h3>
                    {g.description && (
                      <p className="mt-1 line-clamp-3 text-sm text-sky-50">{g.description}</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
