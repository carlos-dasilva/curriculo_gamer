import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import Pagination from '@/components/ui/Pagination';
import AdminLayout from '@/components/layouts/AdminLayout';
import roleLabels from '@/i18n/pt-BR/roles.json';

type UserRow = { id: number; name: string; email: string; role: string };

type Paginator<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  links: { url: string | null; label: string; active: boolean }[];
};

type Props = {
  users: Paginator<UserRow>;
  filters?: { name?: string; email?: string; role?: string };
  roles: string[];
  auth: any;
  flash?: { success?: string; error?: string };
};

export default function UsersIndex({ users, filters, auth, flash, roles }: Props) {
  const fmtRole = (r: string) => (roleLabels as Record<string, string>)[r] ?? r;
  const [name, setName] = React.useState(filters?.name ?? '');
  const [email, setEmail] = React.useState(filters?.email ?? '');
  const [role, setRole] = React.useState(filters?.role ?? '');

  const applyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    router.get('/admin/usuarios', { name, email, role }, { preserveScroll: true, replace: true });
  };

  return (
    <div>
      <Head title="Usu\u00E1rios" />
      <AdminLayout title="Usu\u00E1rios">
        <div className="mb-6">
          <h1 className="mb-3 text-2xl font-semibold text-gray-900">{'Usu\u00E1rios'}</h1>
          <form onSubmit={applyFilters} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="w-full sm:max-w-xs">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome</label>
              <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div className="w-full sm:max-w-xs">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">E-mail</label>
              <input id="email" type="text" placeholder="Qualquer parte do e-mail..." value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div className="w-full sm:max-w-xs">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">{'N\u00EDvel'}</label>
              <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500">
                <option value="">Todos</option>
                {roles.map((r) => (
                  <option key={r} value={r}>{fmtRole(r)}</option>
                ))}
              </select>
            </div>
            <div>
              <button type="submit" className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900">
                Aplicar filtros
              </button>
            </div>
          </form>
          <p className="mt-2 text-xs text-gray-500">{users.total} resultado(s)</p>
        </div>

        {flash?.success && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{flash.success}</div>
        )}
        {flash?.error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{flash.error}</div>
        )}

        <div className="max-w-full overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-[720px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nome</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">E-mail</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{'N\u00EDvel'}</th>
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.data.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <Link
                      href={`/curriculo/${u.id}`}
                      aria-label={`Abrir curr\u00EDculo de ${u.name}`}
                      className="text-gray-900 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                    >
                      {u.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-inset ring-gray-200">
                      {fmtRole(u.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/usuarios/${u.id}/editar`}
                      className="inline-flex items-center whitespace-nowrap rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PaginaÃ§Ã£o */}
        <Pagination links={users.links} />
      </AdminLayout>
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M12.78 15.53a.75.75 0 01-1.06 0l-5-5a.75.75 0 010-1.06l5-5a.75.75 0 111.06 1.06L8.31 10l4.47 4.47a.75.75 0 010 1.06z" clipRule="evenodd" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M7.22 4.47a.75.75 0 011.06 0l5 5a.75.75 0 010 1.06l-5 5a.75.75 0 11-1.06-1.06L11.69 10 7.22 5.53a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
  );
}







