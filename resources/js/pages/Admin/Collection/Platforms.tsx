import React from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/components/layouts/AdminLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';

type Company = { id: number; name: string };
type Platform = { id: number; name: string; manufacturer: string | null; collection_company_mapping: { company_id: number; company: Company } | null };
export default function Platforms({ platforms, companies, filters, flash }: { platforms: { data: Platform[]; links: { url: string | null; label: string; active: boolean }[] }; companies: Company[]; filters: { q?: string }; flash?: { success?: string } }) {
  const [q, setQ] = React.useState(filters.q || '');
  return <AdminLayout title="Empresas das plataformas">
    <Link href="/admin/colecao" className="underline">Voltar aos cadastros</Link>
    <p className="my-4 text-sm text-gray-600">Associe cada plataforma ao seu ecossistema. O fabricante dos acessórios é informado separadamente.</p>
    {flash?.success && <p role="status" className="my-3 text-green-800">{flash.success}</p>}
    <form className="mb-6 flex items-end gap-3" onSubmit={e => { e.preventDefault(); router.get('/admin/colecao/plataformas', { q }); }}>
      <Input label="Pesquisar plataforma" value={q} onChange={e => setQ(e.target.value)} /><Button>Pesquisar</Button>
    </form>
    <div className="grid gap-4">{platforms.data.map(p => <Mapping key={p.id} platform={p} companies={companies} />)}</div>
    <Pagination links={platforms.links} />
  </AdminLayout>;
}
function Mapping({ platform, companies }: { platform: Platform; companies: Company[] }) {
  const form = useForm({ company_id: String(platform.collection_company_mapping?.company_id || '') });
  const options = [...companies];
  const current = platform.collection_company_mapping?.company;
  if (current && !options.some(c => c.id === current.id)) options.push(current);
  return <form className="grid items-end gap-3 rounded-xl border bg-white p-4 sm:grid-cols-[1fr_1fr_auto]" onSubmit={e => { e.preventDefault(); form.put('/admin/colecao/plataformas/' + platform.id, { preserveScroll: true }); }}>
    <div><h2 className="font-semibold">{platform.name}</h2><p className="text-sm text-gray-500">Fabricante no catálogo: {platform.manufacturer || 'Não informado'}</p></div>
    <div><label htmlFor={'company-' + platform.id} className="block text-sm">Empresa</label>
      <select id={'company-' + platform.id} className="mt-1 min-h-11 w-full rounded-md border border-gray-300 bg-white px-3" value={form.data.company_id} onChange={e => form.setData('company_id', e.target.value)}>
        <option value="">Sem associação</option>{options.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>{form.errors.company_id && <p role="alert" className="text-sm text-red-700">{form.errors.company_id}</p>}
    </div><Button disabled={form.processing}>{form.processing ? 'Salvando…' : 'Salvar'}</Button>
  </form>;
}
