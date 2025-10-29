import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/components/layouts/AdminLayout';

type FormData = {
  name: string;
  website?: string | null;
  country?: string | null;
  founded_year?: number | null;
  description?: string | null;
};

export default function StudiosCreate() {
  const { data, setData, post, processing, errors } = useForm<FormData>({
    name: '',
    website: '',
    country: '',
    founded_year: undefined,
    description: '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/admin/estudios');
  };

  return (
    <div>
      <Head title="Novo Estúdio" />
      <AdminLayout title="Novo Estúdio">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome *</label>
              <input id="name" required value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">Website</label>
              <input id="website" value={data.website || ''} onChange={(e) => setData('website', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
              {errors.website && <p className="mt-1 text-xs text-red-600">{errors.website}</p>}
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">País</label>
              <input id="country" value={data.country || ''} onChange={(e) => setData('country', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
              {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country}</p>}
            </div>
            <div>
              <label htmlFor="founded_year" className="block text-sm font-medium text-gray-700">Fundação (ano)</label>
              <input id="founded_year" type="number" inputMode="numeric" value={data.founded_year ?? ''} onChange={(e) => setData('founded_year', e.target.value ? parseInt(e.target.value, 10) : undefined)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
              {errors.founded_year && <p className="mt-1 text-xs text-red-600">{errors.founded_year}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição</label>
            <textarea id="description" rows={4} value={data.description || ''} onChange={(e) => setData('description', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
          </div>
          <div className="flex items-center justify-between">
            <Link href="/admin/estudios" className="text-sm text-gray-600 underline-offset-2 hover:underline">Voltar</Link>
            <button type="submit" disabled={processing} className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-50">
              Salvar
            </button>
          </div>
        </form>
      </AdminLayout>
    </div>
  );
}
