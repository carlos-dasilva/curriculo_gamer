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
  const [active, setActive] = React.useState<'perfil' | 'seguindo' | 'novo'>('perfil');
  const { data, setData, put, processing, errors, recentlySuccessful } = useForm({ name: user?.name || '' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put('/perfil');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Opcoes" />
      <Header auth={auth} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Opções</h1>
          <p className="mt-1 text-sm text-gray-600">Acesse suas opções de conta e ações rápidas.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar esquerda */}
          <aside className="lg:sticky lg:top-20 self-start">
            <nav aria-label="Opções do usuário">
              <ul className="space-y-1">
                <li>
                  <button
                    type="button"
                    onClick={() => setActive('perfil')}
                    aria-current={active === 'perfil' ? 'true' : undefined}
                    className={`${active === 'perfil' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800 hover:bg-gray-50'} flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium ring-1 ring-inset ring-gray-200`}
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
                    className={`${active === 'seguindo' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800 hover:bg-gray-50'} flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium ring-1 ring-inset ring-gray-200`}
                  >
                    <UsersIcon className="h-4 w-4" />
                    <span>Seguindo</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    disabled
                    className="flex w-full items-center gap-2 rounded-md bg-white px-3 py-2 text-left text-sm font-medium text-gray-400 ring-1 ring-inset ring-gray-200 cursor-not-allowed"
                    title="Em breve"
                  >
                    <PlusIcon className="h-4 w-4" />
                    <span>Novo Jogo</span>
                  </button>
                </li>
              </ul>
            </nav>
          </aside>

          {/* Conteúdo à direita */}
          <section>
            {active === 'perfil' ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Meu Perfil</h2>
                <p className="mt-1 text-sm text-gray-600">Gerencie seus dados pessoais. O e-mail é somente leitura pois o login é feito via {authProvider}.</p>

                <form onSubmit={submit} className="mt-6 space-y-6" aria-label="Formulário de atualização de perfil">
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
                    <p className="mt-1 text-xs text-gray-500">O e-mail é vinculado ao {authProvider} e não pode ser alterado.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="submit"
                      disabled={processing}
                      className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {processing ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                    {recentlySuccessful && (
                      <span className="text-sm text-green-700">Alterações salvas.</span>
                    )}
                  </div>
                </form>
              </div>
            ) : active === 'seguindo' ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Seguindo</h2>
                <p className="mt-1 text-sm text-gray-600">Resumo do currículo das pessoas que você segue.</p>
                {(!meSummary && (!followingSummary || followingSummary.length === 0)) ? (
                  <p className="mt-3 text-sm text-gray-600">Você ainda não segue ninguém.</p>
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
                              <a href={`/curriculo/${meSummary.id}`} className="text-gray-900 hover:underline">{meSummary.name} (Você)</a>
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
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">Em breve</h2>
                <p className="mt-1 text-sm text-gray-600">Use o menu à esquerda. Por enquanto, apenas Perfil está disponível.</p>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
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
