﻿import React from 'react';
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
    base.push({ label: 'Jogos', href: '/admin/jogos' });
    base.push({ label: 'Estúdios', href: '/admin/estudios' });
    base.push({ label: 'Plataformas', href: '/admin/plataformas' });
    base.push({ label: 'Marcadores', href: '/admin/marcadores' });
    if (isAdmin) {
      base.push({ label: 'Configuração', href: '/admin/configuracao' });
      base.push({ label: 'Diagnóstico', href: '/admin/diagnostico' });
      base.push({ label: 'Manual do Sistema', href: '/admin/manual' });
    }
    return base;
  }, [isAdmin]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header auth={auth} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-3 sm:justify-between">
          {title && <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>}
          {currentPath.startsWith('/admin/jogos') && (
            <Link
              href="/admin/jogos/novo"
              className="hidden sm:inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            >
              Novo jogo
            </Link>
          )}
          {currentPath.startsWith('/admin/estudios') && (
            <Link
              href="/admin/estudios/novo"
              className="hidden sm:inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            >
              Novo estÃºdio
            </Link>
          )}
          {currentPath.startsWith('/admin/plataformas') && (
            <Link
              href="/admin/plataformas/novo"
              className="hidden sm:inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            >
              Nova plataforma
            </Link>
          )}
          {currentPath.startsWith('/admin/marcadores') && (
            <Link
              href="/admin/marcadores/novo"
              className="hidden sm:inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            >
              Novo marcador
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          {/* Sidebar fixa */}
          <aside className="lg:sticky lg:top-20">
            {/* No mobile: sempre expandido; botão de menu removido */}
            <nav id="admin-services" className="block" aria-label="Serviços administrativos">
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
              {/* AÃ§Ãµes rÃ¡pidas abaixo da lista (apenas mobile) */}
              <div className="mt-4 space-y-2 sm:hidden">
                {currentPath.startsWith('/admin/jogos') && (
                  <Link href="/admin/jogos/novo" className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800">
                    Novo jogo
                  </Link>
                )}
                {currentPath.startsWith('/admin/estudios') && (
                  <Link href="/admin/estudios/novo" className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800">
                    Novo estúdio
                  </Link>
                )}
                {currentPath.startsWith('/admin/plataformas') && (
                  <Link href="/admin/plataformas/novo" className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800">
                    Nova plataforma
                  </Link>
                )}
                {currentPath.startsWith('/admin/marcadores') && (
                  <Link href="/admin/marcadores/novo" className="inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800">
                    Novo marcador
                  </Link>
                )}
              </div>
            </nav>
          </aside>
          <section>
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
  if (href.startsWith('/admin/jogos')) return <GamepadIcon className={cls} />;
  if (href.startsWith('/admin/estudios')) return <BuildingIcon className={cls} />;
  if (href.startsWith('/admin/plataformas')) return <GamepadIcon className={cls} />;
  if (href.startsWith('/admin/marcadores')) return <HashtagIcon className={cls} />;
  if (href.startsWith('/admin/configuracao')) return <CogIcon className={cls} />;
  if (href.startsWith('/admin/diagnostico')) return <BeakerIcon className={cls} />;
  if (href.startsWith('/admin/manual')) return <BookIcon className={cls} />;
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

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M3.75 3A.75.75 0 013 3.75v16.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75V17.5h4v2.75c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75V3.75A.75.75 0 0021.25 3H3.75zM8 6.5h2v2H8v-2zm0 4h2v2H8v-2zM6 6.5h2v2H6v-2zm0 4h2v2H6v-2zm8-4h2v2h-2v-2zm0 4h2v2h-2v-2z" />
    </svg>
  );
}

function GamepadIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M6.75 9.75h2.5a.75.75 0 010 1.5h-2.5v2.5a.75.75 0 01-1.5 0v-2.5h-2.5a.75.75 0 010-1.5h2.5v-2.5a.75.75 0 011.5 0v2.5zM15.5 12.5a1 1 0 100-2 1 1 0 000 2zm3 2a1 1 0 100-2 1 1 0 000 2z" />
      <path d="M7.25 6.5h9.5a4.25 4.25 0 014.25 4.25v2.5a4.25 4.25 0 01-4.25 4.25h-1.3l-1.6-1.6a1.75 1.75 0 00-1.24-.51h-1.22c-.46 0-.9.18-1.23.51l-1.6 1.6h-1.31A4.25 4.25 0 013 13.25v-2.5A4.25 4.25 0 017.25 6.5z" />
    </svg>
  );
}

function HashtagIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M9.5 3a1 1 0 01.98.804L11 7h4l.52-2.196a1 1 0 111.96.392L17 7h2a1 1 0 110 2h-2.5l-1 4H18a1 1 0 110 2h-2.5l-.5 2a1 1 0 11-1.936-.484L13.5 15h-4l-.5 2a1 1 0 11-1.936-.484L7.5 15H5a1 1 0 110-2h2.5l1-4H6a1 1 0 110-2h2.5l.5-2A1 1 0 019.5 3zm4 6h-4l-1 4h4l1-4z" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M4.5 3.75A2.25 2.25 0 016.75 1.5h10.5A2.25 2.25 0 0119.5 3.75v14.25a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18V3.75zM6.75 3a.75.75 0 00-.75.75V18c0 .414.336.75.75.75h10.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75H6.75z" />
      <path d="M8.25 6.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5zM8.25 9.75h7.5a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5z" />
    </svg>
  );
}


