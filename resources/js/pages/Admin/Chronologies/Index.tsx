import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/components/layouts/AdminLayout';
import Pagination from '@/components/ui/Pagination';

type ChronologyRow = {
  id: number;
  name: string;
  description?: string | null;
  status: 'avaliacao' | 'liberado';
  created_at: string;
  steps_count: number;
  creator?: { id: number; name: string } | null;
};

type Paginator<T> = {
  data: T[];
  links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
  chronologies: Paginator<ChronologyRow>;
  filters?: { name?: string; status?: '' | 'avaliacao' | 'liberado' };
  flash?: { success?: string; error?: string };
};

export default function AdminChronologiesIndex({ chronologies, filters, flash }: Props) {
  const [name, setName] = React.useState(filters?.name ?? '');
  const [status, setStatus] = React.useState<'' | 'avaliacao' | 'liberado'>(filters?.status ?? '');

  const applyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    router.get('/admin/cronologias', { name, status }, { preserveScroll: true, replace: true });
  };

  const approve = (id: number) => {
    router.put(`/admin/cronologias/${id}/liberar`, {}, { preserveScroll: true });
  };

  return (
    <div>
      <Head title="Cronologias">
        <meta name="description" content="Aprove e acompanhe cronologias criadas pelos usuários." />
      </Head>
      <AdminLayout title="Cronologias">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          <form onSubmit={applyFilters} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-xs">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="w-full sm:max-w-xs">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              <select id="status" value={status} onChange={(e) => setStatus(e.target.value as '' | 'avaliacao' | 'liberado')} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="">Todos</option>
                <option value="avaliacao">Em avaliação</option>
                <option value="liberado">Liberado</option>
              </select>
            </div>
            <button type="submit" className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800">
              Filtrar
            </button>
          </form>
        </div>

        {flash?.success && <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{flash.success}</div>}
        {flash?.error && <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{flash.error}</div>}

        <div className="max-w-full overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-[760px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Cronologia</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Criada por</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Etapas</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-4 py-3 w-48 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {chronologies.data.map((chronology) => (
                <tr key={chronology.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="max-w-xl">
                      <p className="font-medium">{chronology.name}</p>
                      <p className="line-clamp-2 text-xs text-gray-500">{chronology.description || 'Sem descrição'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{chronology.creator?.name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{chronology.steps_count}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span className={`${chronology.status === 'liberado' ? 'bg-green-50 text-green-800 ring-green-200' : 'bg-yellow-50 text-yellow-800 ring-yellow-200'} inline-flex rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset`}>
                      {chronology.status === 'liberado' ? 'Liberada' : 'Em avaliação'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link href={`/opcoes/cronologias/${chronology.id}/editar`} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                        Abrir
                      </Link>
                      {chronology.status === 'avaliacao' && (
                        <button type="button" onClick={() => approve(chronology.id)} className="inline-flex items-center rounded-md bg-green-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-green-600">
                          Aprovar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {chronologies.data.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-600">Nenhuma cronologia encontrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination links={chronologies.links} />
      </AdminLayout>
    </div>
  );
}
