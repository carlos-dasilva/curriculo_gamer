import React from 'react';
import { Link, router } from '@inertiajs/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import { CollectionLayout, CollectionCard, Field, Card, PageLinks, base, action, control } from '@/components/collection/shared';

type Filters = Record<string, string | number>;
export default function Index({ kind, title, items, filters, fields, companies }: { kind: string; title: string; items: { data: Card[]; total: number; links: PageLinks }; filters: Filters; fields: Field[]; companies: { id: number; name: string }[] }) {
  const [values, setValues] = React.useState<Filters>(filters);
  React.useEffect(() => setValues(filters), [filters]);
  const set = (key: string, value: string) => setValues(v => ({ ...v, [key]: value }));
  const submit = (e: React.FormEvent) => { e.preventDefault(); router.get(base + '/' + kind, values, { preserveState: true, replace: true }); };
  const select = (key: string, label: string, options: { value: string; label: string }[]) => <div key={key}><label htmlFor={'filter-' + key} className="mb-1 block text-sm font-medium">{label}</label><select id={'filter-' + key} className={control} value={values[key] ?? ''} onChange={e => set(key, e.target.value)}><option value="">Todos</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>;
  const filterFields = fields.filter(f => ['catalog', 'bool', 'media', 'connection', 'score', 'platform'].includes(f.type));
  return <CollectionLayout title={title} kind={kind}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-gray-500">{items.total} registro(s) encontrado(s){kind === 'acessorios' ? ' · cada registro pode reunir várias unidades' : ''}</p><Link href={base + '/' + kind + '/novo'} className={action}>＋ Adicionar {kind === 'consoles' ? 'console' : kind === 'jogos' ? 'jogo' : 'acessório'}</Link></div>
    <form onSubmit={submit} className="mb-6 space-y-4 rounded-xl border bg-white p-4">
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_220px_auto]">
        <Input label="Pesquisar pelo nome" value={values.q ?? ''} maxLength={150} onChange={e => set('q', e.target.value)} placeholder="Pesquisar minha coleção..." />
        {select('sort', 'Ordenação', [{ value: 'newest', label: 'Mais recente' }, { value: 'oldest', label: 'Mais antigo' }, { value: 'name', label: 'Nome' }, { value: 'best', label: 'Melhor estado' }, { value: 'worst', label: 'Pior estado' }, { value: 'price', label: 'Maior valor pago' }, { value: 'company', label: 'Empresa' }, { value: 'platform', label: 'Plataforma' }, ...(kind === 'acessorios' ? [{ value: 'quantity', label: 'Maior quantidade' }] : [])])}
        <Button>Pesquisar</Button>
      </div>
      <details open={Object.keys(filters).some(k => !['q', 'sort'].includes(k))}><summary className="cursor-pointer py-2 text-sm font-semibold">Filtros combinados</summary>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {select('company_id', 'Empresa / ecossistema', companies.map(o => ({ value: String(o.id), label: o.name })))}
          {kind === 'acessorios' && select('platform_id', 'Plataforma compatível', (fields.find(f => f.key === 'platform_ids')?.options || []).map(o => ({ value: String(o.id), label: o.name })))}
          {filterFields.map(f => {
            let options = (f.options || []).map(o => ({ value: String(o.id), label: o.name }));
            if (f.type === 'bool') options = [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }];
            if (f.type === 'score') options = Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) + '/10' }));
            if (f.type === 'media') options = [{ value: 'physical', label: 'Físico' }, { value: 'digital', label: 'Digital' }];
            if (f.type === 'connection') options = [{ value: 'wired', label: 'Com fio' }, { value: 'wireless', label: 'Sem fio' }, { value: 'both', label: 'Com e sem fio' }, { value: 'unknown', label: 'Não informado' }];
            return select(f.key, f.label, options);
          })}
          {kind === 'jogos' && select('completeness', 'Completude', [{ value: 'cib', label: 'CIB' }, { value: 'boxed', label: 'Com caixa' }, { value: 'loose', label: 'Loose' }])}
          <Input label="Estado mínimo" type="number" min={1} max={10} value={values.condition_min ?? ''} onChange={e => set('condition_min', e.target.value)} />
          <Input label="Estado máximo" type="number" min={1} max={10} value={values.condition_max ?? ''} onChange={e => set('condition_max', e.target.value)} />
          <Input label="Aquisição a partir de" type="date" value={values.acquired_from ?? ''} onChange={e => set('acquired_from', e.target.value)} />
          <Input label="Aquisição até" type="date" value={values.acquired_to ?? ''} onChange={e => set('acquired_to', e.target.value)} />
        </div><div className="mt-4 flex gap-3"><Button>Aplicar filtros</Button><Link href={base + '/' + kind} className="px-3 py-2 text-sm underline">Limpar</Link></div>
      </details>
    </form>
    {items.data.length ? <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.data.map(item => <CollectionCard key={item.id} item={item} />)}</div>
      : <div className="rounded-2xl border border-dashed bg-white px-6 py-14 text-center"><h2 className="text-xl font-semibold">Nenhum item encontrado</h2><p className="mt-2 text-gray-500">Adicione seu primeiro item ou ajuste os filtros da pesquisa.</p><Link href={base + '/' + kind + '/novo'} className={action + ' mt-5'}>Adicionar à coleção</Link></div>}
    <Pagination links={items.links} />
  </CollectionLayout>;
}
