import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

type Service = { label: string; href: string };

type Props = {
  title?: string;
  children: React.ReactNode;
};

export default function AdminLayout({ title, children }: Props) {
  const page = usePage();
  const auth = (page.props as any).auth;
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

  const [open, setOpen] = React.useState(false);

  const isAdmin = !!auth?.abilities?.isAdmin;
  const servicesToShow: Service[] = React.useMemo(() => {
    const base: Service[] = [
      { label: 'Dashboard', href: '/admin/dashboard' },
      { label: 'Usuários', href: '/admin/usuarios' },
    ];
    if (isAdmin) {
      base.push({ label: 'Configuração', href: '/admin/configuracao' });
      base.push({ label: 'Diagnóstico', href: '/admin/diagnostico' });
    }
    return base;
  }, [isAdmin]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header auth={auth} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {title && <h1 className="mb-4 text-2xl font-semibold text-gray-900">{title}</h1>}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar fixa */}
          <aside className="lg:sticky lg:top-20">
            <div className="mb-3 lg:hidden">
              <button
                type="button"
                onClick={() => setOpen(!open)}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                aria-expanded={open}
                aria-controls="admin-services"
              >
                Menu
              </button>
            </div>
            <nav id="admin-services" className={`${open ? 'block' : 'hidden'} lg:block`} aria-label="Serviços administrativos">
              <ul className="space-y-1">
                {servicesToShow.map((s) => {
                  const active = currentPath.startsWith(s.href);
                  return (
                    <li key={s.href}>
                      <Link
                        href={s.href}
                        className={`${active ? 'bg-gray-900 text-white' : 'bg-white text-gray-800 hover:bg-gray-50'} flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ring-1 ring-inset ring-gray-200`}
                        onClick={() => setOpen(false)}
                      >
                        {renderIcon(s.href)}
                        <span>{s.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Conteúdo dinâmico à direita */}
          <section className="min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            {children}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function renderIcon(href: string) {
  const cls = 'h-4 w-4';
  if (href.startsWith('/admin/dashboard')) return <Squares2x2Icon className={cls} />;
  if (href.startsWith('/admin/usuarios')) return <UsersIcon className={cls} />;
  if (href.startsWith('/admin/configuracao')) return <CogIcon className={cls} />;
  if (href.startsWith('/admin/diagnostico')) return <BeakerIcon className={cls} />;
  return null;
}

function Squares2x2Icon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M3 3.75A.75.75 0 013.75 3h6.5a.75.75 0 01.75.75v6.5a.75.75 0 01-.75.75h-6.5A.75.75 0 013 10.25v-6.5zM13 3.75a.75.75 0 01.75-.75h6.5a.75.75 0 01.75.75v6.5a.75.75 0 01-.75.75h-6.5A.75.75 0 0113 10.25v-6.5zM3 13.75a.75.75 0 01.75-.75h6.5a.75.75 0 01.75.75v6.5a.75.75 0 01-.75.75h-6.5A.75.75 0 013 20.25v-6.5zM13 13a.75.75 0 00-.75.75v6.5c0 .414.336.75.75.75h6.5a.75.75 0 00.75-.75v-6.5A.75.75 0 0019.5 13H13z" />
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

function CogIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567l-.121.724a8.95 8.95 0 00-1.67.968l-.666-.38a1.875 1.875 0 00-2.5.683l-.75 1.299a1.875 1.875 0 00.432 2.385l.57.494a8.963 8.963 0 000 1.936l-.57.494a1.875 1.875 0 00-.432 2.385l.75 1.299a1.875 1.875 0 002.5.683l.666-.38c.518.4 1.07.733 1.67.968l.12.724c.152.904.934 1.567 1.851 1.567h1.5c.917 0 1.699-.663 1.85-1.567l.121-.724c.6-.235 1.152-.568 1.67-.968l.666.38a1.875 1.875 0 002.5-.683l.75-1.299a1.875 1.875 0 00-.432-2.385l-.57-.494c.051-.64.051-1.296 0-1.936l.57-.494a1.875 1.875 0 00.432-2.385l-.75-1.299a1.875 1.875 0 00-2.5-.683l-.666.38a8.95 8.95 0 00-1.67-.968l-.12-.724A1.875 1.875 0 0012.578 2.25h-1.5zM12 9a3 3 0 110 6 3 3 0 010-6z" />
    </svg>
  );
}

function BeakerIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M9 2.25a.75.75 0 000 1.5h.75v5.379l-4.89 7.335A2.25 2.25 0 006.75 20.25h10.5a2.25 2.25 0 001.89-3.786L14.25 9.129V3.75h.75a.75.75 0 000-1.5H9z" />
    </svg>
  );
}

