<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex, nofollow" />
    <title>404 • Página não encontrada</title>
    <link rel="icon" type="image/png" href="/img/favicon.png" />
    <link rel="shortcut icon" href="/favicon.ico" />
    @vite(['resources/css/app.css'])
    <style>
      /* Pequenos toques visuais sem depender apenas do Tailwind */
      .bg-grid {
        background-image: radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px);
        background-size: 12px 12px;
        background-position: -1px -1px;
      }
      .brand-shadow { filter: drop-shadow(0 8px 20px rgba(0,0,0,0.15)); }
    </style>
  </head>
  <body class="min-h-screen bg-gray-50 text-gray-900 antialiased">
    <main role="main" class="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden">
      <!-- Ornamentos de fundo -->
      <div aria-hidden="true" class="pointer-events-none absolute inset-0 bg-grid"></div>
      <div aria-hidden="true" class="pointer-events-none absolute left-1/2 top-0 -z-10 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-gradient-to-b from-gray-100 to-transparent blur-3xl"></div>

      <!-- Marca -->
      <div class="mb-8 flex flex-col items-center gap-3">
        <img src="/img/logo.png" alt="Logo" class="brand-shadow h-20 w-auto" loading="lazy" decoding="async" fetchpriority="low" width="80" height="80" />
        <img src="/img/nome.png" alt="Currículo Gamer" class="h-10 w-auto opacity-90" loading="lazy" decoding="async" fetchpriority="low" width="160" height="40" />
      </div>

      <!-- Conteúdo -->
      <section class="mx-4 w-full max-w-xl rounded-2xl border border-gray-200 bg-white/90 p-8 shadow-sm backdrop-blur">
        <div class="flex items-start gap-4">
          <div class="rounded-xl bg-gray-900 px-3 py-2 text-white">
            <span class="font-mono text-lg font-semibold">404</span>
          </div>
          <div class="flex-1">
            <h1 class="text-xl font-semibold">Página não encontrada</h1>
            <p class="mt-1 text-sm text-gray-700">
              A página que você tentou acessar não existe ou foi movida.
            </p>
            <div class="mt-6 flex flex-wrap gap-3">
              <a href="/" class="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900">
                Ir para a página inicial
              </a>
              @auth
                <a href="/admin/dashboard" class="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-800 ring-1 ring-inset ring-gray-200 hover:bg-gray-50">
                  Ir ao Dashboard
                </a>
              @endauth
              <button type="button" onclick="history.back()" class="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-800 ring-1 ring-inset ring-gray-200 hover:bg-gray-50">
                Voltar
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Rodapé mínimo -->
      <p class="mt-10 text-xs text-gray-500">Código: 404 • Not Found</p>
    </main>

    <noscript>
      <style>
        /* Garante legibilidade com JS desabilitado */
        .bg-grid { background: none; }
      </style>
    </noscript>
  </body>
  </html>
