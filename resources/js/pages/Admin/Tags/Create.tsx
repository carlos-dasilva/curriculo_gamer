import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/components/layouts/AdminLayout';

type FormData = {
  name: string;
  slug?: string | null;
  description?: string | null;
};

export default function TagsCreate() {
  const { data, setData, post, processing, errors } = useForm<FormData>({
    name: '',
    slug: '',
    description: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/admin/marcadores');
  };

  const generateSlug = () => {
    const s = (data.name || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
    setData('slug', s);
  };

  return (
    <div>
      <Head title="Novo Marcador" />
      <AdminLayout title="Novo Marcador">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome *</label>
              <input id="name" required value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label htmlFor="slug" className="block text-sm font-medium text-gray-700">Slug (opcional)</label>
                  <input id="slug" value={data.slug || ''} onChange={(e) => setData('slug', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900" />
                </div>
                <button type="button" onClick={generateSlug} className="inline-flex items-center rounded-md bg-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 cursor-pointer">Gerar</button>
              </div>
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
            <button type="submit" disabled={processing} className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-50">
              Salvar
            </button>
          </div>
        </form>
      </AdminLayout>
    </div>
  );
}
