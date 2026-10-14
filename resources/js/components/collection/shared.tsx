import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import AppLayout from '@/components/layouts/AppLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export type Option = { id: number; name: string; platforms?: Option[] };
export type Field = { key: string; label: string; type: string; group: string; required: boolean; catalog?: string; options?: Option[] };
export type CollectionImage = { url: string; description: string | null; is_primary: boolean };
export type ItemData = { [key: string]: string | number | boolean | null | number[] | CollectionImage[]; images: CollectionImage[]; platform_ids: number[] };
export type Card = { id: number; kind: string; title: string; quantity: number; platforms: Option[]; image: string | null; badges: string[]; purchase_price?: string | null; sale_price: string | null };
export type PageLinks = { url: string | null; label: string; active: boolean }[];
export const kinds: Record<string, string> = { consoles: 'Consoles', jogos: 'Jogos', acessorios: 'Acessórios' };
export const base = '/minha-colecao';
export function useCollection() {
  const { props } = usePage();
  return {
    base: (props.collectionBase as string | undefined) || base,
    isOwner: props.isOwner !== false,
    owner: props.collectionOwner as { id: number; name: string } | undefined,
    shareUrl: props.shareUrl as string | undefined,
  };
}

export const control = 'min-h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900';
export const action = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2';
export const physical = ['region_id', 'originality_id', 'overall_condition', 'media_condition', 'box_condition', 'manual_condition', 'inserts_condition', 'has_media', 'has_box', 'has_manual', 'has_inserts', 'has_extras'];
export const digital = ['digital_store_id', 'acquisition_type_id', 'digital_service_id', 'digital_ownership_type_id'];
export function visible(kind: string, field: Field, data: ItemData): boolean {
  if (kind === 'jogos') {
    if (physical.includes(field.key) && data.media_type === 'digital') return false;
    if (digital.includes(field.key) && data.media_type !== 'digital') return false;
  }
  if (['box_is_original', 'box_serial_matches', 'box_condition'].includes(field.key) && ![true, 1, '1'].includes(data.has_box as string | number | boolean)) return false;
  return true;
}
export function money(value: string | number | null): string {
  return value === null ? 'Não informado' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value));
}
export function CollectionLayout({ title, children, kind }: { title: string; children: React.ReactNode; kind?: string }) {
  const page = usePage();
  const { base, isOwner, owner, shareUrl } = useCollection();
  const salesPage = page.props.salesPage === true;
  const shareLabel = salesPage ? 'Compartilhar itens à venda' : 'Compartilhar coleção';
  const [sharing, setSharing] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const shareDialog = React.useRef<HTMLDialogElement>(null);
  React.useEffect(() => { if (sharing) shareDialog.current?.showModal(); }, [sharing]);
  const isAdmin = (page.props.auth as { abilities?: { isAdmin?: boolean } } | undefined)?.abilities?.isAdmin === true;
  const flash = page.props.flash as { success?: string; error?: string } | undefined;
  return <AppLayout title={title} noIndex>
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <nav aria-label="Caminho" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <Link href={base} className="underline underline-offset-4">{isOwner ? 'Minha Coleção' : 'Coleção de ' + owner?.name}</Link>
        {kind && <><span aria-hidden="true">/</span><Link href={base + '/' + kind} className="underline underline-offset-4">{kinds[kind]}</Link></>}
      </nav>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>{isOwner && shareUrl ? <Button type="button" onClick={() => setSharing(true)}>{shareLabel}</Button> : <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-medium">{isOwner ? 'Minha coleção' : 'Coleção compartilhada'}</span>}</div>
      <nav aria-label="Coleção" className="mb-8 flex flex-wrap gap-2">
        <Link href={base} className="rounded-lg border bg-white px-4 py-3 text-sm">Resumo</Link>
        {Object.entries(kinds).map(([key, label]) => <Link key={key} href={base + '/' + key} aria-current={key === kind ? 'page' : undefined} className={'rounded-lg border px-4 py-3 text-sm ' + (key === kind ? 'bg-gray-900 text-white' : 'bg-white')}>{label}</Link>)}
        <Link href={base + '/a-venda'} aria-current={salesPage ? 'page' : undefined} className={'rounded-lg border px-4 py-3 text-sm ' + (salesPage ? 'bg-gray-900 text-white' : 'bg-white')}>{isOwner ? 'Meus itens à venda' : 'Itens à venda'}</Link>
        <Link href={base + '#empresas'} className="rounded-lg border bg-white px-4 py-3 text-sm">Por empresa</Link>
        <Link href={base + '#plataformas'} className="rounded-lg border bg-white px-4 py-3 text-sm">Por plataforma</Link>
        {isAdmin && isOwner && <>
          <Link href="/admin/colecao" className="rounded-lg border bg-white px-4 py-3 text-sm">Cadastros da coleção</Link>
          <Link href="/admin/colecao/cadastros/regions" className="rounded-lg border bg-white px-4 py-3 text-sm">Regiões</Link>
        </>}
      </nav>
      {flash?.success && <p role="status" className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">{flash.success}</p>}
      {flash?.error && <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">{flash.error}</p>}
      {children}
      {sharing && shareUrl && <dialog ref={shareDialog} onClose={() => { setSharing(false); setMessage(''); }} aria-labelledby="share-collection-title" className="w-[calc(100%_-_2rem)] max-w-lg rounded-2xl p-6 backdrop:bg-black/60">
        <h2 id="share-collection-title" className="text-xl font-semibold">{shareLabel}</h2>
        <p className="my-3 text-sm text-gray-600">{salesPage ? 'Compartilhe a lista dos seus itens com valor de venda informado.' : 'Qualquer pessoa com o link pode visualizar sua coleção.'} Valores de compra e números de série ficam visíveis somente para você.</p>
        <Input label={salesPage ? 'Link dos itens à venda' : 'Link da coleção'} readOnly value={shareUrl} onFocus={e => e.target.select()} />
        <p role="status" className="my-3 text-sm">{message}</p>
        <div className="flex flex-wrap gap-3"><Button type="button" onClick={async () => {
          try { await navigator.clipboard.writeText(shareUrl); setMessage('Link copiado!'); }
          catch { setMessage('Selecione o link acima e copie manualmente.'); }
        }}>Copiar link</Button><a className={action} href={'https://wa.me/?text=' + encodeURIComponent((salesPage ? 'Meus itens à venda: ' : 'Minha coleção gamer: ') + shareUrl)} target="_blank" rel="noopener noreferrer">WhatsApp</a><Button type="button" variant="outline" onClick={() => shareDialog.current?.close()}>Fechar</Button></div>
      </dialog>}
    </main>
  </AppLayout>;
}
export function ExternalImage({ src, alt, className = '' }: { src?: string | null; alt: string; className?: string }) {
  const safe = src && /^https?:\/\//i.test(src) ? src : '/img/sem-imagem.svg';
  return <img src={safe} alt={alt} loading="lazy" decoding="async" referrerPolicy="no-referrer" className={className} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/sem-imagem.svg'; }} />;
}
export function CollectionCard({ item }: { item: Card }) {
  const { base } = useCollection();
  return <article className="group min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <Link href={base + '/' + item.kind + '/' + item.id} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-900">
      <div className="relative flex aspect-[4/3] items-center justify-center bg-gray-100 p-4">
        <ExternalImage src={item.image} alt="" className="h-full w-full object-contain transition duration-200 group-hover:scale-[1.03]" />
        {item.kind === 'acessorios' && <span className="absolute right-3 top-3 rounded-full bg-gray-900 px-3 py-1 text-sm font-bold text-white">×{item.quantity}</span>}
      </div>
      <div className="space-y-3 p-4"><h3 className="line-clamp-2 text-base font-semibold">{item.title}</h3>
        <p className="text-sm font-semibold">{item.sale_price == null ? 'Não está a venda' : 'Valor para Venda: ' + money(item.sale_price)}</p>
        <p className="line-clamp-2 text-sm text-gray-500">{item.platforms.map(p => p.name).join(' · ')}</p>
        <div className="flex flex-wrap gap-1.5">{item.badges.map((badge, i) => <span key={i} className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">{badge}</span>)}</div>
      </div>
    </Link>
  </article>;
}
export function SearchPicker({ source, label, selected, onSelect, error }: { source: 'games' | 'consoles'; label: string; selected: Option | null; onSelect: (option: Option | null) => void; error?: string }) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Option[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [failure, setFailure] = React.useState('');
  React.useEffect(() => {
    if (selected) return;
    const abort = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true); setFailure('');
      try {
        const response = await fetch(base + '/buscar/' + source + '?q=' + encodeURIComponent(query), { signal: abort.signal, headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error('Não foi possível pesquisar. Tente novamente.');
        setResults(await response.json());
      } catch (error) { if (!abort.signal.aborted) setFailure(error instanceof Error ? error.message : 'Erro na pesquisa.'); }
      finally { if (!abort.signal.aborted) setLoading(false); }
    }, 250);
    return () => { window.clearTimeout(timer); abort.abort(); };
  }, [query, selected, source]);
  return <div className="sm:col-span-2">
    {selected ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-100 p-3"><div><p className="text-xs text-gray-500">{label}</p><p className="font-semibold">{selected.name}</p></div><Button type="button" variant="outline" onClick={() => onSelect(null)}>Trocar</Button></div> : <>
      <Input label={'Pesquisar ' + label.toLowerCase()} value={query} maxLength={150} onChange={e => setQuery(e.target.value)} placeholder="Digite o nome..." />
      <p role="status" className="my-2 text-sm text-gray-500">{loading ? 'Pesquisando…' : failure || (results.length ? 'Selecione um resultado (até 20 por pesquisa).' : 'Nenhum resultado encontrado.')}</p>
      <ul className="max-h-52 overflow-y-auto rounded-lg border">{results.map(result => <li key={result.id}><button type="button" className="min-h-11 w-full border-b p-3 text-left text-sm hover:bg-gray-100 focus:bg-gray-100" onClick={() => onSelect(result)}>{result.name}</button></li>)}</ul>
    </>}
    {error && <p role="alert" className="mt-1 text-sm text-red-700">{error}</p>}
  </div>;
}
export function ConfirmDialog({ title, children, busy, onClose, onConfirm }: { title: string; children: React.ReactNode; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const id = React.useId();
  React.useEffect(() => { const el = ref.current; el?.showModal(); return () => el?.close(); }, []);
  return <dialog ref={ref} aria-labelledby={id} onCancel={e => { e.preventDefault(); if (!busy) onClose(); }} className="w-[calc(100%_-_2rem)] max-w-md rounded-2xl p-6 shadow-xl backdrop:bg-black/60">
    <h2 id={id} className="text-lg font-bold">{title}</h2><div className="my-4 text-sm text-gray-600">{children}</div>
    <div className="flex justify-end gap-3"><Button autoFocus type="button" variant="outline" disabled={busy} onClick={onClose}>Cancelar</Button><Button type="button" className="bg-red-700 hover:bg-red-800" disabled={busy} onClick={onConfirm}>{busy ? 'Removendo…' : 'Remover'}</Button></div>
  </dialog>;
}
