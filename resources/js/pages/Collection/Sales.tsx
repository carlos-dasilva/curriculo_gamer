import React from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import { Card, CollectionCard, CollectionLayout, Option, PageLinks, control, kinds, useCollection } from '@/components/collection/shared';

type Filters = Record<string, string | number>;
type Props = { filters: Filters; items: { data: Card[]; total: number; links: PageLinks }; platforms: Option[]; companies: Option[] };

export default function Sales({ filters, items, platforms, companies }: Props) {
  const { base, isOwner, owner } = useCollection();
  const { errors } = usePage().props;
  const [values, setValues] = React.useState<Filters>(filters);
  React.useEffect(() => setValues(filters), [filters]);
  const url = base + '/a-venda';
  const set = (key: string, value: string) => setValues(previous => ({ ...previous, [key]: value }));
  const select = (key: string, label: string, options: { value: string; label: string }[]) => <div>
    <label htmlFor={'sales-' + key} className="mb-1 block text-sm font-medium">{label}</label>
    <select id={'sales-' + key} className={control} value={values[key] ?? ''} onChange={e => set(key, e.target.value)}>
      <option value="">{key === 'sort' ? 'Mais recentes' : 'Todos'}</option>
      {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  </div>;

  return <CollectionLayout title={isOwner ? 'Meus itens à venda' : 'Itens à venda de ' + owner?.name}>
    <p className="mb-5 text-sm text-gray-600">Consoles, jogos e acessórios com valor de venda informado. Selecione um item para ver os detalhes e as fotos.</p>
    <form className="mb-6 space-y-4 rounded-xl border bg-white p-4" onSubmit={e => {
      e.preventDefault(); router.get(url, values, { preserveState: true, replace: true });
    }}>
      {Object.keys(errors).length > 0 && <ul role="alert" className="list-inside list-disc rounded-lg bg-red-50 p-3 text-sm text-red-700">{Object.entries(errors).map(([key, message]) => <li key={key}>{message}</li>)}</ul>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input label="Pesquisar pelo nome" placeholder="Jogo, console ou acessório" value={values.q ?? ''} maxLength={150} onChange={e => set('q', e.target.value)} />
        {select('kind', 'Tipo de item', Object.entries(kinds).map(([value, label]) => ({ value, label })))}
        {select('platform_id', 'Plataforma', platforms.map(p => ({ value: String(p.id), label: p.name })))}
        {select('company_id', 'Empresa / ecossistema', companies.map(p => ({ value: String(p.id), label: p.name })))}
        <Input label="Preço mínimo (R$)" type="number" min={0} step="0.01" value={values.price_min ?? ''} onChange={e => set('price_min', e.target.value)} />
        <Input label="Preço máximo (R$)" type="number" min={0} step="0.01" value={values.price_max ?? ''} onChange={e => set('price_max', e.target.value)} />
        {select('sort', 'Ordenação', [{ value: 'name', label: 'Nome' }, { value: 'price_asc', label: 'Menor preço' }, { value: 'price_desc', label: 'Maior preço' }])}
      </div>
      <div className="flex flex-wrap gap-3"><Button>Aplicar filtros</Button><Link href={url} className="px-3 py-2 text-sm underline">Limpar filtros</Link></div>
    </form>
    <p className="mb-4 text-sm text-gray-500">{items.total} item(ns) à venda</p>
    {items.data.length ? <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.data.map(item => <CollectionCard key={item.kind + '-' + item.id} item={item} />)}
    </div> : <div className="rounded-2xl border border-dashed bg-white px-6 py-12 text-center">
      <h2 className="text-xl font-semibold">Nenhum item à venda encontrado</h2>
      <p className="mt-2 text-gray-500">{isOwner ? 'Preencha o Valor para Venda no cadastro dos itens ou ajuste os filtros.' : 'Não há itens à venda com os filtros selecionados.'}</p>
    </div>}
    <Pagination links={items.links} />
  </CollectionLayout>;
}
