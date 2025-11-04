import React from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/components/layouts/AdminLayout';

type Tag = { id: number; name: string; slug: string; description?: string | null };

type Props = { tag: Tag };

export default function TagsEdit({ tag }: Props) {
  const { data, setData, put, processing, errors } = useForm<Tag>({ ...tag });
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/admin/marcadores/${tag.id}`);
  };

  const remove = async () => {
    try {
      setDeleting(true);
      await router.delete(`/admin/marcadores/${tag.id}`);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div>
      <Head title={`Editar Marcador: ${tag.name}`} />
      <AdminLayout title={`Editar Marcador`}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome *</label>
              <input id="name" required value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug</label>
              <input id="slug" value={data.slug} onChange={(e) => setData('slug', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" />
              {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea id="description" rows={4} value={data.description || ''} onChange={(e) => setData('description', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" />
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
          </div>
          <div className="flex items-center justify-between">
            <Link href="/admin/marcadores" className="text-sm text-gray-600 underline-offset-2 hover:underline">Voltar</Link>
            <div className="space-x-2">
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
              <h4 id="confirm-title" className="text-base font-semibold text-gray-900">Remover marcador</h4>
              <p className="mt-2 text-sm text-gray-700">Tem certeza que deseja remover <strong>{tag.name}</strong>?</p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setConfirmDelete(false)} disabled={deleting} className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Cancelar</button>
                <button type="button" onClick={remove} disabled={deleting} className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50">{deleting ? 'Removendo…' : 'Remover'}</button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </div>
  );
}
