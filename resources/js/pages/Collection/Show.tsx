import React from 'react';
import { Link, router } from '@inertiajs/react';
import Button from '@/components/ui/Button';
import { CollectionLayout, ExternalImage, ConfirmDialog, Card, Field, ItemData, CollectionImage, Option, base, action, money, visible } from '@/components/collection/shared';

export default function Show({ kind, item, card, fields }: { kind: string; item: Record<string, unknown> & { id: number; images: CollectionImage[]; platforms?: Option[]; console?: { nickname?: string; platform?: Option } }; card: Card; fields: Field[] }) {
  const [confirm, setConfirm] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [photo, setPhoto] = React.useState<CollectionImage | null>(null);
  const dialog = React.useRef<HTMLDialogElement>(null);
  React.useEffect(() => { if (photo) dialog.current?.showModal(); }, [photo]);
  const display = (field: Field): string => {
    const value = item[field.key];
    if (field.type === 'game') return card.title;
    if (field.type === 'platforms') return card.platforms.map(p => p.name).join(', ');
    if (field.type === 'console') return item.console?.nickname || item.console?.platform?.name || 'Não informado';
    if (value === null || value === undefined || value === '') return 'Não informado';
    if (field.type === 'bool') return value ? 'Sim' : 'Não';
    if (field.type === 'money') return money(String(value));
    if (field.type === 'date') return String(value).slice(0, 10).split('-').reverse().join('/');
    if (field.type === 'score') return String(value) + '/10';
    if (field.type === 'media') return value === 'digital' ? 'Digital' : 'Físico';
    if (field.type === 'connection') return ({ wired: 'Com fio', wireless: 'Sem fio', both: 'Com e sem fio', unknown: 'Não informado' } as Record<string, string>)[String(value)];
    return field.options?.find(o => String(o.id) === String(value))?.name ?? String(value);
  };
  const shownFields = fields.filter(f => visible(kind, f, item as unknown as ItemData));
  return <CollectionLayout title={card.title} kind={kind}>
    <div className="mb-6 flex flex-wrap gap-3"><Link href={base + '/' + kind + '/' + item.id + '/editar'} className={action}>Editar item</Link><Button type="button" variant="outline" onClick={() => setConfirm(true)}>Remover da coleção</Button></div>
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <div>
        <div className="flex aspect-square items-center justify-center rounded-2xl border bg-white p-6"><ExternalImage src={card.image} alt={card.title} className="h-full w-full object-contain" /></div>
        {!!item.images.length && <div className="mt-4 grid grid-cols-3 gap-3">{item.images.map((image, i) => <button key={i} type="button" onClick={() => setPhoto(image)} className="aspect-square overflow-hidden rounded-lg border bg-white p-2 focus-visible:outline focus-visible:outline-2" aria-label={'Ampliar foto ' + (i + 1)}><ExternalImage src={image.url} alt={image.description || 'Foto ' + (i + 1)} className="h-full w-full object-contain" /></button>)}</div>}
        <div className="mt-4 flex flex-wrap gap-2">{card.badges.map((badge, i) => <span key={i} className="rounded-full bg-gray-200 px-3 py-1 text-sm">{badge}</span>)}</div>
        <div className="mt-5 flex flex-wrap gap-2">{card.platforms.map(p => <Link key={p.id} href={base + '?platform_id=' + p.id} className="rounded-lg border bg-white px-3 py-2 text-sm underline">{p.name}</Link>)}</div>
      </div>
      <div className="space-y-4">{[...new Set(shownFields.map(f => f.group))].map(group => <section key={group} className="rounded-xl border bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold">{group}</h2>
        <dl className="grid gap-4 sm:grid-cols-2">{shownFields.filter(f => f.group === group).map(field => <div key={field.key} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
          <dt className="text-sm text-gray-500">{field.label}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm font-medium">{display(field)}</dd>
        </div>)}</dl>
      </section>)}</div>
    </div>
    {confirm && <ConfirmDialog title="Remover item da coleção?" busy={busy} onClose={() => setConfirm(false)} onConfirm={() => {
      setBusy(true); router.delete(base + '/' + kind + '/' + item.id, { onFinish: () => { setBusy(false); setConfirm(false); } });
    }}>Você está removendo <strong>{card.title}</strong>{kind === 'acessorios' ? ' (grupo com ' + card.quantity + ' unidade(s))' : ''}.</ConfirmDialog>}
    {photo && <dialog ref={dialog} onClose={() => setPhoto(null)} className="max-h-[90vh] w-[90vw] max-w-4xl rounded-xl p-4 backdrop:bg-black/80">
      <div className="mb-3 flex justify-end"><Button autoFocus type="button" variant="outline" onClick={() => dialog.current?.close()}>Fechar foto</Button></div>
      <ExternalImage src={photo.url} alt={photo.description || 'Foto do item'} className="max-h-[70vh] w-full object-contain" />{photo.description && <p className="mt-3 text-center text-sm">{photo.description}</p>}
    </dialog>}
  </CollectionLayout>;
}
