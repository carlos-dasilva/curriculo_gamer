import React from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/components/layouts/AdminLayout';

type Studio = { id: number; name: string };
type Platform = { id: number; name: string };
type Tag = { id: number; name: string; slug: string };
type ExternalLink = { label: string; url: string };

type GameDto = {
  id: number;
  name: string;
  studio_id: number;
  cover_url: string;
  age_rating?: string | null;
  description?: string | null;
  status: 'avaliacao' | 'liberado';
  released_by?: number | null;
  released_by_name?: string | null;
  metacritic_metascore?: number | null;
  metacritic_user_score?: number | null;
  overall_score?: number | null;
  difficulty?: number | null;
  gameplay_hours?: number | null;
  ptbr_subtitled: boolean;
  ptbr_dubbed: boolean;
  tag_ids: number[];
  platform_ids: number[];
  platform_releases: Record<number, string | null>;
  gallery_urls: string[];
  external_links: ExternalLink[];
};

type Props = {
  game: GameDto;
  studios: Studio[];
  platforms: Platform[];
  tags: Tag[];
  flash?: { success?: string; error?: string };
};

export default function GamesEdit({ game, studios, platforms, tags, flash }: Props) {
  const { data, setData, put, processing, errors } = useForm<any>({
    name: game.name,
    studio_id: game.studio_id,
    tag_ids: [...game.tag_ids],
    platform_ids: [...game.platform_ids],
    platform_releases: { ...(game.platform_releases || {}) },
    cover_url: game.cover_url,
    gallery_urls: game.gallery_urls.length ? [...game.gallery_urls] : [''],
    external_links: game.external_links.length ? [...game.external_links] : [{ label: '', url: '' }],
    status: game.status,
    metacritic_metascore: game.metacritic_metascore ?? '',
    metacritic_user_score: game.metacritic_user_score ?? '',
    ptbr_subtitled: !!game.ptbr_subtitled,
    ptbr_dubbed: !!game.ptbr_dubbed,
    overall_score: game.overall_score ?? '',
    difficulty: game.difficulty ?? '',
    gameplay_hours: game.gameplay_hours ?? '',
    age_rating: game.age_rating ?? '',
    description: game.description ?? '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const gallery = (data.gallery_urls || []).map((u: string) => u.trim()).filter(Boolean);
    const links = (data.external_links || []).filter((l: any) => (l.label || '').trim() || (l.url || '').trim());
    const platformReleases: Record<number, string> = {};
    (data.platform_ids || []).forEach((id: number) => {
      const v = data.platform_releases?.[id];
      if (v) platformReleases[id] = v;
    });
    put(`/admin/jogos/${game.id}`, { preserveScroll: true, data: { ...data, gallery_urls: gallery, external_links: links, platform_releases: platformReleases } });
  };

  const toggleTag = (id: number) => {
    setData('tag_ids', data.tag_ids.includes(id) ? data.tag_ids.filter((t: number) => t !== id) : [...data.tag_ids, id]);
  };

  const togglePlatform = (id: number) => {
    const on = data.platform_ids.includes(id);
    const next = on ? data.platform_ids.filter((p: number) => p !== id) : [...data.platform_ids, id];
    setData('platform_ids', next);
    if (on) {
      const copy = { ...data.platform_releases } as Record<number, string>;
      delete copy[id];
      setData('platform_releases', copy);
    }
  };

  const setRelease = (id: number, value: string) => {
    setData('platform_releases', { ...(data.platform_releases || {}), [id]: value });
  };

  const updateGallery = (idx: number, value: string) => {
    const copy = [...(data.gallery_urls || [])];
    copy[idx] = value;
    setData('gallery_urls', copy);
  };
  const addGallery = () => setData('gallery_urls', [...(data.gallery_urls || []), '']);
  const removeGallery = (idx: number) => {
    const copy = [...(data.gallery_urls || [])];
    copy.splice(idx, 1);
    if (copy.length === 0) copy.push('');
    setData('gallery_urls', copy);
  };

  const updateLink = (idx: number, field: keyof ExternalLink, value: string) => {
    const copy = [...(data.external_links || [])];
    copy[idx] = { ...copy[idx], [field]: value } as ExternalLink;
    setData('external_links', copy);
  };
  const addLink = () => setData('external_links', [...(data.external_links || []), { label: '', url: '' }]);
  const removeLink = (idx: number) => {
    const copy = [...(data.external_links || [])];
    copy.splice(idx, 1);
    if (copy.length === 0) copy.push({ label: '', url: '' });
    setData('external_links', copy);
  };

  return (
    <div>
      <Head title={`Editar Jogo: ${game.name}`} />
      <AdminLayout title={`Editar Jogo`}>
        {flash?.error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{flash.error}</div>
        )}
        {flash?.success && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{flash.success}</div>
        )}

        <form onSubmit={submit} className="space-y-8" aria-label="Formulário de edição de jogo">
          {/* Informações gerais */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Informações gerais</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do jogo</label>
                <input id="name" required value={data.name} onChange={(e) => setData('name', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="studio_id" className="block text-sm font-medium text-gray-700">Estúdio de desenvolvimento</label>
                <select id="studio_id" value={data.studio_id ?? ''} onChange={(e) => setData('studio_id', e.target.value ? Number(e.target.value) : '')} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option value="">Selecione…</option>
                  {studios.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {errors.studio_id && <p className="mt-1 text-sm text-red-600">{errors.studio_id}</p>}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label htmlFor="cover_url" className="block text-sm font-medium text-gray-700">Capa (URL)</label>
                <input id="cover_url" placeholder="https://…/capa.jpg" value={data.cover_url} onChange={(e) => setData('cover_url', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                {errors.cover_url && <p className="mt-1 text-sm text-red-600">{errors.cover_url}</p>}
              </div>

              <div>
                <label htmlFor="age_rating" className="block text-sm font-medium text-gray-700">Classificação indicativa</label>
                <input id="age_rating" placeholder="ESRB: T / PEGI: 16 / BR: 12+" value={data.age_rating || ''} onChange={(e) => setData('age_rating', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Descrição / Sinopse</label>
              <textarea id="description" rows={4} value={data.description || ''} onChange={(e) => setData('description', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </section>

          {/* Status */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Status</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                <select id="status" value={data.status || 'avaliacao'} onChange={(e) => setData('status', (e.target.value as 'avaliacao' | 'liberado'))} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500">
                  <option value="avaliacao">Em avaliação</option>
                  <option value="liberado">Liberado</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Ao alterar para "Liberado", o sistema registra automaticamente quem fez a liberação.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Liberado por</label>
                <input disabled value={game.released_by_name || '-'} className="mt-1 w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700" />
                <p className="mt-1 text-xs text-gray-500">Se já estiver liberado, este valor não será alterado ao salvar novamente.</p>
              </div>
            </div>
          </section>

          {/* Marcadores */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Marcadores</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {tags.map((t) => (
                <label key={t.id} className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm text-gray-800 ring-1 ring-inset ring-gray-200">
                  <input type="checkbox" checked={data.tag_ids.includes(t.id)} onChange={() => toggleTag(t.id)} className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                  <span>#{t.slug}</span>
                </label>
              ))}
            </div>
            {errors.tag_ids && <p className="mt-1 text-sm text-red-600">{errors.tag_ids}</p>}
          </section>

          {/* Plataformas + datas */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Plataformas</h2>
            <div className="mt-3 space-y-2">
              {platforms.map((p) => {
                const checked = data.platform_ids.includes(p.id);
                return (
                  <div key={p.id} className="rounded-md border border-gray-200 bg-white p-3">
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" checked={checked} onChange={() => togglePlatform(p.id)} className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                      <span className="text-sm text-gray-800">{p.name}</span>
                    </label>
                    {checked && (
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Data de lançamento nesta plataforma</label>
                          <input type="date" value={data.platform_releases?.[p.id] || ''} onChange={(e) => setRelease(p.id, e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {errors.platform_ids && <p className="mt-1 text-sm text-red-600">{errors.platform_ids}</p>}
          </section>

          {/* Avaliação / Características */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Avaliação e características</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <NumberField id="metacritic_metascore" label="Metascore (0–100)" value={data.metacritic_metascore} onChange={(v) => setData('metacritic_metascore', v)} min={0} max={100} step={1} />
              <NumberField id="metacritic_user_score" label="User Score (0.00–10.00)" value={data.metacritic_user_score} onChange={(v) => setData('metacritic_user_score', v)} min={0} max={10} step={0.01} />
              <NumberField id="overall_score" label="Nota geral (0.00–10.00)" value={data.overall_score} onChange={(v) => setData('overall_score', v)} min={0} max={10} step={0.01} />
              <NumberField id="difficulty" label="Dificuldade (0.00–10.00)" value={data.difficulty} onChange={(v) => setData('difficulty', v)} min={0} max={10} step={0.01} />
              <NumberField id="gameplay_hours" label="Tempo médio de gameplay (h)" value={data.gameplay_hours} onChange={(v) => setData('gameplay_hours', v)} min={0} step={0.1} />
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={data.ptbr_subtitled} onChange={(e) => setData('ptbr_subtitled', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                <span className="text-sm text-gray-800">Legendado em PT-BR</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={data.ptbr_dubbed} onChange={(e) => setData('ptbr_dubbed', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
                <span className="text-sm text-gray-800">Dublado em PT-BR</span>
              </label>
            </div>
          </section>

          {/* Galeria de imagens (URLs) */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Outras imagens (URLs)</h2>
            <div className="mt-3 space-y-3">
              {(data.gallery_urls || []).map((u: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="url"
                    inputMode="url"
                    placeholder="https://…/imagem.jpg"
                    value={u}
                    onChange={(e) => updateGallery(idx, e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button type="button" onClick={() => removeGallery(idx)} className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
                    Remover
                  </button>
                </div>
              ))}
              <div>
                <button type="button" onClick={addGallery} className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900">
                  Adicionar imagem
                </button>
              </div>
              {errors.gallery_urls && <p className="text-sm text-red-600">{errors.gallery_urls}</p>}
            </div>
          </section>

          {/* Links externos */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Links externos</h2>
            <div className="mt-3 space-y-3">
              {(data.external_links || []).map((l: ExternalLink, idx: number) => (
                <div key={idx} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto]">
                  <input
                    placeholder="Nome do link (ex: Detonado)"
                    value={l.label}
                    onChange={(e) => updateLink(idx, 'label', e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <input
                    type="url"
                    inputMode="url"
                    placeholder="https://…"
                    value={l.url}
                    onChange={(e) => updateLink(idx, 'url', e.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button type="button" onClick={() => removeLink(idx)} className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
                    Remover
                  </button>
                </div>
              ))}
              <div>
                <button type="button" onClick={addLink} className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900">
                  Adicionar link
                </button>
              </div>
              {errors.external_links && <p className="text-sm text-red-600">{errors.external_links}</p>}
            </div>
          </section>

          {/* Ações */}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={processing} className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-60">
              {processing ? 'Salvando…' : 'Salvar alterações'}
            </button>
            <Link href="/admin/jogos" className="text-sm text-gray-700 underline-offset-2 hover:underline">Cancelar</Link>
          </div>
        </form>
      </AdminLayout>
    </div>
  );
}

function NumberField({ id, label, value, onChange, min, max, step = 1 }: { id: string; label: string; value?: number | ''; onChange: (v: number | '') => void; min?: number; max?: number; step?: number }) {
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') return onChange('');
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    onChange(n);
  };
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
      <input id={id} type="number" value={value === '' ? '' : String(value)} onChange={handle} min={min} max={max} step={step}
        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
    </div>
  );
}
