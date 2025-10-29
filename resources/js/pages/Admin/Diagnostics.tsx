import React from 'react';
import { Head } from '@inertiajs/react';
import AdminLayout from '@/components/layouts/AdminLayout';

type TempDir = { label: string; path: string | null; exists: boolean; writable: boolean };

type Props = {
  environment: {
    app_url?: string | null;
    app_env?: string | null;
    app_debug?: boolean;
    timezone?: string | null;
    locale?: string | null;
    php_version: string;
    php_sapi: string;
    php_ini?: string | null;
    server_software?: string | null;
    os?: string | null;
    uname?: string | null;
  };
  limits: Record<string, string | null>;
  tempDirs: TempDir[];
  storage: { path: string; writable: boolean; free_bytes?: number | null; free_human?: string | null };
  sessions: Record<string, unknown>;
  queue: Record<string, unknown>;
  cache: Record<string, unknown>;
  database: Record<string, unknown>;
  extensions: { count: number; list: string[] };
  tips: { min_upload: string };
  commands: { linux_setup_tmp: string; php_serve_override: string; windows_setup_tmp: string };
};

export default function AdminDiagnostics({ environment, limits, tempDirs, storage, sessions, queue, cache, database, extensions, tips, commands }: Props) {
  const fmt = (v: unknown) => (v === null || v === undefined || v === '' ? 'N/A' : String(v));

  const limitRows: { key: string; label: string }[] = [
    { key: 'upload_max_filesize', label: 'upload_max_filesize' },
    { key: 'post_max_size', label: 'post_max_size' },
    { key: 'max_file_uploads', label: 'max_file_uploads' },
    { key: 'file_uploads', label: 'file_uploads' },
    { key: 'memory_limit', label: 'memory_limit' },
    { key: 'max_execution_time', label: 'max_execution_time' },
  ];

  return (
    <div>
      <Head title="Diagnóstico" />
      <AdminLayout title="Diagnóstico">
        <div className="space-y-8">
          {/* Ambiente */}
          <section aria-label="Ambiente PHP" className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Ambiente PHP</h2>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="grid grid-cols-1 gap-0 divide-y divide-gray-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <KV label="SAPI" value={environment.php_sapi} />
                <KV label="PHP" value={environment.php_version} />
                <KV label="APP_URL" value={environment.app_url} />
                <KV label="APP_ENV" value={environment.app_env} />
                <KV label="APP_DEBUG" value={String(!!environment.app_debug)} />
                <KV label="Timezone" value={environment.timezone} />
                <KV label="Locale" value={environment.locale} />
                <KV label="php.ini" value={environment.php_ini} />
                <KV label="Server Software" value={environment.server_software} />
                <KV label="OS" value={environment.os} />
                <KV label="uname()" value={environment.uname} />
              </div>
            </div>
          </section>

          {/* Limites de upload */}
          <section aria-label="ini_get (limites de upload)" className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">ini_get (limites de upload)</h2>
            <div className="max-w-full overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="min-w-[480px] w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Config</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {limitRows.map(({ key, label }) => (
                    <tr key={key}>
                      <td className="px-4 py-2 text-sm text-gray-700">{label}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{fmt(limits[key])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-600">Dica: {tips.min_upload}</p>
          </section>

          {/* Diretórios temporários */}
          <section aria-label="Diretórios temporários" className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Diretórios temporários</h2>
            <div className="max-w-full overflow-x-auto rounded-lg border border-gray-200 bg-white">
              <table className="min-w-[640px] w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Local</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Caminho</th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tempDirs.map((t) => (
                    <tr key={t.label}>
                      <td className="px-4 py-2 text-sm text-gray-700">{t.label}</td>
                      <td className="px-4 py-2 text-sm font-mono text-gray-900 break-all">{fmt(t.path)}</td>
                      <td className="px-4 py-2 text-sm">
                        <Status exists={t.exists} writable={t.writable} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Se "storage/app/tmp" não existir ou não for gravável, crie e ajuste permissões:
              <div className="mt-2 space-y-1">
                <CodeLine label="Linux">{commands.linux_setup_tmp}</CodeLine>
                <CodeLine label="Windows">{commands.windows_setup_tmp}</CodeLine>
              </div>
            </div>
          </section>

          {/* Armazenamento */}
          <section aria-label="Armazenamento" className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Armazenamento</h2>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="grid grid-cols-1 gap-0 divide-y divide-gray-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <KV label="storage_path()" value={storage.path} mono />
                <KV label="Gravável" value={storage.writable ? 'sim' : 'não'} />
                <KV label="Espaço livre" value={storage.free_human || 'N/A'} />
              </div>
            </div>
          </section>

          {/* Configurações Laravel */}
          <section aria-label="Config Laravel" className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Laravel</h2>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="grid grid-cols-1 gap-0 divide-y divide-gray-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                <KV label="Sessões (driver)" value={fmt(sessions.driver)} />
                <KV label="Fila (default)" value={fmt(queue.default)} />
                <KV label="Cache (store)" value={fmt(cache.store)} />
                <KV label="Banco (default)" value={`${fmt(database.default)} (${fmt(database.driver)})`} />
              </div>
            </div>
          </section>

          {/* Extensões PHP */}
          <section aria-label="Extensões PHP" className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Extensões PHP</h2>
            <p className="text-sm text-gray-600">Carregadas: {extensions.count}</p>
            <div className="rounded-lg border border-gray-200 bg-white p-3">
              <div className="flex flex-wrap gap-2">
                {extensions.list.map((ext) => (
                  <span key={ext} className="rounded-md bg-gray-50 px-2 py-1 text-xs text-gray-800 ring-1 ring-inset ring-gray-200">
                    {ext}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Comando de override rápido (dev) */}
          <section aria-label="Override rápido" className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">Override rápido (desenvolvimento)</h2>
            <p className="text-sm text-gray-600">Inicie o servidor com limites maiores temporariamente:</p>
            <div className="rounded-md border border-gray-200 bg-white p-3">
              <CodeLine>{commands.php_serve_override}</CodeLine>
            </div>
          </section>
        </div>
      </AdminLayout>
    </div>
  );
}

function KV({ label, value, mono }: { label: string; value: string | number | null | undefined; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 p-3">
      <div className="w-48 shrink-0 text-sm font-medium text-gray-600">{label}</div>
      <div className={`min-w-0 flex-1 text-sm ${mono ? 'font-mono' : ''} text-gray-900 break-all`}>{value ?? 'N/A'}</div>
    </div>
  );
}

function Status({ exists, writable }: { exists: boolean; writable: boolean }) {
  const classes = writable
    ? 'bg-green-50 text-green-700 ring-green-200'
    : exists
    ? 'bg-amber-50 text-amber-700 ring-amber-200'
    : 'bg-red-50 text-red-700 ring-red-200';
  const label = writable ? 'gravável' : exists ? 'existe (não gravável)' : 'não existe';
  return <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${classes}`}>{label}</span>;
}

function CodeLine({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      {label && <span className="mt-1 text-xs font-medium text-gray-600">{label}:</span>}
      <code className="block w-full overflow-x-auto rounded-md bg-gray-900 p-2 text-xs text-gray-100">{children}</code>
    </div>
  );
}
