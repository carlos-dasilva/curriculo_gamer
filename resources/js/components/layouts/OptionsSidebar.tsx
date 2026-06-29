import React from 'react';

export default function OptionsSidebar({ active = 'perfil', showHeader = false }: { active?: 'perfil' | 'seguindo' | 'solicitacoes' | 'cronologias'; showHeader?: boolean }) {
  return (
    <aside className="lg:sticky lg:top-20 self-start">
      {showHeader && (
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Opções</h2>
          <p className="mt-1 text-sm text-gray-600">Acesse suas opções de conta e ações rápidas.</p>
        </div>
      )}
      <nav aria-label="Opções do usuário">
        <ul className="space-y-1">
          <li>
            <a
              href="/opcoes?tab=perfil"
              aria-current={active === 'perfil' ? 'true' : undefined}
              className={`${active === 'perfil' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800 hover:bg-gray-50'} flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium ring-1 ring-inset ring-gray-200 cursor-pointer`}
            >
              <UserIcon className="h-4 w-4" />
              <span>Perfil</span>
            </a>
          </li>
          <li>
            <a
              href="/opcoes?tab=seguindo"
              aria-current={active === 'seguindo' ? 'true' : undefined}
              className={`${active === 'seguindo' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800 hover:bg-gray-50'} flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium ring-1 ring-inset ring-gray-200 cursor-pointer`}
            >
              <UsersIcon className="h-4 w-4" />
              <span>Seguindo</span>
            </a>
          </li>
          <li>
            <a
              href="/opcoes?tab=solicitacoes"
              aria-current={active === 'solicitacoes' ? 'true' : undefined}
              className={`${active === 'solicitacoes' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800 hover:bg-gray-50'} flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium ring-1 ring-inset ring-gray-200 cursor-pointer`}
            >
              <PlusIcon className="h-4 w-4" />
              <span>Solicitações</span>
            </a>
          </li>
          <li>
            <a
              href="/opcoes?tab=cronologias"
              aria-current={active === 'cronologias' ? 'true' : undefined}
              className={`${active === 'cronologias' ? 'bg-gray-900 text-white' : 'bg-white text-gray-800 hover:bg-gray-50'} flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium ring-1 ring-inset ring-gray-200 cursor-pointer`}
            >
              <TimelineIcon className="h-4 w-4" />
              <span>Cronologias</span>
            </a>
          </li>
        </ul>
      </nav>
    </aside>
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
      <path d="M8.25 8.25a3 3 0 116 0 3 3 0 01-6 0z" />
      <path d="M2.25 20.25a7.5 7.5 0 0115 0V21H2.25v-.75zM17.648 7.116a2.252 2.252 0 110 4.504 2.252 2.252 0 010-4.504zM21.75 21v-.375a5.25 5.25 0 00-7.2-4.855 9.004 9.004 0 012.826 5.23H21.75z" />
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

function TimelineIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path d="M4.25 3a1.75 1.75 0 100 3.5 1.75 1.75 0 000-3.5zM4.25 8.25a1.75 1.75 0 100 3.5 1.75 1.75 0 000-3.5zM2.5 15.25a1.75 1.75 0 113.5 0 1.75 1.75 0 01-3.5 0zM8 4a.75.75 0 000 1.5h8.25a.75.75 0 000-1.5H8zM8 9.25a.75.75 0 000 1.5h8.25a.75.75 0 000-1.5H8zM7.25 15.25A.75.75 0 018 14.5h8.25a.75.75 0 010 1.5H8a.75.75 0 01-.75-.75z" />
    </svg>
  );
}
