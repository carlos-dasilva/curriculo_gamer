import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/components/layouts/AdminLayout';

type TagRow = { id: number; name: string; slug: string };

type Paginator<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
  tags: Paginator<TagRow>;
  filters?: { name?: string };
  flash?: { success?: string; error?: string };
};

export default function TagsIndex({ tags, filters, flash }: Props) {
  const [name, setName] = React.useState(filters?.name ?? '');

  const applyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    router.get('/admin/marcadores', { name }, { preserveScroll: true, replace: true });
  };

  const remove = (id: number) => {
    if (!confirm('Remover este marcador?')) return;
    router.delete(`/admin/marcadores/${id}`, { preserveScroll: true });
  };

  return (
    <div>
      <Head title="Marcadores" />
      <AdminLayout title="Marcadores">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <form onSubmit={applyFilters} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-xs">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome ou slug</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" />
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
          <table className="min-w-[640px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Slug</th>
                <th className="px-4 py-3 w-24 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tags.data.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{t.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">#{t.slug}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/admin/marcadores/${t.id}/editar`}
                        aria-label="Editar"
                        title="Editar"
                        className="inline-flex items-center justify-center rounded-md bg-gray-900 p-2 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Link>
                      <button
                        onClick={() => remove(t.id)}
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
            {tags.links.map((l, idx) => {
              const label = l.label.replace('&laquo;', '«').replace('&raquo;', '»');
              const isPrev = idx === 0;
              const isNext = idx === tags.links.length - 1;
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
