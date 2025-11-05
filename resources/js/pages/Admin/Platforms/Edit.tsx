import React from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/components/layouts/AdminLayout';

type Platform = {
  id: number;
  name: string;
  rawg_id?: number | null;
  manufacturer?: string | null;
  release_year?: number | null;
  description?: string | null;
};

type Props = { platform: Platform };

export default function PlatformsEdit({ platform }: Props) {
  const { data, setData, put, processing, errors } = useForm<Platform>({
    ...platform,
  });
  const page = usePage();
  const flash = (page.props as any).flash as { success?: string; error?: string };
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [loadingImport, setLoadingImport] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/admin/plataformas/${platform.id}`);
  };

  const remove = async () => {
    try {
      setDeleting(true);
      await router.delete(`/admin/plataformas/${platform.id}`);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const loadFromRawg = () => {
    if (!platform?.id || !data.rawg_id || loadingImport) return;
    router.post(
      `/admin/plataformas/${platform.id}/carregar-jogos`,
      {},
      {
        preserveScroll: true,
        onStart: () => setLoadingImport(true),
        onFinish: () => setLoadingImport(false),
      }
    );
  };

  return (
    <div>
      <Head title={`Editar Plataforma: ${platform.name}`} />
      <AdminLayout title={`Editar Plataforma`}>
        {flash?.error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{flash.error}</div>
        )}
        {flash?.success && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{flash.success}</div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome *</label>
              <input id="name" required value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="rawg_id" className="block text-sm font-medium text-gray-700">ID RAWG</label>
              <input id="rawg_id" type="number" inputMode="numeric" value={data.rawg_id ?? ''} onChange={(e) => setData('rawg_id', e.target.value ? parseInt(e.target.value, 10) : undefined)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="Ex.: 187" />
              {errors.rawg_id && <p className="mt-1 text-xs text-red-600">{errors.rawg_id}</p>}
            </div>
            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700">Fabricante</label>
              <input id="manufacturer" value={data.manufacturer || ''} onChange={(e) => setData('manufacturer', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" />
              {errors.manufacturer && <p className="mt-1 text-xs text-red-600">{errors.manufacturer}</p>}
            </div>
            <div>
              <label htmlFor="release_year" className="block text-sm font-medium text-gray-700">Lançamento (ano)</label>
              <input id="release_year" type="number" inputMode="numeric" value={data.release_year ?? ''} onChange={(e) => setData('release_year', e.target.value ? parseInt(e.target.value, 10) : undefined)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" />
              {errors.release_year && <p className="mt-1 text-xs text-red-600">{errors.release_year}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea id="description" rows={4} value={data.description || ''} onChange={(e) => setData('description', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" />
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
          </div>
          <div className="flex items-center justify-between">
            <Link href="/admin/plataformas" className="text-sm text-gray-600 underline-offset-2 hover:underline">Voltar</Link>
            <div className="space-x-2">
              <button
                type="button"
                onClick={loadFromRawg}
                disabled={loadingImport || !platform?.id || !data.rawg_id}
                className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                title={!data.rawg_id ? 'Informe o ID RAWG para habilitar' : 'Carregar jogos do RAWG'}
                aria-disabled={loadingImport || !platform?.id || !data.rawg_id}
              >
                {loadingImport ? 'Carregando\u2026' : 'Carregar Jogos (RAWG)'}
              </button>
              <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 cursor-pointer">Remover</button>
              <button type="submit" disabled={processing} className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-50">
                Salvar
              </button>
            </div>
          </div>
        </form>
        {confirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60" aria-hidden="true" onClick={() => (!deleting ? setConfirmDelete(false) : null)} />
            <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-2xl ring-1 ring-gray-200">
              <h4 id="confirm-title" className="text-base font-semibold text-gray-900">Remover plataforma</h4>
              <p className="mt-2 text-sm text-gray-700">Tem certeza que deseja remover <strong>{platform.name}</strong>?</p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setConfirmDelete(false)} disabled={deleting} className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Cancelar</button>
                <button type="button" onClick={remove} disabled={deleting} className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50">{deleting ? 'Removendo…¦' : 'Remover'}</button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </div>
  );
}

