import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/components/layouts/AdminLayout';

type GameRow = { id: number; name: string; studio?: { name: string } | null; platforms_count: number; tags_count: number };

type Paginator<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
  games: Paginator<GameRow>;
  filters?: { name?: string; status?: '' | 'avaliacao' | 'liberado' };
  flash?: { success?: string; error?: string };
};

export default function GamesIndex({ games, filters, flash }: Props) {
  const [name, setName] = React.useState(filters?.name ?? '');
  const [status, setStatus] = React.useState<'' | 'avaliacao' | 'liberado'>(filters?.status ?? '');

  const applyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    router.get('/admin/jogos', { name, status }, { preserveScroll: true, replace: true });
  };

  const remove = (id: number) => {
    if (!confirm('Remover este jogo?')) return;
    router.delete(`/admin/jogos/${id}`, { preserveScroll: true });
  };

  return (
    <div>
      <Head title="Jogos" />
      <AdminLayout title="Jogos">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <form onSubmit={applyFilters} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-xs">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="w-full sm:max-w-xs">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as '' | 'avaliacao' | 'liberado')}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Todos</option>
                <option value="avaliacao">Em avaliação</option>
                <option value="liberado">Liberado</option>
              </select>
            </div>
            <div>
              <button type="submit" className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900">
                Filtrar
              </button>
            </div>
          </form>
        </div>

        {flash?.success && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{flash.success}</div>
        )}
        {flash?.error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{flash.error}</div>
        )}

        <div className="max-w-full overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-[720px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estúdio</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Plataformas</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tags</th>
                <th className="px-4 py-3 w-40 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {games.data.map((g) => (
                <tr key={g.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="flex items-center gap-3 min-w-0">
                      {((g as any).cover_url ? (
                        <img
                          src={(g as any).cover_url as string}
                          alt=""
                          className="hidden md:block h-10 w-8 flex-none rounded object-cover"
                          loading="lazy"
                          decoding="async"
                          fetchPriority="low"
                          width={32}
                          height={40}
                        />
                      ) : (
                        <div className="hidden md:block h-10 w-8 flex-none rounded bg-gray-200" aria-hidden="true" />
                      ))}
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{g.name}</span>
                        <span className="text-xs text-gray-500">{((g as any).status === 'liberado') ? 'Liberado' : 'Em avaliação'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{g.studio?.name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{g.platforms_count}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{g.tags_count}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/jogos/${g.id}`}
                        aria-label="Visualizar"
                        title="Visualizar"
                        className="inline-flex items-center justify-center rounded-md bg-white p-2 text-gray-700 ring-1 ring-inset ring-gray-200 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span className="sr-only">Visualizar</span>
                      </Link>
                      <Link
                        href={`/admin/jogos/${g.id}/editar`}
                        aria-label="Editar"
                        title="Editar"
                        className="inline-flex items-center justify-center rounded-md bg-gray-900 p-2 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Link>
                      <button
                        onClick={() => remove(g.id)}
                        aria-label="Remover"
                        title="Remover"
                        className="inline-flex items-center justify-center rounded-md bg-red-600 p-2 text-white shadow-sm hover:bg-red-500 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                        <span className="sr-only">Remover</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <nav className="mt-6 flex justify-center" aria-label="Paginação">
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
                    preserveScroll
                    aria-label={isPrev ? 'Anterior' : isNext ? 'Próxima' : undefined}
                  >
                    {isPrev ? '‹' : isNext ? '›' : label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </AdminLayout>
    </div>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.414 2.586a2 2 0 010 2.828l-1.121 1.121-3.828-3.828 1.121-1.121a2 2 0 012.828 0l.999.999z" />
      <path d="M2.5 12.5l8.243-8.243 3.828 3.828L6.328 16.328a2 2 0 01-.894.506l-3.583.955a.5.5 0 01-.612-.612l.955-3.583a2 2 0 01.506-.894z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M6 2.5A1.5 1.5 0 017.5 1h5A1.5 1.5 0 0114 2.5V3h3a1 1 0 010 2h-1v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5H3a1 1 0 110-2h3v-.5zM6 5v11h8V5H6zm2 2a1 1 0 112 0v7a1 1 0 11-2 0V7zm4 0a1 1 0 112 0v7a1 1 0 11-2 0V7z" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 5c-4.5 0-8.4 2.8-10 7 1.6 4.2 5.5 7 10 7s8.4-2.8 10-7c-1.6-4.2-5.5-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
  );
}
