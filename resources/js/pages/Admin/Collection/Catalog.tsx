import React from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/components/layouts/AdminLayout';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';

type Entry = { id: number; name: string; slug: string; is_active: boolean; sort_order?: number; website_url?: string; logo_url?: string; icon_url?: string; color?: string };
type Props = { catalog: string; catalogs: { key: string; label: string }[]; entries: { data: Entry[]; links: { url: string | null; label: string; active: boolean }[] }; filters: { q?: string }; flash?: { success?: string } };
export default function Catalog({ catalog, catalogs, entries, filters, flash }: Props) {
  const [editing, setEditing] = React.useState<number | null>(null);
  const [search, setSearch] = React.useState(filters.q || '');
  const form = useForm({ name: '', slug: '', is_active: true, sort_order: 0, website_url: '', logo_url: '', icon_url: '', color: '' });
  const base = '/admin/colecao/cadastros/' + catalog;
  const reset = () => { setEditing(null); form.reset(); form.clearErrors(); };
  React.useEffect(reset, [catalog]);
  const edit = (entry: Entry) => {
    setEditing(entry.id); form.clearErrors();
    form.setData({ name: entry.name, slug: entry.slug, is_active: entry.is_active, sort_order: entry.sort_order ?? 0,
      website_url: entry.website_url || '', logo_url: entry.logo_url || '', icon_url: entry.icon_url || '', color: entry.color || '' });
    document.getElementById('catalog-name')?.focus();
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const options = { preserveScroll: true, onSuccess: reset };
    editing ? form.put(base + '/' + editing, options) : form.post(base, options);
  };
  return <AdminLayout title="Cadastros da Coleção">
    <nav className="mb-6 flex flex-wrap gap-2" aria-label="Cadastros da coleção">
      {catalogs.map(c => <Link key={c.key} href={'/admin/colecao/cadastros/' + c.key} className={'rounded-lg px-3 py-2 text-sm ring-1 ring-gray-200 ' + (c.key === catalog ? 'bg-gray-900 text-white' : 'bg-white')} aria-current={c.key === catalog ? 'page' : undefined}>{c.label}</Link>)}
      <Link href="/admin/colecao/plataformas" className="rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-gray-200">Empresas das plataformas</Link>
    </nav>
    {flash?.success && <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-green-800">{flash.success}</p>}
    <h2 className="mb-3 text-xl font-semibold">{catalogs.find(c => c.key === catalog)?.label}</h2>
    <form onSubmit={submit} className="mb-8 space-y-4 rounded-xl border bg-white p-5">
      <h3 className="font-semibold">{editing ? 'Editar cadastro' : 'Novo cadastro'}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input id="catalog-name" label="Nome" required maxLength={150} value={form.data.name} onChange={e => form.setData('name', e.target.value)} error={form.errors.name} />
        <Input id="catalog-slug" label="Identificador (gerado se vazio)" disabled={editing !== null} value={form.data.slug} onChange={e => form.setData('slug', e.target.value)} error={form.errors.slug} />
        {catalog !== 'companies' && <Input label="Ordem" type="number" min={0} value={form.data.sort_order} onChange={e => form.setData('sort_order', Number(e.target.value))} error={form.errors.sort_order} />}
        {['companies', 'digital-stores'].includes(catalog) && <>
          <Input label="Site oficial" type="url" value={form.data.website_url} onChange={e => form.setData('website_url', e.target.value)} error={form.errors.website_url} />
          <Input label="URL do logo" type="url" value={form.data.logo_url} onChange={e => form.setData('logo_url', e.target.value)} error={form.errors.logo_url} />
        </>}
        {catalog === 'digital-stores' && <>
          <Input label="URL do ícone" type="url" value={form.data.icon_url} onChange={e => form.setData('icon_url', e.target.value)} error={form.errors.icon_url} />
          <Input label="Cor (ex.: #111827)" value={form.data.color} onChange={e => form.setData('color', e.target.value)} error={form.errors.color} />
        </>}
      </div>
      <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={form.data.is_active} onChange={e => form.setData('is_active', e.target.checked)} />Ativo para novos itens</label>
      <div className="flex gap-3"><Button disabled={form.processing}>{form.processing ? 'Salvando…' : 'Salvar'}</Button>{editing && <Button type="button" variant="outline" onClick={reset}>Cancelar edição</Button>}</div>
    </form>
    <form onSubmit={e => { e.preventDefault(); router.get(base, { q: search }); }} className="mb-4 flex items-end gap-3">
      <Input label="Pesquisar cadastros" value={search} onChange={e => setSearch(e.target.value)} /><Button>Pesquisar</Button>
    </form>
    <div className="grid gap-3 sm:grid-cols-2">
      {entries.data.map(entry => <article key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-4">
        <div className="min-w-0"><h3 className="break-words font-semibold">{entry.name}</h3><p className="text-sm text-gray-500">{entry.is_active ? 'Ativo' : 'Inativo'}</p></div>
        <Button type="button" variant="outline" onClick={() => edit(entry)}>Editar</Button>
      </article>)}
    </div>
    {!entries.data.length && <p className="py-6 text-gray-500">Nenhum cadastro encontrado.</p>}
    <Pagination links={entries.links} />
  </AdminLayout>;
}
