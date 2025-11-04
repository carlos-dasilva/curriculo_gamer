import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Pagination from '@/components/ui/Pagination';
import AdminLayout from '@/components/layouts/AdminLayout';

type Platform = {
  id: number;
  name: string;
  manufacturer?: string | null;
  release_year?: number | null;
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
  platforms: Paginator<Platform>;
  filters?: { name?: string };
  flash?: { success?: string; error?: string };
};

export default function PlatformsIndex({ platforms, filters, flash }: Props) {
  const [name, setName] = React.useState(filters?.name ?? '');
  const [confirmDelete, setConfirmDelete] = React.useState<null | { id: number; name?: string }>(null);
  const [deleting, setDeleting] = React.useState(false);

  const applyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    router.get('/admin/plataformas', { name }, { preserveScroll: true, replace: true });
  };

  const remove = async (id: number) => {
    try {
      setDeleting(true);
      await router.delete(`/admin/plataformas/${id}`, { preserveScroll: true });
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  return (
    <div>
      <Head title="Plataformas" />
      <AdminLayout title="Plataformas">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <form onSubmit={applyFilters} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-xs">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
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
          <table className="min-w-[720px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fabricante</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Lançamento</th>
                <th className="px-4 py-3 w-28 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {platforms.data.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.manufacturer || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{p.release_year || '-'}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/admin/plataformas/${p.id}/editar`}
                        aria-label="Editar"
                        title="Editar"
                        className="inline-flex items-center justify-center rounded-md bg-gray-900 p-2 text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                      >
                        <PencilIcon className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Link>
                      <button
                        onClick={() => setConfirmDelete({ id: p.id, name: p.name })}
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

        <Pagination links={platforms.links} />

        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" aria-hidden="true" onClick={() => (!deleting ? setConfirmDelete(null) : null)} />
            <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-2xl ring-1 ring-gray-200">
              <h4 id="confirm-title" className="text-base font-semibold text-gray-900">Remover plataforma</h4>
              <p className="mt-2 text-sm text-gray-700">Tem certeza que deseja remover {confirmDelete.name ? (<strong>{confirmDelete.name}</strong>) : 'esta plataforma'}?</p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setConfirmDelete(null)} disabled={deleting} className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Cancelar</button>
                <button type="button" onClick={() => remove(confirmDelete.id)} disabled={deleting} className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50">{deleting ? 'Removendo…' : 'Remover'}</button>
              </div>
            </div>
          </div>
        )}
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
