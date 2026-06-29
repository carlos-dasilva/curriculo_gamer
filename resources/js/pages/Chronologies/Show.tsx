import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';

type StepGame = {
  id: number;
  name: string;
  cover_url?: string | null;
  status?: string | null;
  status_label: string;
  is_completed: boolean;
  is_perfected: boolean;
  platforms: Array<{ name: string; status: string; label: string }>;
};

type Step = {
  id: number;
  position: number;
  title?: string | null;
  is_completed: boolean;
  games: StepGame[];
};

type Props = {
  chronology: {
    id: number;
    name: string;
    description?: string | null;
  };
  progress: {
    total_steps: number;
    completed_steps: number;
    completion_percent: number;
  };
  steps: Step[];
  subject: {
    id: number;
    name: string;
    avatar_url?: string | null;
    isMe: boolean;
  };
};

export default function ChronologyShow({ chronology, progress, steps, subject }: Props) {
  const page = usePage();
  const auth = (page.props as any).auth;
  const backHref = subject.isMe ? '/meu-curriculo?view=chronologies' : `/curriculo/${subject.id}?view=chronologies`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title={`${chronology.name} - Cronologia`} />
      <Header auth={auth} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <img
              src={subject.avatar_url || '/img/sem-imagem.svg'}
              alt={subject.name || 'Usuário'}
              referrerPolicy="no-referrer"
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/img/sem-imagem.svg'; }}
              className="h-12 w-12 flex-none rounded-full object-cover ring-2 ring-gray-200 shadow-sm"
              width={48}
              height={48}
              loading="lazy"
              decoding="async"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-500">Cronologia de {subject.isMe ? 'você' : subject.name}</p>
              <h1 className="truncate text-2xl font-semibold text-gray-900">{chronology.name}</h1>
            </div>
          </div>
          <Link href={backHref} className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50">
            Voltar para cronologias
          </Link>
        </div>

        <section className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_280px]">
            <div className="p-5">
              <p className="text-sm text-gray-600">{chronology.description || 'Sequência cronológica aprovada pela administração.'}</p>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-gray-200" aria-label={`Progresso: ${progress.completion_percent}%`}>
                <div className="h-full rounded-full bg-gray-900" style={{ width: `${progress.completion_percent}%` }} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-700">
                <span className="font-semibold text-gray-900">{progress.completion_percent}% concluído</span>
                <span>{progress.completed_steps} de {progress.total_steps} partes concluídas</span>
              </div>
            </div>
            <div className="border-t border-gray-200 bg-gray-900 p-5 text-white lg:border-l lg:border-t-0">
              <p className="text-xs font-semibold uppercase text-gray-300">Regra de conclusão</p>
              <p className="mt-2 text-sm text-gray-100">
                Uma parte é concluída quando pelo menos um jogo daquela linha está marcado como Finalizei ou Fiz 100%.
              </p>
            </div>
          </div>
        </section>

        <ol className="space-y-4">
          {steps.map((step) => (
            <li key={step.id} className={`${step.is_completed ? 'border-gray-900' : 'border-gray-200'} rounded-lg border bg-white shadow-sm`}>
              <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className={`${step.is_completed ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'} inline-flex h-9 w-9 flex-none items-center justify-center rounded-full text-sm font-semibold`}>
                    {step.position}
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">{step.title || `Parte ${step.position}`}</h2>
                    <p className="text-sm text-gray-600">{step.games.length > 1 ? 'Jogos equivalentes nesta etapa' : 'Jogo desta etapa'}</p>
                  </div>
                </div>
                <span className={`${step.is_completed ? 'bg-green-50 text-green-800 ring-green-200' : 'bg-gray-50 text-gray-700 ring-gray-200'} inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset`}>
                  {step.is_completed ? <CheckIcon className="h-4 w-4" /> : <CircleIcon className="h-4 w-4" />}
                  {step.is_completed ? 'Parte concluída' : 'Pendente'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                {step.games.map((game) => (
                  <Link key={game.id} href={`/jogos/${game.id}`} className={`${game.is_completed ? 'ring-green-200' : 'ring-gray-200'} group flex gap-3 rounded-md bg-gray-50 p-3 ring-1 ring-inset transition hover:bg-white hover:shadow-sm`}>
                    <img src={game.cover_url || '/img/sem-imagem.svg'} alt="" className="h-24 w-16 flex-none rounded object-cover ring-1 ring-gray-200" loading="lazy" decoding="async" width={64} height={96} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 group-hover:underline">{game.name}</h3>
                        {game.is_completed && (
                          <span className={`${game.is_perfected ? 'bg-yellow-50 text-yellow-800 ring-yellow-200' : 'bg-green-50 text-green-800 ring-green-200'} inline-flex flex-none items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset`}>
                            {game.is_perfected ? '100%' : 'OK'}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs font-medium text-gray-600">{game.status_label}</p>
                      {game.platforms.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {game.platforms.slice(0, 3).map((platform) => (
                            <span key={`${platform.name}-${platform.status}`} className="rounded-full bg-white px-2 py-0.5 text-[11px] text-gray-700 ring-1 ring-inset ring-gray-200">
                              {platform.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ol>
      </main>
      <Footer />
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M16.704 5.29a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414l2.293 2.293 6.543-6.543a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

function CircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M10 3.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM2 10a8 8 0 1116 0 8 8 0 01-16 0z" clipRule="evenodd" />
    </svg>
  );
}
