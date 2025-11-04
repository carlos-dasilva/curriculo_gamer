import React from 'react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import OptionsSidebar from '@/components/layouts/OptionsSidebar';

type Studio = { id: number; name: string };
type Platform = { id: number; name: string };
type Tag = { id: number; name: string; slug: string };

type GameDto = {
  id: number;
  name: string;
  studio_id: number | null;
  cover_url: string | null;
  age_rating?: string | null;
  description?: string | null;
  status: 'avaliacao' | 'liberado';
  hours_to_finish?: number | null;
  ptbr_subtitled: boolean;
  ptbr_dubbed: boolean;
  tag_ids: number[];
  platform_ids: number[];
  platform_releases: Record<number, string | null>;
  gallery_urls: string[];
};

type Props = {
  game: GameDto;
  studios: Studio[];
  platforms: Platform[];
  tags: Tag[];
};

export default function SolicitationEdit({ game, studios, platforms, tags }: Props) {
  const page = usePage();
  const auth = (page.props as any).auth;
  const { data, setData, put, processing, errors } = useForm<any>({
    name: game.name,
    studio_id: game.studio_id ?? '',
    tag_ids: [...game.tag_ids],
    platform_ids: [...game.platform_ids],
    platform_releases: { ...(game.platform_releases || {}) },
    cover_url: game.cover_url || '',
    gallery_urls: game.gallery_urls.length ? [...game.gallery_urls] : [''],
    hours_to_finish: (game as any).hours_to_finish ?? '',
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
  };
  const capture = async () => {
    if (!data.name || capturing) return;
    setCapturing(true);
    try {
      // @ts-ignore
      const res = await window.axios.post('/opcoes/solicitacoes/capturar', { ...data });
      const filled = res?.data?.data;
      if (filled) applyCaptured(filled);
    } catch {}
    finally { setCapturing(false); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const gallery = (data.gallery_urls || []).map((u: string) => (u || '').trim()).filter(Boolean);
    const platformReleases: Record<number, string> = {};
    (data.platform_ids || []).forEach((id: number) => {
      const v = data.platform_releases?.[id];
      if (v) platformReleases[id] = v;
    });
    put(`/opcoes/solicitacoes/${game.id}`, {
      data: { ...data, gallery_urls: gallery, platform_releases: platformReleases, no_enrich: true },
      onSuccess: () => {
        router.visit('/opcoes?tab=solicitacoes', { replace: true });
      },
    });
  };

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

  // Links externos removidos do cadastro de solicitaÃ§Ãµes

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Editar Solicitação" />
      <Header auth={auth} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Opções</h1>
          <p className="mt-1 text-sm text-gray-600">Acesse suas opções de conta e ações rápidas.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <OptionsSidebar active="solicitacoes" />
          <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Editar Solicitação</h1>
            <p className="mt-1 text-sm text-gray-600">Atualize os dados da sua Solicitação. Campos de aprovação ficam visíveis apenas para moderadores.</p>
            <div className="mt-2 hidden sm:block">
              <Link href="/opcoes?tab=solicitacoes" className="text-sm text-gray-700 underline-offset-2 hover:underline">Voltar</Link>
            </div>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <Link href={`/jogos/${game.id}`} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 sm:w-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900" aria-label="Abrir visualização pública" title="Abrir visualização pública">
              <EyeIcon className="h-4 w-4" />
              <span>Visualizar</span>
            </Link>

            {(auth?.abilities?.manageUsers) && (
              <button
                type="button"
                onClick={() => {
                  router.put(`/opcoes/solicitacoes/${game.id}/liberar`, undefined, {
                    onSuccess: () => router.visit('/opcoes?tab=solicitacoes', { replace: true }),
                  });
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 sm:w-auto"
              >
                Liberar Jogo
              </button>
            )}
            <Link href="/opcoes?tab=solicitacoes" className="text-center text-sm text-gray-700 underline-offset-2 hover:underline sm:hidden">Voltar</Link>
          </div>
        </div>

        {(errors.name || (page.props as any)?.flash?.error) && (
          <div role="alert" className="mb-4 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-red-800">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 flex-none" aria-hidden="true">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.518 11.586c.75 1.333-.21 2.99-1.742 2.99H3.48c-1.532 0-2.492-1.657-1.742-2.99L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V8a1 1 0 112 0v3a1 1 0 01-1 1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-semibold">Este jogo já existe</p>
              <p className="mt-1 text-sm">Já há um jogo com este nome para o estúdio selecionado. Ajuste o nome ou selecione outro estúdio.</p>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Informações básicas</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Nome</label>
                <div className="mt-1 flex items-center gap-2">
                  <input value={data.name} onChange={(e) => setData('name', e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500" required maxLength={255} />
                  <button type="button" onClick={capture} disabled={capturing || !data.name} className="inline-flex items-center whitespace-nowrap rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 shadow-sm hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed" style={{ cursor: (capturing || !data.name) ? "not-allowed" : "pointer" }}>{capturing ? 'Capturando...' : 'Capturar Informações'}</button>
                </div>
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Estúdio</label>
                <select value={data.studio_id} onChange={(e) => setData('studio_id', e.target.value ? Number(e.target.value) : '')} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500">
                  <option value="">Selecione...</option>
                  {studios.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
                {errors.studio_id && <p className="mt-1 text-sm text-red-600">{errors.studio_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Classificação etária</label>
                <input value={data.age_rating} onChange={(e) => setData('age_rating', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500" maxLength={50} />
                {errors.age_rating && <p className="mt-1 text-sm text-red-600">{errors.age_rating}</p>}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Tempo de Finalização</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Horas para Finalizar</label>
                <input type="number" inputMode="numeric" min={0} step={1} value={(data as any).hours_to_finish === '' ? '' : Number((data as any).hours_to_finish)} onChange={(e) => { const raw = e.target.value; setData('hours_to_finish', raw === '' ? '' : Number(raw)); }} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500" />
                {(errors as any).hours_to_finish && <p className="mt-1 text-sm text-red-600">{(errors as any).hours_to_finish}</p>}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Capa</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-[1fr_200px]">
              <div>
                <label className="block text-sm font-medium text-gray-700">URL da capa</label>
                <input type="url" inputMode="url" value={data.cover_url} onChange={(e) => setData('cover_url', e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500" />
                {errors.cover_url && <p className="mt-1 text-sm text-red-600">{errors.cover_url}</p>}
              </div>
              <div className="flex items-center justify-center">
                {data.cover_url ? (
                  <img
                    src={data.cover_url}
                    alt="Prévia da capa"
                    className="h-40 w-32 rounded object-cover ring-1 ring-gray-200"
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    width={128}
                    height={160}
                  />
                ) : (
                  <div className="h-40 w-32 rounded bg-gray-100 ring-1 ring-gray-200" aria-hidden="true" />
                )}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Descrição</h2>
            <textarea value={data.description} onChange={(e) => setData('description', e.target.value)} rows={6} className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500" />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Marcadores e Plataformas</h2>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Adicionar marcador</label>
                <div className="mt-1 flex items-center gap-2">
                  <select value={selectedTagId} onChange={(e) => setSelectedTagId(e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500">
                    <option value="">Selecione...</option>
                    {tags.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                  </select>
                  <button type="button" onClick={() => addTagById(Number(selectedTagId))} className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800">Adicionar</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {data.tag_ids.map((id: number) => {
                    const t = tags.find((x) => x.id === id);
                    return (
                      <span key={id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800 ring-1 ring-gray-200">
                        {t?.name || id}
                        <button type="button" className="ml-1 text-gray-500 hover:text-gray-800" onClick={() => removeTagById(id)} aria-label="Remover"><span aria-hidden="true">×</span></button>
                      </span>
                    );
                  })}
                </div>
                {errors.tag_ids && <p className="mt-1 text-sm text-red-600">{errors.tag_ids}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Adicionar plataforma</label>
                <div className="mt-1 flex items-center gap-2">
                  <select value={selectedPlatformId} onChange={(e) => setSelectedPlatformId(e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-500">
                    <option value="">Selecione...</option>
                    {platforms.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                  </select>
                  <button type="button" onClick={() => addPlatformById(Number(selectedPlatformId))} className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800">Adicionar</button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-1">
                  {data.platform_ids.map((id: number) => {
                    const p = platforms.find((x) => x.id === id);
                    return (
                      <div key={id} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_160px_auto]">
                        <div className="text-sm text-gray-800">{p?.name || id}</div>
                        <input type="date" value={data.platform_releases?.[id] || ''} onChange={(e) => setRelease(id, e.target.value)} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm" />
                        <button type="button" onClick={() => removePlatformById(id)} className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500">Remover</button>
                      </div>
                    );
                  })}
                </div>
                {errors.platform_ids && <p className="mt-1 text-sm text-red-600">{errors.platform_ids}</p>}
                {errors.platform_releases && <p className="mt-1 text-sm text-red-600">{errors.platform_releases}</p>}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Preferências de idioma</h2>
            <div className="mt-2" role="group" aria-label="Preferências de idioma">
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

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Outras imagens (URLs)</h2>
            <div className="mt-3 space-y-3">
              {(data.gallery_urls || []).map((u: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="url" inputMode="url" placeholder="https://…/imagem.jpg" value={u} onChange={(e) => updateGallery(idx, e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  <button type="button" onClick={() => removeGallery(idx)} className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 cursor-pointer">Remover</button>
                </div>
              ))}
              <div>
                <button type="button" onClick={addGallery} className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 cursor-pointer">Adicionar imagem</button>
              </div>
              {errors.gallery_urls && <p className="text-sm text-red-600">{errors.gallery_urls}</p>}
            </div>
          </section>

          {/* Seção de links externos removida em solicitações */}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={processing} className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60">{processing ? 'Salvando…' : 'Salvar alterações'}</button>
            <Link href="/opcoes" className="text-sm text-gray-700 underline-offset-2 hover:underline">Cancelar</Link>
          </div>
        </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
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

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 5c-4.5 0-8.4 2.8-10 7 1.6 4.2 5.5 7 10 7s8.4-2.8 10-7c-1.6-4.2-5.5-7-10-7zm0 12a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6z" />
    </svg>
  );
}




