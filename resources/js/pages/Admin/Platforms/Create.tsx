import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/components/layouts/AdminLayout';

type FormData = {
  name: string;
  rawg_id?: number | null;
  manufacturer?: string | null;
  release_year?: number | null;
  description?: string | null;
};

export default function PlatformsCreate() {
  const { data, setData, post, processing, errors } = useForm<FormData>({
    name: '',
    rawg_id: undefined,
    manufacturer: '',
    release_year: undefined,
    description: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/admin/plataformas');
  };

  return (
    <div>
      <Head title="Nova Plataforma" />
      <AdminLayout title="Nova Plataforma">
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
            <button type="submit" disabled={processing} className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-50">
              Salvar
            </button>
          </div>
        </form>
      </AdminLayout>
    </div>
  );
}
