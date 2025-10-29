import React from 'react';
import { Link } from '@inertiajs/react';
import strings from '@/i18n/pt-BR/home.json';

type AuthInfo = {
  isAuthenticated: boolean;
  user?: { name: string; email: string } | null;
  loginUrl?: string;
  logoutUrl?: string;
  abilities?: { manageUsers?: boolean };
};

type Props = {
  auth: AuthInfo;
};

export default function Header({ auth }: Props) {
  const logoSrc = '/img/logo.png';
  const nameSrc = '/img/nome.png';

  const [logoFallback, setLogoFallback] = React.useState<string | null>(null);
  const [nameFallback, setNameFallback] = React.useState<string | null>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleLogoError = () => {
    // Fallback SVG inline acessível, caso não exista logo.png
    const svg = encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='32' viewBox='0 0 120 32'>
         <rect width='120' height='32' rx='6' fill='#111827'/>
         <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#F9FAFB' font-family='Arial, sans-serif' font-size='14'>LOGO</text>
       </svg>`
    );
    setLogoFallback(`data:image/svg+xml;charset=UTF-8,${svg}`);
  };

  const handleNameError = () => {
    // Fallback SVG para nome da marca caso não exista nome.png
    const svg = encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='28' viewBox='0 0 200 28'>
         <rect width='200' height='28' rx='4' fill='transparent'/>
         <text x='0' y='20' fill='#111827' font-family='Arial, sans-serif' font-size='16'>Currículo Gamer</text>
       </svg>`
    );
    setNameFallback(`data:image/svg+xml;charset=UTF-8,${svg}`);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 relative">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="Ir para a página inicial">
          {/* Logo */}
          {logoFallback ? (
            <img src={logoFallback} alt="Logo" className="h-16 w-auto" />
          ) : (
            <img src={logoSrc} alt="Logo" className="h-16 w-auto" onError={handleLogoError} />
          )}
          {/* Nome ao lado da logo */}
          {nameFallback ? (
            <img src={nameFallback} alt="Currículo Gamer" className="hidden h-8 w-auto md:block" />
          ) : (
            <img src={nameSrc} alt="Currículo Gamer" className="hidden h-8 w-auto md:block" onError={handleNameError} />
          )}
          <span className="sr-only">Início</span>
        </Link>

        {/* Nome centralizado no mobile */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:hidden" aria-hidden="true" role="presentation">
          {nameFallback ? (
            <img src={nameFallback} alt="Currículo Gamer" className="h-9 w-auto" />
          ) : (
            <img src={nameSrc} alt="Currículo Gamer" className="h-9 w-auto" />
          )}
        </div>

        {/* Ações alinhadas à direita (desktop) */}
        <div className="hidden md:flex items-center gap-4 ml-auto">
          {auth?.abilities?.manageUsers && (
            <a
              href="/admin/dashboard"
              className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
            >
              <DashboardIcon className="h-4 w-4" />
              <span>Dashboard</span>
            </a>
          )}
          {!auth.isAuthenticated ? (
            <a
              href={(function(){
                const base = auth.loginUrl || '/auth/redirect/google';
                try {
                  const w = window as any;
                  const loc = (w?.location?.pathname || '/') + (w?.location?.search || '') + (w?.location?.hash || '');
                  const sep = (base.indexOf('?') >= 0) ? '&' : '?';
                  return `${base}${sep}intended=${encodeURIComponent(loc)}`;
                } catch(_) { return base; }
              })()}
              className="inline-flex items-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
              aria-label={strings.header.entrarGoogle}
            >
              <GoogleIcon className="h-5 w-5" />
              {strings.header.entrarGoogle}
            </a>
          ) : (
            <div className="flex items-center gap-3">
              <a
                href="/opcoes"
                aria-label="Abrir opções"
                className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
                title="Opções"
              >
                Opções
              </a>
              <form method="POST" action={auth.logoutUrl || '#'}>
                <input type="hidden" name="_token" value={document.querySelector('meta[name=csrf-token]')?.getAttribute('content') || ''} />
                <button
                  type="submit"
                  aria-label={strings.header.sair}
                  title={strings.header.sair}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-2 text-gray-700 shadow-sm hover:bg-gray-50 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                >
                  <LogoutIcon className="h-5 w-5" />
                  <span className="sr-only">{strings.header.sair}</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Menu mobile (hambúrguer) */}
                {/* Mobile actions: Google login (guest) or hamburger (auth) */}
        <div className="md:hidden ml-auto">
          {!auth.isAuthenticated ? (
            <a
              href={auth.loginUrl || '#'}
              aria-label={strings.header.entrarGoogle}
              title={strings.header.entrarGoogle}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            >
              <GoogleIcon className="h-5 w-5" />
            </a>
          ) : (
            <button
              type="button"
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white p-2 text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            >
              <HamburgerIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Painel do menu mobile */}
      {auth.isAuthenticated && menuOpen && (
        <div className="absolute right-4 top-16 z-50 w-56 rounded-md border border-gray-200 bg-white p-2 shadow-lg md:hidden" role="menu" aria-label="Menu">
          <div className="flex flex-col gap-1">
            {auth?.abilities?.manageUsers && (
              <a href="/admin/dashboard" className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-800 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                <DashboardIcon className="h-4 w-4" />
                <span>Dashboard</span>
              </a>
            )}
            {!auth.isAuthenticated ? (
              <a
                href={(function(){
                  const base = auth.loginUrl || '/auth/redirect/google';
                  try {
                    const w = window as any;
                    const loc = (w?.location?.pathname || '/') + (w?.location?.search || '') + (w?.location?.hash || '');
                    const sep = (base.indexOf('?') >= 0) ? '&' : '?';
                    return `${base}${sep}intended=${encodeURIComponent(loc)}`;
                  } catch(_) { return base; }
                })()}
                className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                <GoogleIcon className="h-5 w-5" />
                <span>{strings.header.entrarGoogle}</span>
              </a>
            ) : (
              <>
                <a href="/opcoes" className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-800 hover:bg-gray-50" onClick={() => setMenuOpen(false)}>
                  <UserIcon className="h-4 w-4" />
                  <span>Opções</span>
                </a>
                <Link
                  href={auth.logoutUrl || '#'}
                  method="post"
                  as="button"
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50 cursor-pointer"
                >
                  <LogoutIcon className="h-4 w-4" />
                  <span>{strings.header.sair}</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path fill="#FFC107" d="M43.6 20.1h-1.6V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C33.9 6.1 29.2 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c9.9 0 19-7.2 19-20 0-1.3-.1-2.7-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.2 19 14 24 14c3.1 0 5.8 1.1 8 3l5.7-5.7C33.9 6.1 29.2 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.1 0 9.7-1.9 13.2-5.1l-6.1-5.2C29.9 35.1 27.2 36 24 36c-5.1 0-9.5-3.3-11.1-7.9l-6.5 5C9.7 39.7 16.4 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6 8-11.3 8-4.8 0-8.8-2.7-10.9-6.7l-6.5 5C10.3 39.7 16.9 44 24 44c9.9 0 19-7.2 19-20 0-1.3-.1-2.7-.4-3.9z"/>
    </svg>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M3 3.75A.75.75 0 013.75 3h6.5a.75.75 0 01.75.75v6.5a.75.75 0 01-.75.75h-6.5A.75.75 0 013 10.25v-6.5zM13 3.75a.75.75 0 01.75-.75h6.5a.75.75 0 01.75.75v6.5a.75.75 0 01-.75.75h-6.5A.75.75 0 0113 10.25v-6.5zM3 13.75a.75.75 0 01.75-.75h6.5a.75.75 0 01.75.75v6.5a.75.75 0 01-.75.75h-6.5A.75.75 0 013 20.25v-6.5zM13 13a.75.75 0 00-.75.75v6.5c0 .414.336.75.75.75h6.5a.75.75 0 00.75-.75v-6.5A.75.75 0 0019.5 13H13z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M15.75 3a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0V4.5h-6A1.5 1.5 0 007.5 6v12A1.5 1.5 0 009 19.5h6v-2.25a.75.75 0 011.5 0v3A.75.75 0 0116.5 21h-7.5A3 3 0 016 18V6a3 3 0 013-3h6.75z" />
      <path d="M15.53 12.75l-2.47 2.47a.75.75 0 101.06 1.06l3.75-3.75a.75.75 0 000-1.06l-3.75-3.75a.75.75 0 10-1.06 1.06l2.47 2.47H9a.75.75 0 000 1.5h6.53z" />
    </svg>
  );
}

function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2a5 5 0 110 10 5 5 0 010-10zM3.75 20.25a8.25 8.25 0 0116.5 0v.75H3.75v-.75z" />
    </svg>
  );
}
