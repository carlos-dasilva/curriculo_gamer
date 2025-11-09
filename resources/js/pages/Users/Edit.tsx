import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/components/layouts/AdminLayout';
import roleLabels from '@/i18n/pt-BR/roles.json';

type Props = {
  user: { id: number; name: string; email: string; role: string; is_blocked?: boolean };
  allowedRoles: string[];
  readOnly?: boolean;
  abilities?: { canBlock?: boolean; canUnblock?: boolean };
  ui?: { lockRole?: boolean; lockRoleReason?: string | null };
  auth: any;
  flash?: { success?: string; error?: string };
};

export default function UsersEdit({ user, allowedRoles, readOnly, abilities, ui, auth, flash }: Props) {
  const { data, setData, put, processing, errors } = useForm({
    name: user.name,
    role: user.role,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!readOnly) {
      put(`/admin/usuarios/${user.id}`);
    }
  };

  return (
    <div>
      <Head title={`Editar: ${user.name}`}>
        <meta name="description" content={`Editar usuário ${user.name}: atualizar nome e nível de acesso.`} />
      </Head>
      <AdminLayout title="Usuários">
        <h2 className="text-xl font-semibold text-gray-900">Editar usuário</h2>
        <p className="mt-1 text-sm text-gray-600">Somente nome e nível podem ser alterados. E-mail é somente leitura (login Google).</p>

        {flash?.error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{flash.error}</div>
        )}

        <form onSubmit={submit} className="mt-6 space-y-6" aria-label="Formulário de edição de usuário">
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
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-600"
              required
              minLength={2}
              maxLength={100}
              disabled={!!readOnly}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Nível
            </label>
            <select
              id="role"
              name="role"
              value={data.role}
              onChange={(e) => setData('role', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-600"
              disabled={!!readOnly || !!ui?.lockRole}
            >
              {allowedRoles.map((r) => {
                const label = (roleLabels as Record<string, string>)[r] ?? r;
                return (
                  <option key={r} value={r}>
                    {label}
                  </option>
                );
              })}
            </select>
            {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
            {!readOnly && ui?.lockRole && (
              <p className="mt-1 text-xs text-gray-500">{ui.lockRoleReason || 'Nível bloqueado para este usuário.'}</p>
            )}
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
          </div>

          {/* Estado de bloqueio */}
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Status</div>
                <div className="text-sm text-gray-700">{user.is_blocked ? 'Bloqueado' : 'Ativo'}</div>
              </div>
              <div className="flex items-center gap-2">
                {user.is_blocked ? (
                  abilities?.canUnblock ? (
                    <Link
                      href={`/admin/usuarios/${user.id}/desbloquear`}
                      method="put"
                      as="button"
                      className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 cursor-pointer"
                    >
                      Remover bloqueio
                    </Link>
                  ) : null
                ) : (
                  abilities?.canBlock ? (
                    <Link
                      href={`/admin/usuarios/${user.id}/bloquear`}
                      method="put"
                      as="button"
                      className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 cursor-pointer"
                    >
                      Bloquear usuário
                    </Link>
                  ) : null
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!readOnly && (
              <button
                type="submit"
                disabled={processing}
                className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing ? 'Salvando...' : 'Salvar alterações'}
              </button>
            )}
            {readOnly && (
              <span className="text-sm text-gray-600">Edição indisponível: usuário administrador.</span>
            )}
            <Link href="/admin/usuarios" className="text-sm text-gray-700 underline-offset-2 hover:underline">
              Voltar
            </Link>
          </div>
        </form>
      </AdminLayout>
    </div>
  );
}
