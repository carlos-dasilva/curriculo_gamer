﻿import React from 'react';
// Placeholder definido localmente para evitar confusão com o texto antigo de busca
const SEARCH_PLACEHOLDER = 'Buscar por nome, estúdio, plataforma ou marcadores...';

export type GameCard = {
  id: number;
  name: string;
  cover_url?: string | null;
  description?: string | null;
  overall_score?: number | string | null;
  user_score?: number | string | null;
  ptbr_subtitled?: boolean | number | string;
  ptbr_dubbed?: boolean | number | string;
  studio?: { name: string } | null;
  platforms?: { name: string }[];
  tags?: { name: string; slug: string }[];
};

type Props = {
  games: GameCard[];
  subjectName?: string;
};

export default function GameCards({ games, subjectName }: Props) {
  const placeholder = '/img/sem-imagem.svg';
  const [query, setQuery] = React.useState('');
  const [onlySubtitled, setOnlySubtitled] = React.useState(false);
  const [onlyDubbed, setOnlyDubbed] = React.useState(false);

  const filtered = React.useMemo(() => {
    const isTrue = (v: any) => v === true || v === 1 || v === '1' || v === 'true';
    const q = query.trim().toLowerCase();
    let list = games;
    if (onlySubtitled) list = list.filter((g) => isTrue((g as any).ptbr_subtitled));
    if (onlyDubbed) list = list.filter((g) => isTrue((g as any).ptbr_dubbed));
    if (!q) return list;
    return list.filter((g) => {
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
  }, [games, query, onlySubtitled, onlyDubbed]);

  return (
    <section id="sites" aria-label="Lista de jogos">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6">
          {/* Filtros de idioma (pills modernos) */}
          <div className="mb-3" role="group" aria-label="Filtros de idioma">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  aria-pressed={onlySubtitled}
                  onClick={() => setOnlySubtitled((v) => !v)}
                  className={`${onlySubtitled ? 'bg-gray-900 text-white ring-gray-900' : 'bg-white text-gray-800 ring-gray-300 hover:bg-gray-50'} inline-flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1 ring-inset shadow-sm transition cursor-pointer`}
                >
                  <SubtitleIcon className="h-4 w-4" />
                  <span className="sm:hidden">Legendado</span>
                  <span className="hidden sm:inline">Legendado em PT-BR</span>
                </button>
                <button
                  type="button"
                  aria-pressed={onlyDubbed}
                  onClick={() => setOnlyDubbed((v) => !v)}
                  className={`${onlyDubbed ? 'bg-gray-900 text-white ring-gray-900' : 'bg-white text-gray-800 ring-gray-300 hover:bg-gray-50'} inline-flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1 ring-inset shadow-sm transition cursor-pointer`}
                >
                  <MicIcon className="h-4 w-4" />
                  <span className="sm:hidden">Dublado</span>
                  <span className="hidden sm:inline">Dublado em PT-BR</span>
                </button>
              </div>
              {(onlySubtitled || onlyDubbed) && (
                <button
                  type="button"
                  onClick={() => { setOnlySubtitled(false); setOnlyDubbed(false); }}
                  className="inline-flex items-center text-xs text-gray-600 underline-offset-2 hover:underline sm:ml-auto"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
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
                  <a
                    href={`/jogos/${g.id}`}
                    aria-label={`Ver detalhes de ${g.name}`}
                    className="absolute inset-0 z-20 block"
                  >
                    <span className="sr-only">Ver detalhes de {g.name}</span>
                  </a>
                  <img
                    src={g.cover_url || placeholder}
                    onError={(e) => {
                      const t = e.currentTarget; t.onerror = null; t.src = placeholder;
                    }}
                    alt={g.cover_url ? `Capa: ${g.name}` : 'Sem imagem'}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  {/* Notas: empilhadas no canto superior direito */}
                  <div className="absolute right-3 top-3 flex flex-col items-end gap-2">
                    {g.overall_score != null && g.overall_score !== '' && (
                      (() => {
                        const val = Number(g.overall_score);
                        const percent = isFinite(val) ? (val / 10) * 100 : 0;
                        const color = percent >= 75 ? 'bg-green-500' : percent >= 50 ? 'bg-yellow-400' : 'bg-red-500';
                        const label = `Nota geral: ${val.toFixed(2)} de 10`;
                        return (
                          <span className="inline-flex items-center rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-900 ring-1 ring-inset ring-gray-200 drop-shadow-md" aria-label={label} title={label}>
                            <span className="text-[10px] font-medium text-gray-700">Nota Geral</span>
                            <span className={`ml-1 inline-flex h-5 min-w-6 items-center justify-center rounded ${color} px-1.5 text-white`}>{val.toFixed(2)}</span>
                          </span>
                        );
                      })()
                    )}
                    {((g as any).user_score != null && (g as any).user_score !== '' && Number((g as any).user_score) > 0) && (
                      (() => {
                        const val = Number((g as any).user_score);
                        const percent = isFinite(val) ? (val / 10) * 100 : 0;
                        const color = percent >= 75 ? 'bg-green-500' : percent >= 50 ? 'bg-yellow-400' : 'bg-red-500';
                        const who = subjectName && subjectName.trim() ? subjectName.trim() : 'Usuário';
                        const label = `Nota de ${who}: ${val.toFixed(2)} de 10`;
                        return (
                          <span className="inline-flex items-center rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-900 ring-1 ring-inset ring-gray-200 drop-shadow-md" aria-label={label} title={label}>
                            <span className="text-[10px] font-medium text-gray-700">{who}</span>
                            <span className={`ml-1 inline-flex h-5 min-w-6 items-center justify-center rounded ${color} px-1.5 text-white`}>{val.toFixed(2)}</span>
                          </span>
                        );
                      })()
                    )}
                  </div>
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

function SubtitleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M4 5.75A.75.75 0 014.75 5h14.5a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75H4.75a.75.75 0 01-.75-.75V5.75zM6 9a1 1 0 100 2h6a1 1 0 100-2H6zm0 4a1 1 0 100 2h12a1 1 0 100-2H6z" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2a3 3 0 00-3 3v6a3 3 0 106 0V5a3 3 0 00-3-3zM5.25 11a.75.75 0 01.75.75 6 6 0 0012 0 .75.75 0 011.5 0 7.5 7.5 0 01-6.75 7.47V21a.75.75 0 11-1.5 0v-1.78A7.5 7.5 0 015.25 11.75.75.75 0 015.25 11z" />
    </svg>
  );
}

