import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/components/layouts/AdminLayout';

type Settings = {
  email?: string | null;
  telefone?: string | null;
  endereco?: string | null;
  github?: string | null;
  linkedin?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  x?: string | null;
  youtube?: string | null;
  discord?: string | null;
  system_logs_enabled?: boolean | null;
  whatsapp?: string | null;
};

type Props = {
  settings: Settings;
  logResolvedPath: string;
  auth: any;
  flash?: { success?: string; error?: string };
};

export default function AdminConfig({ settings, logResolvedPath, auth, flash }: Props) {
  const { data, setData, put, processing, errors } = useForm<Required<Settings>>({
    email: settings.email ?? '',
    telefone: settings.telefone ?? '',
    endereco: settings.endereco ?? '',
    github: settings.github ?? '',
    linkedin: settings.linkedin ?? '',
    instagram: settings.instagram ?? '',
    facebook: settings.facebook ?? '',
    x: settings.x ?? '',
    youtube: settings.youtube ?? '',
    discord: settings.discord ?? '',
    system_logs_enabled: !!settings.system_logs_enabled,
    whatsapp: settings.whatsapp ?? '',
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    put('/admin/configuracao');
  };

  return (
    <div>
      <Head title="Configuração" />
      <AdminLayout title="Configuração">
        {flash?.success && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">{flash.success}</div>
        )}
        {flash?.error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{flash.error}</div>
        )}

        <form onSubmit={submit} className="space-y-8" aria-label="Formulário de configuração do site">
          <section>
            <h2 className="text-lg font-semibold text-gray-900">Contato</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="E-mail" id="email" type="email" value={data.email} onChange={(v) => setData('email', v)} error={errors.email as any} placeholder="contato@exemplo.com" />
              <Field label="Telefone" id="telefone" value={data.telefone} onChange={(v) => setData('telefone', v)} error={errors.telefone as any} placeholder="(00) 0000-0000" />
            </div>
            <div className="mt-4">
              <Field label="Endereço" id="endereco" value={data.endereco} onChange={(v) => setData('endereco', v)} error={(errors as any).endereco} placeholder="Rua Exemplo, 123 - Cidade/UF" />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Redes sociais</h2>
            <p className="mt-1 text-sm text-gray-600">Deixe em branco para ocultar no rodapé.</p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="GitHub" id="github" value={data.github} onChange={(v) => setData('github', v)} error={errors.github as any} placeholder="https://github.com/sua-org/seu-repo" />
              <Field label="LinkedIn" id="linkedin" value={data.linkedin} onChange={(v) => setData('linkedin', v)} error={errors.linkedin as any} placeholder="https://www.linkedin.com/in/seu-perfil/" />
              <Field label="Instagram" id="instagram" value={data.instagram} onChange={(v) => setData('instagram', v)} error={errors.instagram as any} placeholder="https://www.instagram.com/seu-perfil/" />
              <Field label="Facebook" id="facebook" value={data.facebook} onChange={(v) => setData('facebook', v)} error={errors.facebook as any} placeholder="https://www.facebook.com/seu-perfil/" />
              <Field label="X (Twitter)" id="x" value={data.x} onChange={(v) => setData('x', v)} error={errors.x as any} placeholder="https://x.com/seu-perfil" />
              <Field label="YouTube" id="youtube" value={data.youtube} onChange={(v) => setData('youtube', v)} error={errors.youtube as any} placeholder="https://www.youtube.com/@seu-canal" />
              <Field label="WhatsApp" id="whatsapp" value={data.whatsapp} onChange={(v) => setData('whatsapp', v)} error={errors.whatsapp as any} placeholder="https://wa.me/5599999999999 ou número" />
              <Field label="Discord" id="discord" value={(data as any).discord || ""} onChange={(v) => setData("discord" as any, v)} error={(errors as any).discord} placeholder="https://discord.gg/seu-invite" />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900">Logs do Sistema</h2>
            <div className="mt-3 space-y-3">
              <label className="inline-flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={!!data.system_logs_enabled}
                  onChange={(e) => setData('system_logs_enabled', e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-800">Habilitar logs detalhados do sistema</span>
              </label>
              <p className="text-xs text-gray-600">1) Deixe este campo desmarcado.</p>
              <p className="text-xs text-gray-600">2) Os logs serão gravados em:</p>
              <code className="block rounded-md bg-gray-100 p-2 text-xs text-gray-800">{logResolvedPath}</code>
            </div>
          </section>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={processing} className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 disabled:cursor-not-allowed disabled:opacity-60">
              {processing ? 'Salvando...' : 'Salvar configurações'}
            </button>
            <Link href="/admin/dashboard" className="text-sm text-gray-700 underline-offset-2 hover:underline">Cancelar</Link>
          </div>
        </form>
      </AdminLayout>
    </div>
  );
}

function Field({ label, id, value, onChange, error, type = 'text', placeholder }: { label: string; id: string; value: string; onChange: (v: string) => void; error?: string; type?: string; placeholder?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 sm:text-sm"
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}









