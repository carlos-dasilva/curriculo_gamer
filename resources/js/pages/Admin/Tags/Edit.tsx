import React from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/components/layouts/AdminLayout';

type Tag = { id: number; name: string; slug: string; description?: string | null };

type Props = { tag: Tag };

export default function TagsEdit({ tag }: Props) {
  const { data, setData, put, processing, errors } = useForm<Tag>({ ...tag });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/admin/marcadores/${tag.id}`);
  };

  const remove = () => {
    if (!confirm('Remover este marcador?')) return;
    router.delete(`/admin/marcadores/${tag.id}`);
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
              <button type="button" onClick={remove} className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 cursor-pointer">Remover</button>
              <button type="submit" disabled={processing} className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-50">
                Salvar
              </button>
            </div>
          </div>
        </form>
      </AdminLayout>
    </div>
  );
}
