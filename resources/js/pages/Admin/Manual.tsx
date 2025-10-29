import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/components/layouts/AdminLayout';

type RoleInfo = { key: 'admin' | 'moderador' | 'user'; title: string; description: string };
type Shortcut = { label: string; href: string };
type RouteRef = { method: string; path: string; name?: string };
type FuncItem = {
  title: string;
  description: string;
  access: string[];
  shortcuts?: Shortcut[];
  routes?: RouteRef[];
  examples?: string[];
};

type RouteDump = { name?: string | null; uri: string; methods: string[]; middleware: string[]; access: string };

type Props = {
  generatedAt: string;
  roles: RoleInfo[];
  functionalities: FuncItem[];
  routesDump: RouteDump[];
  notes?: Record<string, string>;
};

const badgeCls: Record<string, string> = {
  public: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  auth: 'bg-blue-50 text-blue-700 ring-blue-200',
  moderador: 'bg-amber-50 text-amber-800 ring-amber-200',
  admin: 'bg-purple-50 text-purple-700 ring-purple-200',
};

export default function AdminManual({ generatedAt, roles, functionalities, routesDump, notes }: Props) {
  const [filter, setFilter] = React.useState<'admin' | 'moderador' | 'user' | 'all'>('all');

  const filtered = React.useMemo(() => {
    if (filter === 'all') return functionalities;
    if (filter === 'user') return functionalities.filter((f) => f.access.includes('auth') || f.access.includes('public'));
    if (filter === 'moderador') return functionalities.filter((f) => f.access.includes('moderador') || f.access.includes('auth') || f.access.includes('public'));
    return functionalities.filter((f) => f.access.includes('admin'));
  }, [functionalities, filter]);

  return (
    <div>
      <Head title="Manual do Sistema" />
      <AdminLayout title="Manual do Sistema">
        <div className="space-y-8">
          <Intro generatedAt={generatedAt} roles={roles} onFilter={setFilter} filter={filter} notes={notes} />

          <section aria-label="Funcionalidades" className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Funcionalidades</h2>
            <div className="grid grid-cols-1 gap-4">
              {filtered.map((f) => (
                <Card key={f.title}>
                  <h3 className="text-base font-semibold text-gray-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-gray-700">{f.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {f.access.map((a) => (
                      <span key={a} className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeCls[a] || 'bg-gray-50 text-gray-700 ring-gray-200'}`}>{labelForAccess(a)}</span>
                    ))}
                  </div>
                  {f.shortcuts && f.shortcuts.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-900">Atalhos</h4>
                      <ul className="mt-1 flex flex-wrap gap-2">
                        {f.shortcuts.map((s) => (
                          <li key={`${s.href}-${s.label}`}>
                            <Link href={s.href} className="inline-flex items-center rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-sm hover:bg-gray-800">
                              {s.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {f.routes && f.routes.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-900">Rotas</h4>
                      <div className="mt-1 grid grid-cols-1 gap-1">
                        {f.routes.map((r, idx) => (
                          <code key={idx} className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-900 ring-1 ring-inset ring-gray-200">
                            <span className="font-semibold text-gray-700">{r.method}</span> <span className="font-mono">{r.path}</span>
                            {r.name ? <span className="text-gray-500"> {' '}(nome: {r.name})</span> : null}
                          </code>
                        ))}
                      </div>
                    </div>
                  )}
                  {f.examples && f.examples.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-900">Exemplos</h4>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-gray-700">
                        {f.examples.map((e) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </section>

          <section aria-label="Mapa de Rotas" className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Mapa de Rotas</h2>
            <p className="text-sm text-gray-600">Gerado automaticamente a partir da tabela de rotas e middlewares.</p>
            <div className="max-w-full overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="min-w-[720px] w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Nome</Th>
                    <Th>Métodos</Th>
                    <Th>Rota</Th>
                    <Th>Acesso</Th>
                    <Th>Middlewares</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {routesDump.map((r, i) => (
                    <tr key={`${r.uri}-${i}`} className="align-top">
                      <Td>{r.name || <span className="text-gray-400">(sem nome)</span>}</Td>
                      <Td>{r.methods.join(', ')}</Td>
                      <Td><code className="rounded bg-gray-50 px-1 py-0.5 text-xs ring-1 ring-inset ring-gray-200">{r.uri}</code></Td>
                      <Td>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${badgeCls[r.access] || 'bg-gray-50 text-gray-700 ring-gray-200'}`}>{labelForAccess(r.access)}</span>
                      </Td>
                      <Td>
                        <div className="flex max-w-[360px] flex-wrap gap-1">
                          {r.middleware.map((mw) => (
                            <span key={mw} className="rounded-md bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-700 ring-1 ring-inset ring-gray-200">{mw}</span>
                          ))}
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </AdminLayout>
    </div>
  );
}

function Intro({ generatedAt, roles, filter, onFilter, notes }: { generatedAt: string; roles: RoleInfo[]; filter: 'admin' | 'moderador' | 'user' | 'all'; onFilter: (f: 'admin' | 'moderador' | 'user' | 'all') => void; notes?: Record<string, string> }) {
  return (
    <section aria-label="Introdução" className="space-y-3">
      <p className="text-sm text-gray-700">Este manual documenta recursos, restrições e permissões por perfil. Visível apenas ao administrador.</p>
      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {roles.map((r) => (
            <div key={r.key} className="space-y-1">
              <div className="text-sm font-semibold text-gray-900">{r.title}</div>
              <p className="text-sm text-gray-700">{r.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <FilterButton active={filter === 'all'} onClick={() => onFilter('all')}>Todos</FilterButton>
          <FilterButton active={filter === 'admin'} onClick={() => onFilter('admin')}>Administrador</FilterButton>
          <FilterButton active={filter === 'moderador'} onClick={() => onFilter('moderador')}>Moderador</FilterButton>
          <FilterButton active={filter === 'user'} onClick={() => onFilter('user')}>Usuário</FilterButton>
          <div className="ml-auto text-xs text-gray-500">Gerado em {new Date(generatedAt).toLocaleString()}</div>
        </div>
        {notes?.always_update && <p className="mt-2 text-xs text-gray-500">{notes.always_update}</p>}
      </div>
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-4">{children}</div>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-2 text-sm text-gray-900">{children}</td>;
}

function FilterButton({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-800 hover:bg-gray-50'} inline-flex items-center rounded-md px-3 py-1 text-xs font-medium ring-1 ring-inset ring-gray-200`}
    >
      {children}
    </button>
  );
}

function labelForAccess(a: string): string {
  switch (a) {
    case 'public':
      return 'Público';
    case 'auth':
      return 'Autenticado';
    case 'moderador':
      return 'Moderador';
    case 'admin':
      return 'Administrador';
    default:
      return a;
  }
}

