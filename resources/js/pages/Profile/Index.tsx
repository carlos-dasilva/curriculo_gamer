import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

type Props = {
  user: { name: string; email: string };
  authProvider: string;
  followingSummary?: Array<{
    id: number;
    name: string;
    counts: { cem_por_cento: number; finalizei: number; joguei: number; quero_jogar: number };
  }>;
  auth: {
    isAuthenticated: boolean;
    user?: { name: string; email: string } | null;
    loginUrl?: string;
    logoutUrl?: string;
    abilities?: { manageUsers?: boolean };
  };
  flash?: { success?: string; error?: string };
};

export default function ProfileIndex({ user, authProvider, auth, flash, followingSummary = [] }: Props) {
  const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
    name: user.name,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put('/perfil');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Meu Perfil" />
      <Header auth={auth} />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Meu Perfil</h1>
        <p className="mt-1 text-sm text-gray-600">Gerencie seus dados pessoais. O e-mail é somente leitura pois o login é feito via {authProvider}.</p>

        {flash?.success && (
          <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{flash.success}</div>
        )}
        {flash?.error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{flash.error}</div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-6" aria-label="Formulário de atualização de perfil">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Nome
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm"
              required
              minLength={2}
              maxLength={100}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">E-mail</label>
            <input
              type="email"
              value={user.email}
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
              className="inline-flex items-center rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? 'Salvando...' : 'Salvar alterações'}
            </button>
            {recentlySuccessful && (
              <span className="text-sm text-green-700">Alterações salvas.</span>
            )}
            <Link href="/" className="text-sm text-gray-700 underline-offset-2 hover:underline">
              Voltar
            </Link>
          </div>
        </form>
        {/* Seguindo - resumo de currículos */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-900">Seguindo</h2>
          <p className="mt-1 text-sm text-gray-600">Resumo do currículo das pessoas que você segue.</p>
          {followingSummary.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">Você ainda não segue ninguém.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
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
                  {followingSummary.map((f) => (
                    <tr key={f.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900">
                        <Link href={`/curriculo/${f.id}`} className="text-gray-900 hover:underline">
                          {f.name}
                        </Link>
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
        </section>
      </main>
      <Footer />
    </div>
  );
}
