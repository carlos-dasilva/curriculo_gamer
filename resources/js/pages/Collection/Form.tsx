import React from 'react';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { CollectionLayout, ExternalImage, SearchPicker, base, control, visible, Field, ItemData, Option } from '@/components/collection/shared';

type Props = { kind: string; title: string; fields: Field[]; item: Partial<ItemData>; itemId: number | null; selectedGame: Option | null; selectedConsole: Option | null };
export default function CollectionForm({ kind, title, fields, item, itemId, selectedGame, selectedConsole }: Props) {
  const page = usePage();
  const isAdmin = (page.props.auth as { abilities?: { isAdmin?: boolean } } | undefined)?.abilities?.isAdmin === true;
  const defaults: ItemData = { images: [], platform_ids: [], media_type: 'physical', quantity: 1, connection_type: 'unknown' };
  fields.forEach(f => { if (!(f.key in defaults)) defaults[f.key] = ''; });
  Object.entries(item).forEach(([key, value]) => { if (value !== undefined) defaults[key] = value; });
  const form = useForm<ItemData>(defaults);
  const [game, setGame] = React.useState<Option | null>(selectedGame);
  const [consoleItem, setConsoleItem] = React.useState<Option | null>(selectedConsole);
  const [platformSearch, setPlatformSearch] = React.useState('');
  const errorSummary = React.useRef<HTMLDivElement>(null);
  const errors = form.errors as Record<string, string>;
  const groups = [...new Set(fields.filter(f => visible(kind, f, form.data)).map(f => f.group))];
  const set = (key: string, value: ItemData[string]) => form.setData(key, value);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const options = { onError: () => window.setTimeout(() => { errorSummary.current?.focus(); errorSummary.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 0) };
    itemId ? form.put(base + '/' + kind + '/' + itemId, options) : form.post(base + '/' + kind, options);
  };
  const render = (field: Field) => {
    const { key, label, type } = field;
    const value = form.data[key];
    const error = errors[key];
    const id = 'field-' + key;
    const props = { id, required: field.required, 'aria-invalid': !!error, 'aria-describedby': error ? id + '-error' : undefined };
    if (type === 'game') return <SearchPicker key={key} label={label} source="games" selected={game} error={error} onSelect={option => { setGame(option); set(key, option?.id ?? ''); set('platform_id', ''); }} />;
    if (type === 'console') return <SearchPicker key={key} label={label} source="consoles" selected={consoleItem} error={error} onSelect={option => { setConsoleItem(option); set(key, option?.id ?? ''); }} />;
    let input: React.ReactNode;
    if (type === 'platforms') {
      const chosen = (value || []) as number[];
      input = <div className="space-y-2">
        <Input label="Filtrar plataformas compatíveis" value={platformSearch} onChange={e => setPlatformSearch(e.target.value)} />
        <div className="max-h-56 overflow-y-auto rounded-lg border p-2">{field.options?.filter(o => o.name.toLowerCase().includes(platformSearch.toLowerCase())).map(o => <label key={o.id} className="flex min-h-11 items-center gap-3 px-2"><input type="checkbox" checked={chosen.includes(o.id)} onChange={e => set(key, e.target.checked ? [...chosen, o.id] : chosen.filter(id => id !== o.id))} />{o.name}</label>)}</div>
        <p className="text-xs text-gray-500">{chosen.length} plataforma(s) selecionada(s)</p>
      </div>;
    } else if (['catalog', 'platform', 'bool', 'media', 'connection'].includes(type)) {
      let options: { value: string; label: string }[] = (type === 'platform' && kind === 'jogos' ? game?.platforms ?? [] : field.options ?? []).map(o => ({ value: String(o.id), label: o.name }));
      if (type === 'bool') options = [{ value: '1', label: 'Sim' }, { value: '0', label: 'Não' }];
      if (type === 'media') options = [{ value: 'physical', label: 'Físico' }, { value: 'digital', label: 'Digital' }];
      if (type === 'connection') options = [{ value: 'wired', label: 'Com fio' }, { value: 'wireless', label: 'Sem fio' }, { value: 'both', label: 'Com e sem fio' }, { value: 'unknown', label: 'Não informado' }];
      const selected = typeof value === 'boolean' ? (value ? '1' : '0') : String(value ?? '');
      input = <select {...props} className={control} value={selected} onChange={e => set(key, type === 'bool' ? (e.target.value === '' ? null : e.target.value === '1') : e.target.value)}>
        <option value="">{type === 'bool' ? 'Não informado' : 'Selecione...'}</option>{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>;
    } else if (type === 'textarea') input = <textarea {...props} rows={4} maxLength={10000} className={control} value={String(value ?? '')} onChange={e => set(key, e.target.value)} />;
    else input = <input {...props} className={control} type={['score', 'quantity', 'money'].includes(type) ? 'number' : type === 'date' ? 'date' : 'text'}
      min={type === 'money' ? 0 : ['score', 'quantity'].includes(type) ? 1 : undefined} max={type === 'score' ? 10 : type === 'quantity' ? 1000000 : undefined}
      step={type === 'money' ? '0.01' : ['score', 'quantity'].includes(type) ? '1' : undefined} maxLength={255}
      value={String(value ?? '')} onChange={e => set(key, e.target.value)} />;
    return <div key={key} className={type === 'platforms' || type === 'textarea' ? 'sm:col-span-2' : ''}>
      <label htmlFor={type === 'platforms' ? undefined : id} className="mb-1 block text-sm font-medium">{label}{field.required ? ' *' : ''}</label>{input}
      {error && <p id={id + '-error'} className="mt-1 text-sm text-red-700">{error}</p>}
      {key === 'region_id' && isAdmin && <div className="mt-2 flex flex-wrap gap-3">
        <a href="/admin/colecao/cadastros/regions" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4">Cadastrar região (nova aba)</a>
        <button type="button" onClick={() => router.reload({ only: ['fields'] })} className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4">Atualizar regiões</button>
      </div>}
    </div>;
  };
  const updateImage = (i: number, key: string, value: string | boolean) => form.setData('images', form.data.images.map((image, index) => index === i ? { ...image, [key]: value } : key === 'is_primary' ? { ...image, is_primary: false } : image));
  const moveImage = (i: number, delta: number) => {
    const images = [...form.data.images]; [images[i], images[i + delta]] = [images[i + delta], images[i]]; form.setData('images', images);
  };
  return <CollectionLayout kind={kind} title={(itemId ? 'Editar ' : 'Adicionar ') + title.toLowerCase()}>
    <form onSubmit={submit} noValidate className="mx-auto max-w-4xl space-y-4">
      {Object.keys(errors).length > 0 && <div ref={errorSummary} tabIndex={-1} role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800"><h2 className="font-semibold">Revise os campos abaixo</h2><ul className="mt-2 list-inside list-disc">{Object.entries(errors).map(([key, message]) => <li key={key}>{message}</li>)}</ul></div>}
      <p className="text-sm text-gray-500">Campos com * são obrigatórios. Abra as seções para registrar os detalhes que desejar.</p>
      {groups.map(group => <details key={group} open={group === 'Item' || group === 'Acesso digital' || fields.some(f => f.group === group && errors[f.key])} className="rounded-xl border border-gray-200 bg-white p-5">
        <summary className="cursor-pointer text-base font-semibold">{group}</summary>
        {group === 'Caixa e conteúdo' && kind === 'jogos' && <p className="mt-3 text-sm text-gray-500">CIB considera mídia, caixa e manual. Encartes e extras são registrados separadamente.</p>}
        <div className="mt-5 grid gap-5 sm:grid-cols-2">{fields.filter(f => f.group === group && visible(kind, f, form.data)).map(render)}</div>
      </details>)}
      <details className="rounded-xl border bg-white p-5" open={Object.keys(errors).some(k => k.startsWith('images'))}>
        <summary className="cursor-pointer font-semibold">Fotos externas ({form.data.images.length}/20)</summary>
        <p className="my-4 text-sm text-gray-500">Cole URLs públicas HTTP ou HTTPS. A primeira foto será a principal se você não escolher outra.</p>
        <div className="space-y-5">{form.data.images.map((image, i) => <div key={i} className="rounded-lg border p-4">
          <div className="grid gap-4 sm:grid-cols-[100px_1fr]"><ExternalImage src={image.url} alt={'Prévia da foto ' + (i + 1)} className="h-24 w-24 rounded-lg object-contain" /><div className="space-y-3">
            <Input label={'URL da foto ' + (i + 1)} type="url" value={image.url} maxLength={2048} onChange={e => updateImage(i, 'url', e.target.value)} error={errors['images.' + i + '.url']} />
            <Input label="Descrição da foto" value={image.description || ''} maxLength={255} onChange={e => updateImage(i, 'description', e.target.value)} error={errors['images.' + i + '.description']} />
          </div></div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex min-h-11 items-center gap-2"><input type="radio" name="primary" checked={image.is_primary} onChange={() => updateImage(i, 'is_primary', true)} />Principal</label>
            <Button type="button" variant="outline" disabled={i === 0} onClick={() => moveImage(i, -1)} aria-label={'Mover foto ' + (i + 1) + ' para cima'}>↑</Button>
            <Button type="button" variant="outline" disabled={i === form.data.images.length - 1} onClick={() => moveImage(i, 1)} aria-label={'Mover foto ' + (i + 1) + ' para baixo'}>↓</Button>
            <Button type="button" variant="ghost" onClick={() => form.setData('images', form.data.images.filter((_, index) => index !== i))}>Remover foto</Button>
          </div>
        </div>)}</div>
        <Button type="button" variant="outline" className="mt-4" disabled={form.data.images.length >= 20} onClick={() => form.setData('images', [...form.data.images, { url: '', description: '', is_primary: !form.data.images.length }])}>Adicionar URL de foto</Button>
      </details>
      <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-xl border bg-white/95 p-4 shadow-sm">
        <Link href={base + '/' + kind + (itemId ? '/' + itemId : '')} className="px-3 py-2 text-sm underline">Cancelar</Link>
        <Button disabled={form.processing}>{form.processing ? 'Salvando…' : 'Salvar na coleção'}</Button>
      </div>
    </form>
  </CollectionLayout>;
}
