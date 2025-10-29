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
    overall_score: game.overall_score ?? '',
    difficulty: game.difficulty ?? '',
    gameplay_hours: game.gameplay_hours ?? '',
    metacritic_metascore: game.metacritic_metascore ?? '',
    metacritic_user_score: game.metacritic_user_score ?? '',
    ptbr_subtitled: !!game.ptbr_subtitled,
    ptbr_dubbed: !!game.ptbr_dubbed,
    age_rating: game.age_rating ?? '',
    description: game.description ?? '',
  });

  const [capturing, setCapturing] = React.useState(false);
  const applyCaptured = (d: any) => {
    if (!d || typeof d !== 'object') return;
    if ('cover_url' in d && !data.cover_url) setData('cover_url', typeof d.cover_url === 'string' ? d.cover_url : '');
    if ('age_rating' in d && !(data as any).age_rating) setData('age_rating', typeof d.age_rating === 'string' ? d.age_rating : '');
    if ('description' in d && !(data as any).description) setData('description', typeof d.description === 'string' ? d.description : '');
    if ('studio_id' in d && !(data as any).studio_id) setData('studio_id', d.studio_id ?? '');
    if ('metacritic_metascore' in d && !(data as any).metacritic_metascore) setData('metacritic_metascore', d.metacritic_metascore ?? '');
    if ('metacritic_user_score' in d && !(data as any).metacritic_user_score) setData('metacritic_user_score', d.metacritic_user_score ?? '');
    if ('tag_ids' in d && Array.isArray(d.tag_ids)) {
      const incoming = d.tag_ids.filter((n: any) => Number.isFinite(n)).map((n: any) => Number(n));
      const merged = Array.from(new Set([...(data.tag_ids || []), ...incoming]));
      setData('tag_ids', merged);
    }
    if ('platform_ids' in d && Array.isArray(d.platform_ids)) {
      const incoming = d.platform_ids.filter((n: any) => Number.isFinite(n)).map((n: any) => Number(n));
      const merged = Array.from(new Set([...(data.platform_ids || []), ...incoming]));
      setData('platform_ids', merged);
    }
    if ('platform_releases' in d && d.platform_releases && typeof d.platform_releases === 'object') {
      const cur = { ...(data.platform_releases || {}) } as Record<number, string>;
      Object.entries(d.platform_releases).forEach(([k, v]: any) => {
        const id = Number(k);
        if (!cur[id] && typeof v === 'string' && v) cur[id] = v;
      });
      setData('platform_releases', cur);
    }
    if ('gallery_urls' in d && Array.isArray(d.gallery_urls)) {
      const incoming = d.gallery_urls.filter((u: any) => typeof u === 'string' && u) as string[];
      const current = (data.gallery_urls || []).filter(Boolean) as string[];
      const merged = Array.from(new Set([...(current.length ? current : []), ...incoming]));
      setData('gallery_urls', merged.length ? merged : ['']);
    }
    if ('external_links' in d && Array.isArray(d.external_links)) {
      const incoming = d.external_links
        .map((l: any) => ({ label: typeof l?.label === 'string' ? l.label : '', url: typeof l?.url === 'string' ? l.url : '' }))
        .filter((l: any) => l.label !== '' || l.url !== '');
      const cur = (data.external_links || []).filter((l: any) => (l.label || '').trim() || (l.url || '').trim());
      const all = [...cur];
      incoming.forEach((i) => { if (!all.some((e: any) => e.label === i.label && e.url === i.url)) all.push(i); });
      setData('external_links', all.length ? all : [{ label: '', url: '' }]);
    }
  };
  const capture = async () => {
    if (!data.name || capturing) return;
    setCapturing(true);
    try {
      // @ts-ignore
      const res = await window.axios.post('/admin/jogos/capturar', { ...data });
      const filled = res?.data?.data;
      if (filled) applyCaptured(filled);
    } catch {}
    finally { setCapturing(false); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const gallery = (data.gallery_urls || []).map((u: string) => (u || '').trim()).filter(Boolean);
    const links = (data.external_links || []).filter((l: any) => (l.label || '').trim() || (l.url || '').trim());
    const platformReleases: Record<number, string> = {};
    (data.platform_ids || []).forEach((id: number) => {
      const v = data.platform_releases?.[id];
      if (v) platformReleases[id] = v;
    });
    put(`/admin/jogos/${game.id}`, { preserveScroll: true, data: { ...data, gallery_urls: gallery, external_links: links, platform_releases: platformReleases, no_enrich: true } });
  };

  // Combos de seleÃ§Ã£o com prevenÃ§Ã£o de duplicatas
  const [selectedTagId, setSelectedTagId] = React.useState<string>('');
  const [selectedPlatformId, setSelectedPlatformId] = React.useState<string>('');

  const addTagById = (id: number) => {
    if (!id || data.tag_ids.includes(id)) return;
    setData('tag_ids', [...data.tag_ids, id]);
    setSelectedTagId('');
  };
  const removeTagById = (id: number) => {
    setData('tag_ids', data.tag_ids.filter((t: number) => t !== id));
  };

  const addPlatformById = (id: number) => {
    if (!id || data.platform_ids.includes(id)) return;
    setData('platform_ids', [...data.platform_ids, id]);
  };
  const removePlatformById = (id: number) => {
    if (!data.platform_ids.includes(id)) return;
    setData('platform_ids', data.platform_ids.filter((p: number) => p !== id));
    const copy = { ...(data.platform_releases || {}) } as Record<number, string>;
    delete copy[id];
    setData('platform_releases', copy);
  };

  // Apenas para compatibilidade com o markup antigo (agora oculto)
  const togglePlatform = (_id: number) => {};

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

        <div className="mb-4 flex justify-end">
          <Link
            href={`/jogos/${game.id}`}
            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            aria-label="Abrir visualizaÃ§Ã£o pÃºblica"
            title="Abrir visualizaÃ§Ã£o pÃºblica"
          >
            <EyeIcon className="h-4 w-4" />
            <span>Visualizar</span>
          </Link>
        </div>

        <form onSubmit={submit} className="space-y-8" aria-label="FormulÃ¡rio de ediÃ§Ã£o de jogo">
          {/* Informações gerais */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Informações gerais</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome do jogo</label>
                <div className="mt-1 flex items-center gap-2">
                  <input id="name" required value={data.name} onChange={(e) => setData('name', e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  <button type="button" onClick={capture} disabled={capturing || !data.name} className="inline-flex items-center whitespace-nowrap rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 shadow-sm hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed" style={{ cursor: (capturing || !data.name) ? "not-allowed" : "pointer" }}>
                    {capturing ? 'Capturando...' : 'Capturar Informações'}
                  </button>
                </div>
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

          {/* Marcadores e Plataformas (alinhado ao layout de solicitaÃ§Ãµes) */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Marcadores e Plataformas</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Coluna de marcadores */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Adicionar marcador</label>
                <div className="mt-1 flex items-center gap-2">
                  <select value={selectedTagId} onChange={(e) => setSelectedTagId(e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500">
                    <option value="">Selecione...</option>
                    {tags.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                  </select>
                  <button type="button" onClick={() => addTagById(Number(selectedTagId))} className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 cursor-pointer">Adicionar</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.tag_ids.map((id: number) => {
                    const t = tags.find((x) => x.id === id);
                    return (
                      <span key={id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800 ring-1 ring-gray-200">
                        {t?.name || id}
                        <button type="button" className="ml-1 text-gray-500 hover:text-gray-800 cursor-pointer" onClick={() => removeTagById(id)} aria-label="Remover"><span aria-hidden="true">×</span></button>
                      </span>
                    );
                  })}
                </div>
                {errors.tag_ids && <p className="mt-1 text-sm text-red-600">{errors.tag_ids}</p>}
              </div>

              {/* Coluna de plataformas */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Adicionar plataforma</label>
                <div className="mt-1 flex items-center gap-2">
                  <select value={selectedPlatformId} onChange={(e) => setSelectedPlatformId(e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500">
                    <option value="">Selecione...</option>
                    {platforms.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                  </select>
                  <button type="button" onClick={() => addPlatformById(Number(selectedPlatformId))} className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 cursor-pointer">Adicionar</button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-1">
                  {data.platform_ids.map((id: number) => {
                    const p = platforms.find((x) => x.id === id);
                    return (
                      <div key={id} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_160px_auto]">
                        <div className="text-sm text-gray-800">{p?.name || id}</div>
                        <input type="date" value={data.platform_releases?.[id] || ''} onChange={(e) => setRelease(id, e.target.value)} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm" />
                        <button type="button" onClick={() => removePlatformById(id)} className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 cursor-pointer">Remover</button>
                      </div>
                    );
                  })}
                </div>
                {errors.platform_ids && <p className="mt-1 text-sm text-red-600">{errors.platform_ids}</p>}
              </div>
            </div>
          </section>

          {/* AvaliaÃ§Ã£o / CaracterÃ­sticas */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Avaliação e características</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <NumberField id="overall_score" label="Nota geral" value={data.overall_score} onChange={(v) => setData('overall_score', v)} min={0} max={10} step={0.01} disabled />
              <NumberField id="difficulty" label="Dificuldade" value={data.difficulty} onChange={(v) => setData('difficulty', v)} min={0} max={10} step={0.01} disabled />
              <NumberField id="gameplay_hours" label="Tempo médio de gameplay (h)" value={data.gameplay_hours} onChange={(v) => setData('gameplay_hours', v)} min={0} step={0.1} disabled />
              <NumberField id="metacritic_metascore" label="Metascore (0–100)" value={data.metacritic_metascore} onChange={(v) => setData('metacritic_metascore', v)} min={0} max={100} step={1} />
              <NumberField id="metacritic_user_score" label="User Score (0.00–10.00)" value={data.metacritic_user_score} onChange={(v) => setData('metacritic_user_score', v)} min={0} max={10} step={0.01} />
            </div>

            <div className="mt-4" role="group" aria-label="Preferências de idioma">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  aria-pressed={!!data.ptbr_subtitled}
                  onClick={() => setData('ptbr_subtitled', !data.ptbr_subtitled)}
                  className={`${data.ptbr_subtitled ? 'bg-gray-900 text-white ring-gray-900' : 'bg-white text-gray-800 ring-gray-300 hover:bg-gray-50'} inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1 ring-inset shadow-sm transition cursor-pointer`}
                >
                  <SubtitleIcon className="h-4 w-4" />
                  <span>Legendado</span>
                </button>
                <button
                  type="button"
                  aria-pressed={!!data.ptbr_dubbed}
                  onClick={() => setData('ptbr_dubbed', !data.ptbr_dubbed)}
                  className={`${data.ptbr_dubbed ? 'bg-gray-900 text-white ring-gray-900' : 'bg-white text-gray-800 ring-gray-300 hover:bg-gray-50'} inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1 ring-inset shadow-sm transition cursor-pointer`}
                >
                  <MicIcon className="h-4 w-4" />
                  <span>Dublado</span>
                </button>
              </div>
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
                  <button type="button" onClick={() => removeGallery(idx)} className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
                    Remover
                  </button>
                </div>
              ))}
              <div>
                <button type="button" onClick={addGallery} className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900">
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
                  <button type="button" onClick={() => removeLink(idx)} className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600">
                    Remover
                  </button>
                </div>
              ))}
              <div>
                <button type="button" onClick={addLink} className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900">
                  Adicionar link
                </button>
              </div>
              {errors.external_links && <p className="text-sm text-red-600">{errors.external_links}</p>}
            </div>
          </section>

          {/* AÃ§Ãµes */}
          <div className="flex items-center gap-3">
            <button type="submit" disabled={processing} className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-60">
              {processing ? 'Salvando…' : 'Salvar alterações'}
            </button>
            <Link href="/admin/jogos" className="text-sm text-gray-700 underline-offset-2 hover:underline">Cancelar</Link>
          </div>
        </form>
      </AdminLayout>
    </div>
  );
}

function NumberField({ id, label, value, onChange, min, max, step = 1, disabled = false }: { id: string; label: string; value?: number | ''; onChange: (v: number | '') => void; min?: number; max?: number; step?: number; disabled?: boolean }) {
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
      <input
        id={id}
        type="number"
        value={value === '' ? '' : String(value)}
        onChange={handle}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        readOnly={disabled}
        className={`mt-1 w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none ${disabled ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500' : 'border-gray-300 bg-white text-gray-900 focus:border-sky-500 focus:ring-2 focus:ring-sky-500'}`}
      />
    </div>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 5c-4.5 0-8.4 2.8-10 7 1.6 4.2 5.5 7 10 7s8.4-2.8 10-7c-1.6-4.2-5.5-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
  );
}

function SubtitleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M4 5.75A.75.75 0 014.75 5h14.5a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75H4.75a.75.75 0 01-.75-.75V5.75zM6 9a1 1 0 100 2h6a1 1 0 100-2H6zm0 4a1 1 0 100 2h12a1 1 0 100-2H6z" />
    </svg>
  );
}

function MicIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2a3 3 0 00-3 3v6a3 3 0 106 0V5a3 3 0 00-3-3zM5.25 11a.75.75 0 01.75.75 6 6 0 0012 0 .75.75 0 011.5 0 7.5 7.5 0 01-6.75 7.47V21a.75.75 0 11-1.5 0v-1.78A7.5 7.5 0 015.25 11.75.75.75 0 015.25 11z" />
    </svg>
  );
}






