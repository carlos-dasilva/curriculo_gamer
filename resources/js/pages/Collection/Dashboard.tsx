import React from 'react';
import { Link, router } from '@inertiajs/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { CollectionLayout, CollectionCard, Card, base, action, kinds, money } from '@/components/collection/shared';

type Group = { id: number; name: string; total: number };
type Breakdown = { label: string; kind: string; filter: string; rows: { name: string; total: number; value: number | null }[] };
type Props = { filters: Record<string, string | number>; scope: Group | null; totals: Record<string, number | string>; sections: Record<string, Card[]>; companies: Group[]; platforms: Group[]; breakdowns: Breakdown[] };
export default function Dashboard({ filters, scope, totals, sections, companies, platforms, breakdowns }: Props) {
  const [q, setQ] = React.useState(String(filters.q || ''));
  const href = (path: string, extra: Record<string, string | number> = {}) => {
    const params = new URLSearchParams(Object.entries({ ...filters, ...extra }).map(([k, v]) => [k, String(v)]));
    return path + (params.size ? '?' + params.toString() : '');
  };
  const countCards = [{ key: 'consoles', label: 'Consoles' }, { key: 'jogos', label: 'Jogos' }, { key: 'acessorios', label: 'Acessórios' }];
  return <CollectionLayout title={scope?.name || 'Minha Coleção'}>
    {scope && <Link href={base} className="mb-5 inline-block text-sm underline">Ver toda a coleção</Link>}
    <section className="mb-8 rounded-2xl bg-gray-900 p-6 text-white sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="text-sm text-gray-300">Seu inventário gamer</p><p className="mt-2 text-4xl font-bold">{totals.items} <span className="text-xl font-normal text-gray-300">itens</span></p></div>
        <div><p className="text-sm text-gray-300">Total investido</p><p className="mt-2 text-2xl font-semibold">{money(totals.investment)}</p><p className="mt-1 text-xs text-gray-400">{totals.priced_items} item(ns) com valor informado</p></div>
      </div>
      <div className="mt-7 grid grid-cols-3 gap-3">{countCards.map(card => <Link key={card.key} href={href(base + '/' + card.key)} className="rounded-xl bg-white/10 p-3 transition hover:bg-white/20 sm:p-4"><p className="text-2xl font-bold">{totals[card.key]}</p><p className="text-xs text-gray-300 sm:text-sm">{card.label}</p></Link>)}</div>
    </section>
    <div className="mb-8 flex flex-wrap gap-3">{Object.entries(kinds).map(([kind, label]) => <Link key={kind} href={base + '/' + kind + '/novo'} className={action}>＋ {label === 'Consoles' ? 'Console' : label === 'Jogos' ? 'Jogo' : 'Acessório'}</Link>)}</div>
    <form className="mb-8 grid items-end gap-3 sm:grid-cols-[1fr_auto]" onSubmit={e => { e.preventDefault(); router.get(base, { ...filters, q }); }}>
      <Input label="Pesquisar minha coleção" placeholder="Nome do jogo, console ou acessório" value={q} maxLength={150} onChange={e => setQ(e.target.value)} /><Button>Pesquisar</Button>
    </form>
    {!!Number(totals.items) && <section className="mb-8"><h2 className="mb-3 text-xl font-semibold">Meus jogos</h2><div className="flex flex-wrap gap-3">
      {[['physical', 'Físicos', 'media_type', 'physical'], ['digital', 'Digitais', 'media_type', 'digital'], ['cib', 'CIB', 'completeness', 'cib'], ['boxed', 'Com caixa', 'completeness', 'boxed'], ['loose', 'Loose', 'completeness', 'loose']].map(([key, label, filter, value]) => <Link key={key} href={href(base + '/jogos', { [filter]: value })} className="rounded-xl border bg-white px-4 py-3 text-sm"><strong className="mr-2">{totals[key]}</strong>{label}</Link>)}
    </div><p className="mt-2 text-xs text-gray-500">CIB, Com caixa e Loose classificam apenas jogos físicos com componentes informados.</p></section>}
    {!Number(totals.items) && <div className="mb-8 rounded-2xl border border-dashed bg-white p-8 text-center"><h2 className="text-xl font-semibold">{filters.q ? 'Nenhum item encontrado' : 'Sua coleção começa aqui'}</h2><p className="mt-2 text-gray-500">{filters.q ? 'Tente outro nome ou limpe a pesquisa.' : 'Cadastre seu primeiro console, jogo ou acessório e acompanhe tudo em um só lugar.'}</p></div>}
    <div className="mb-10 grid gap-8 lg:grid-cols-2">
      {[{ id: 'empresas', title: 'Por empresa', rows: companies, key: 'company_id' }, { id: 'plataformas', title: 'Por plataforma', rows: platforms, key: 'platform_id' }].map(group => <section id={group.id} key={group.id} className="scroll-mt-24">
        <h2 className="mb-4 text-xl font-semibold">{group.title}</h2><div className="grid gap-3 sm:grid-cols-2">{group.rows.map(row => <Link key={row.id} href={base + '?' + group.key + '=' + row.id} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-4"><span className="font-medium">{row.name}</span><span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-1 text-xs">{row.total} itens</span></Link>)}</div>
        {!group.rows.length && <p className="text-sm text-gray-500">{group.id === 'empresas' ? 'Nenhuma empresa associada às plataformas da sua coleção.' : 'Adicione itens para ver suas plataformas.'}</p>}
      </section>)}
    </div>
    {Object.entries(sections).map(([kind, items]) => <section key={kind} className="mb-10"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">{kinds[kind]}</h2><Link href={href(base + '/' + kind)} className="text-sm underline">Ver todos e filtrar</Link></div>
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3">{items.map(item => <CollectionCard key={item.id} item={item} />)}</div>{!items.length && <p className="text-sm text-gray-500">Nenhum item nesta seção.</p>}
    </section>)}
    <section><h2 className="mb-4 text-xl font-semibold">Estatísticas da coleção</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{breakdowns.filter(b => b.rows.length).map(group => <div key={group.label} className="rounded-xl border bg-white p-5"><h3 className="mb-3 font-semibold">{group.label}</h3><ul className="space-y-2">{group.rows.map((row, i) => <li key={i} className="flex justify-between gap-2 text-sm">{row.value === null ? <span className="text-gray-500">{row.name}</span> : <Link href={href(base + '/' + group.kind, { [group.filter]: row.value })} className="underline">{row.name}</Link>}<strong>{row.total}</strong></li>)}</ul></div>)}</div></section>
  </CollectionLayout>;
}
