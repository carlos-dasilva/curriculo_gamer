import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

type FollowingRow = { id: number; name: string; counts: { cem_por_cento: number; finalizei: number; joguei: number; quero_jogar: number } };

export default function OptionsIndex() {
  const page = usePage();
  const auth = (page.props as any).auth;
  const user = (page.props as any).user as { name: string; email: string };
  const authProvider = (page.props as any).authProvider as string;
  const meSummary = (page.props as any).meSummary as FollowingRow | undefined;
  const followingSummary = (page.props as any).followingSummary as FollowingRow[] | undefined;
  const solicitations = (page.props as any).solicitations as any[] | undefined;
  const abilities = (page.props as any).abilities as { canModerate: boolean } | undefined;
  const [active, setActive] = React.useState<'perfil' | 'seguindo' | 'solicitacoes'>('perfil');
  React.useEffect(() => {
    try {
      const w = window as any;
      const url = new URL(w.location?.href ?? '', w.location?.origin ?? undefined);
      const tab = (url.searchParams.get('tab') || (w.location?.hash || '').replace('#','')).toLowerCase();
      if (tab === 'solicitacoes' || tab === 'seguindo' || tab === 'perfil') {
        setActive(tab as any);
      }
    } catch (_) { /* ignore */ }
  }, []);
  const { data, setData, put, processing, errors, recentlySuccessful } = useForm({ name: user?.name || '' });
  const [confirmDelete, setConfirmDelete] = React.useState<null | { id: number; name?: string }>(null);
  const [deleting, setDeleting] = React.useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // MantÃ©m a navegaÃ§Ã£o em /opcoes apÃ³s salvar
    put('/perfil', { preserveScroll: true, preserveState: true, replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Opções">
        <meta name="description" content="Gerencie seu perfil, conexões e solicitações. Atualize nome e preferências, veja quem você segue e acompanhe o status de solicitações." />
      </Head>
      <Header auth={auth} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">OpÃ§Ãµes</h1>
          <p className="mt-1 text-sm text-gray-600">Acesse suas opÃ§Ãµes de conta e aÃ§Ãµes rÃ¡pidas.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar esquerda */}
          <aside className="lg:sticky lg:top-20 self-start">
            <nav aria-label="OpÃ§Ãµes do usuÃ¡rio">
              <ul className="space-y-1">
                <li>
                  <button
                    type="button"
                    onClick={() => setActive('perfil')}
                    aria-current={active === 'perfil' ? 'true' : undefined}
                    className={`${active === 'perfil' ? 'bg-brand-600 text-white' : 'bg-white text-gray-800 hover:bg-gray-50'} flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium ring-1 ring-inset ring-gray-200 cursor-pointer`}
                  >
                    <UserIcon className="h-4 w-4" />
                    <span>Perfil</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActive('seguindo')}
                    aria-current={active === 'seguindo' ? 'true' : undefined}
                    className={`${active === 'seguindo' ? 'bg-brand-600 text-white' : 'bg-white text-gray-800 hover:bg-gray-50'} flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium ring-1 ring-inset ring-gray-200 cursor-pointer`}
                  >
                    <UsersIcon className="h-4 w-4" />
                    <span>Seguindo</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActive('solicitacoes')}
                    aria-current={active === 'solicitacoes' ? 'true' : undefined}
                    className={`${active === 'solicitacoes' ? 'bg-brand-600 text-white' : 'bg-white text-gray-800 hover:bg-gray-50'} flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium ring-1 ring-inset ring-gray-200 cursor-pointer`}
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>SolicitaÃ§Ãµes</span>
                  </button>
                </li>
              </ul>
            </nav>
          </aside>

          {/* ConteÃºdo Ã  direita */}
          <section>
            {active === 'perfil' ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Meu Perfil</h2>
                <p className="mt-1 text-sm text-gray-600">Gerencie seus dados pessoais. O e-mail Ã© somente leitura pois o login Ã© feito via {authProvider}.</p>

                <form onSubmit={submit} className="mt-6 space-y-6" aria-label="FormulÃ¡rio de atualizaÃ§Ã£o de perfil">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={data.name}
                      onChange={(e) => setData('name', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm"
                      required minLength={2} maxLength={100}
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">E-mail</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      readOnly
                      className="mt-1 block w-full cursor-not-allowed rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600 sm:text-sm"
                      aria-readonly="true"
                    />
                    <p className="mt-1 text-xs text-gray-500">O e-mail Ã© vinculado ao {authProvider} e nÃ£o pode ser alterado.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={processing}
                      className="inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {processing ? 'Salvando...' : 'Salvar alteraÃ§Ãµes'}
                    </button>
                    {recentlySuccessful && (
                      <span className="text-sm text-green-700">AlteraÃ§Ãµes salvas.</span>
                    )}
                  </div>
                </form>
              </div>
            ) : active === 'seguindo' ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Seguindo</h2>
                <p className="mt-1 text-sm text-gray-600">Resumo do currÃ­culo das pessoas que vocÃª segue.</p>
                {(!meSummary && (!followingSummary || followingSummary.length === 0)) ? (
                  <p className="mt-3 text-sm text-gray-600">VocÃª ainda nÃ£o segue ninguÃ©m.</p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Seguindo</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Fiz 100%</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Finalizei</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Joguei</th>
                          <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Quero Jogar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {meSummary && (
                          <tr key={`me-${meSummary.id}`} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              <a href={`/curriculo/${meSummary.id}`} className="text-gray-900 hover:underline">{meSummary.name} (VocÃª)</a>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-800">{meSummary.counts.cem_por_cento}</td>
                            <td className="px-4 py-2 text-sm text-gray-800">{meSummary.counts.finalizei}</td>
                            <td className="px-4 py-2 text-sm text-gray-800">{meSummary.counts.joguei}</td>
                            <td className="px-4 py-2 text-sm text-gray-800">{meSummary.counts.quero_jogar}</td>
                          </tr>
                        )}
                        {(followingSummary || []).map((f) => (
                          <tr key={f.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm font-medium text-gray-900">
                              <a href={`/curriculo/${f.id}`} className="text-gray-900 hover:underline">{f.name}</a>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-800">{f.counts.cem_por_cento}</td>
                            <td className="px-4 py-2 text-sm text-gray-800">{f.counts.finalizei}</td>
                            <td className="px-4 py-2 text-sm text-gray-800">{f.counts.joguei}</td>
                            <td className="px-4 py-2 text-sm text-gray-800">{f.counts.quero_jogar}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : active === 'solicitacoes' ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">SolicitaÃ§Ãµes de Jogos</h2>
                  <a
                    href="/opcoes/solicitacoes/novo"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 sm:w-auto"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Nova solicitaÃ§Ã£o
                  </a>
                </div>

                <p className="mt-1 text-sm text-gray-600">
                  {abilities?.canModerate ? 'VocÃª pode gerenciar todas as solicitaÃ§Ãµes em avaliaÃ§Ã£o.' : 'VocÃª pode gerenciar apenas as solicitaÃ§Ãµes criadas por vocÃª.'}
                </p>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Jogo</th>
                        <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">EstÃºdio</th>
                        {abilities?.canModerate && (
                          <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Criado por</th>
                        )}
                        <th scope="col" className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">Criado em</th>
                        <th scope="col" className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-gray-700">AÃ§Ãµes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(solicitations || []).map((g: any) => (
                        <tr key={g.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">
                            <div className="flex items-center gap-3 min-w-0">
                              {g.cover_url ? (
                                <img
                                  src={g.cover_url}
                                  alt=""
                                  className="hidden md:block h-10 w-8 flex-none rounded object-cover"
                                  loading="lazy"
                                  decoding="async"
                                  fetchPriority="low"
                                  width={32}
                                  height={40}
                                />
                              ) : (
                                <div className="hidden md:block h-10 w-8 flex-none rounded bg-gray-200" aria-hidden="true" />
                              )}
                              <div className="flex min-w-0 flex-col">
                                <span className="truncate font-medium">{g.name}</span>
                                <span className="text-xs text-gray-500">Em avaliaÃ§Ã£o</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-800">{g.studio_name || '-'}</td>
                          {abilities?.canModerate && (
                            <td className="px-4 py-2 text-sm text-gray-800">{g.created_by_name || '-'}</td>
                          )}
                          <td className="px-4 py-2 text-sm text-gray-800">{new Date(g.created_at).toLocaleDateString()}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">
                            <div className="flex items-center justify-end gap-2">
                              <a href={`/opcoes/solicitacoes/${g.id}/editar`} className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50">Editar</a>
                              <form id={`sol-del-${g.id}`} action={`/opcoes/solicitacoes/${g.id}`} method="POST">
                                <input type="hidden" name="_method" value="DELETE" />
                                <input type="hidden" name="_token" value={(document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || ''} />
                                <button type="button" onClick={() => setConfirmDelete({ id: g.id, name: g.name })} className="inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-red-500">Excluir</button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {(solicitations || []).length === 0 && (
                        <tr>
                          <td colSpan={abilities?.canModerate ? 5 : 4} className="px-4 py-6 text-center text-sm text-gray-600">Nenhuma solicitaÃ§Ã£o encontrada.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </main>
      <Footer />
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" aria-hidden="true" onClick={() => (!deleting ? setConfirmDelete(null) : null)} />
          <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-2xl ring-1 ring-gray-200">
            <h4 id="confirm-title" className="text-base font-semibold text-gray-900">Excluir solicitaÃ§Ã£o</h4>
            <p className="mt-2 text-sm text-gray-700">Tem certeza que deseja excluir {confirmDelete.name ? (<strong>{confirmDelete.name}</strong>) : 'esta solicitaÃ§Ã£o'}?</p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setConfirmDelete(null)} disabled={deleting} className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">Cancelar</button>
              <button type="button" onClick={() => {
                try {
                  setDeleting(true);
                  const form = document.getElementById(`sol-del-${confirmDelete.id}`) as HTMLFormElement | null;
                  if (form) form.submit();
                } finally {
                  // a navegaÃ§Ã£o deve ocorrer; fallback fecha modal
                  setDeleting(false);
                  setConfirmDelete(null);
                }
              }} disabled={deleting} className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50">{deleting ? 'Excluindoâ€¦' : 'Excluir'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2a5 5 0 110 10 5 5 0 010-10zM3.75 20.25a8.25 8.25 0 0116.5 0v.75H3.75v-.75z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M7.5 6a3.5 3.5 0 106.999 0A3.5 3.5 0 007.5 6zM2.25 19.5a5.25 5.25 0 0110.5 0v.75h-10.5v-.75zM17.032 8.25a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM14.25 19.5v.75h7.5v-.75a3.75 3.75 0 00-7.5 0z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M10 3a.75.75 0 01.75.75v5.5h5.5a.75.75 0 010 1.5h-5.5v5.5a.75.75 0 01-1.5 0v-5.5h-5.5a.75.75 0 010-1.5h5.5v-5.5A.75.75 0 0110 3z" />
    </svg>
  );
}



