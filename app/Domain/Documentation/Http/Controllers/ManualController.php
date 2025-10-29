<?php

namespace App\Domain\Documentation\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Route as RouteFacade;
use Inertia\Inertia;

class ManualController extends Controller
{
    public function index()
    {
        $generatedAt = now()->toAtomString();

        // Rotas públicas permitidas pelo middleware RequireAuthentication
        $publicRouteNames = [
            'home',
            'auth.google.redirect',
            'auth.google.callback',
            'privacy',
            'terms',
            'curriculum.show',
            'games.comments.index',
        ];
        $publicPaths = [
            '/',
            '/auth/redirect/google',
            '/auth/callback/google',
            '/politica-privacidade',
            '/termos-uso',
        ];

        // Inspeção de rotas e classificação de acesso
        $routesDump = [];
        foreach (RouteFacade::getRoutes() as $r) {
            /** @var \Illuminate\Routing\Route $r */
            $name = $r->getName();
            $uri = '/' . ltrim($r->uri(), '/');
            $methods = array_values(array_filter($r->methods(), fn ($m) => $m !== 'HEAD'));
            $middleware = $r->gatherMiddleware();

            $access = 'public';
            $mwStr = implode('|', $middleware);
            $mwLower = strtolower($mwStr);

            if (str_contains($mwLower, 'role:admin')) {
                $access = 'admin';
            } elseif (str_contains($mwLower, 'role:moderador')) {
                $access = 'moderador+admin';
            } elseif (!in_array($name, $publicRouteNames, true) && !in_array($uri, $publicPaths, true)) {
                // Por padrão, tudo é autenticado exceto a whitelist acima
                $access = 'auth';
            }

            $routesDump[] = [
                'name' => $name,
                'uri' => $uri,
                'methods' => $methods,
                'middleware' => array_values($middleware),
                'access' => $access,
            ];
        }

        // Funcionalidades curadas por domínio com atalhos visuais
        $functionalities = [
            [
                'title' => 'Dashboard Administrativo',
                'description' => 'Visão geral de gestão. Disponível para moderadores e administradores.',
                'access' => ['moderador', 'admin'],
                'shortcuts' => [ ['label' => 'Admin > Dashboard', 'href' => '/admin/dashboard'] ],
                'routes' => [ ['method' => 'GET', 'path' => '/admin/dashboard', 'name' => 'admin.dashboard'] ],
            ],
            [
                'title' => 'Gestão de Usuários',
                'description' => 'Listar, editar, bloquear e desbloquear usuários.',
                'access' => ['moderador', 'admin'],
                'shortcuts' => [ ['label' => 'Admin > Usuários', 'href' => '/admin/usuarios'] ],
                'routes' => [
                    ['method' => 'GET', 'path' => '/admin/usuarios', 'name' => 'admin.users.index'],
                    ['method' => 'GET', 'path' => '/admin/usuarios/{user}/editar', 'name' => 'admin.users.edit'],
                    ['method' => 'PUT', 'path' => '/admin/usuarios/{user}', 'name' => 'admin.users.update'],
                    ['method' => 'PUT', 'path' => '/admin/usuarios/{user}/bloquear', 'name' => 'admin.users.block'],
                    ['method' => 'PUT', 'path' => '/admin/usuarios/{user}/desbloquear', 'name' => 'admin.users.unblock'],
                ],
            ],
            [
                'title' => 'Jogos (CRUD)',
                'description' => 'Criar, editar, listar e remover jogos; captura de dados.',
                'access' => ['moderador', 'admin'],
                'shortcuts' => [ ['label' => 'Admin > Jogos', 'href' => '/admin/jogos'] ],
                'routes' => [
                    ['method' => 'GET', 'path' => '/admin/jogos', 'name' => 'admin.games.index'],
                    ['method' => 'GET', 'path' => '/admin/jogos/novo', 'name' => 'admin.games.create'],
                    ['method' => 'POST', 'path' => '/admin/jogos', 'name' => 'admin.games.store'],
                    ['method' => 'GET', 'path' => '/admin/jogos/{game}/editar', 'name' => 'admin.games.edit'],
                    ['method' => 'POST', 'path' => '/admin/jogos/capturar', 'name' => 'admin.games.capture'],
                    ['method' => 'PUT', 'path' => '/admin/jogos/{game}', 'name' => 'admin.games.update'],
                    ['method' => 'DELETE', 'path' => '/admin/jogos/{game}', 'name' => 'admin.games.destroy'],
                ],
            ],
            [
                'title' => 'Estúdios (CRUD)',
                'description' => 'Gerenciar estúdios de desenvolvimento.',
                'access' => ['moderador', 'admin'],
                'shortcuts' => [ ['label' => 'Admin > Estúdios', 'href' => '/admin/estudios'] ],
                'routes' => [
                    ['method' => 'GET', 'path' => '/admin/estudios', 'name' => 'admin.studios.index'],
                    ['method' => 'GET', 'path' => '/admin/estudios/novo', 'name' => 'admin.studios.create'],
                    ['method' => 'POST', 'path' => '/admin/estudios', 'name' => 'admin.studios.store'],
                    ['method' => 'GET', 'path' => '/admin/estudios/{studio}/editar', 'name' => 'admin.studios.edit'],
                    ['method' => 'PUT', 'path' => '/admin/estudios/{studio}', 'name' => 'admin.studios.update'],
                    ['method' => 'DELETE', 'path' => '/admin/estudios/{studio}', 'name' => 'admin.studios.destroy'],
                ],
            ],
            [
                'title' => 'Plataformas (CRUD)',
                'description' => 'Gerenciar plataformas de jogos.',
                'access' => ['moderador', 'admin'],
                'shortcuts' => [ ['label' => 'Admin > Plataformas', 'href' => '/admin/plataformas'] ],
                'routes' => [
                    ['method' => 'GET', 'path' => '/admin/plataformas', 'name' => 'admin.platforms.index'],
                    ['method' => 'GET', 'path' => '/admin/plataformas/novo', 'name' => 'admin.platforms.create'],
                    ['method' => 'POST', 'path' => '/admin/plataformas', 'name' => 'admin.platforms.store'],
                    ['method' => 'GET', 'path' => '/admin/plataformas/{platform}/editar', 'name' => 'admin.platforms.edit'],
                    ['method' => 'PUT', 'path' => '/admin/plataformas/{platform}', 'name' => 'admin.platforms.update'],
                    ['method' => 'DELETE', 'path' => '/admin/plataformas/{platform}', 'name' => 'admin.platforms.destroy'],
                ],
            ],
            [
                'title' => 'Marcadores/Tags (CRUD)',
                'description' => 'Gerenciar marcadores do catálogo.',
                'access' => ['moderador', 'admin'],
                'shortcuts' => [ ['label' => 'Admin > Marcadores', 'href' => '/admin/marcadores'] ],
                'routes' => [
                    ['method' => 'GET', 'path' => '/admin/marcadores', 'name' => 'admin.tags.index'],
                    ['method' => 'GET', 'path' => '/admin/marcadores/novo', 'name' => 'admin.tags.create'],
                    ['method' => 'POST', 'path' => '/admin/marcadores', 'name' => 'admin.tags.store'],
                    ['method' => 'GET', 'path' => '/admin/marcadores/{tag}/editar', 'name' => 'admin.tags.edit'],
                    ['method' => 'PUT', 'path' => '/admin/marcadores/{tag}', 'name' => 'admin.tags.update'],
                    ['method' => 'DELETE', 'path' => '/admin/marcadores/{tag}', 'name' => 'admin.tags.destroy'],
                ],
            ],
            [
                'title' => 'Configuração do Site',
                'description' => 'Configurações institucionais, redes sociais e logs do sistema.',
                'access' => ['admin'],
                'shortcuts' => [ ['label' => 'Admin > Configuração', 'href' => '/admin/configuracao'] ],
                'routes' => [
                    ['method' => 'GET', 'path' => '/admin/configuracao', 'name' => 'admin.config.index'],
                    ['method' => 'PUT', 'path' => '/admin/configuracao', 'name' => 'admin.config.update'],
                ],
            ],
            [
                'title' => 'Diagnóstico do Servidor',
                'description' => 'Levantamento de ambiente, limites de upload e extensões.',
                'access' => ['admin'],
                'shortcuts' => [ ['label' => 'Admin > Diagnóstico', 'href' => '/admin/diagnostico'] ],
                'routes' => [ ['method' => 'GET', 'path' => '/admin/diagnostico', 'name' => 'admin.diagnostics.index'] ],
            ],
            [
                'title' => 'Solicitações de Jogos',
                'description' => 'Usuário pode criar/editar solicitações de jogos. Liberação é moderada.',
                'access' => ['auth'],
                'shortcuts' => [ ['label' => 'Opções > Solicitações', 'href' => '/opcoes'] ],
                'routes' => [
                    ['method' => 'GET', 'path' => '/opcoes/solicitacoes/novo', 'name' => 'options.requests.create'],
                    ['method' => 'POST', 'path' => '/opcoes/solicitacoes', 'name' => 'options.requests.store'],
                    ['method' => 'GET', 'path' => '/opcoes/solicitacoes/{game}/editar', 'name' => 'options.requests.edit'],
                    ['method' => 'PUT', 'path' => '/opcoes/solicitacoes/{game}', 'name' => 'options.requests.update'],
                    ['method' => 'DELETE', 'path' => '/opcoes/solicitacoes/{game}', 'name' => 'options.requests.destroy'],
                    ['method' => 'PUT', 'path' => '/opcoes/solicitacoes/{game}/liberar', 'name' => 'options.requests.release (moderador/admin)'],
                ],
            ],
            [
                'title' => 'Comentários da Comunidade',
                'description' => 'Listagem pública. Avaliar requer login. Exclusão apenas moderador/admin.',
                'access' => ['public', 'auth', 'moderador', 'admin'],
                'shortcuts' => [ ['label' => 'Página do Jogo', 'href' => '/jogos/{game}/comentarios'] ],
                'routes' => [
                    ['method' => 'GET', 'path' => '/jogos/{game}/comentarios', 'name' => 'games.comments.index (público)'],
                    ['method' => 'POST', 'path' => '/jogos/{game}/comentarios/{commentUser}/nota', 'name' => 'games.comments.rate (autenticado)'],
                    ['method' => 'DELETE', 'path' => '/jogos/{game}/comentarios/{commentUser}', 'name' => 'games.comments.destroy (moderador/admin)'],
                ],
            ],
            [
                'title' => 'Perfil e Currículo',
                'description' => 'Atualização de perfil e visualização de currículo.',
                'access' => ['auth'],
                'shortcuts' => [
                    ['label' => 'Menu > Perfil', 'href' => '/perfil'],
                    ['label' => 'Menu > Meu Currículo', 'href' => '/meu-curriculo'],
                ],
                'routes' => [
                    ['method' => 'GET', 'path' => '/perfil', 'name' => 'profile.index'],
                    ['method' => 'PUT', 'path' => '/perfil', 'name' => 'profile.update'],
                    ['method' => 'GET', 'path' => '/meu-curriculo', 'name' => 'curriculum.index'],
                    ['method' => 'GET', 'path' => '/curriculo/{user}', 'name' => 'curriculum.show (público)'],
                ],
            ],
            [
                'title' => 'Jogos – Ações do Usuário',
                'description' => 'Visualizar jogo, salvar informações pessoais e atualizar status por plataforma.',
                'access' => ['auth'],
                'shortcuts' => [ ['label' => 'Cards > Jogo', 'href' => '/jogos/{game}'] ],
                'routes' => [
                    ['method' => 'GET', 'path' => '/jogos/{game}', 'name' => 'games.show'],
                    ['method' => 'POST', 'path' => '/jogos/{game}/minhas-informacoes', 'name' => 'games.mine.save'],
                    ['method' => 'POST', 'path' => '/jogos/{game}/plataformas/{platform}/status', 'name' => 'games.platform.status'],
                ],
            ],
        ];

        $roles = [
            [
                'key' => 'admin',
                'title' => 'Administrador',
                'description' => 'Acesso total ao painel administrativo, configurações e diagnósticos. Define políticas, mantém dados e supervisiona a moderação.',
            ],
            [
                'key' => 'moderador',
                'title' => 'Moderador',
                'description' => 'Gerencia conteúdo (jogos, estúdios, plataformas, marcadores) e usuários. Não acessa configurações do site nem diagnósticos.',
            ],
            [
                'key' => 'user',
                'title' => 'Usuário Comum',
                'description' => 'Acessa e interage com jogos, gerencia seu perfil, currículo e solicitações. Sujeito a bloqueios e rate limits.',
            ],
        ];

        return Inertia::render('Admin/Manual', [
            'generatedAt' => $generatedAt,
            'roles' => $roles,
            'functionalities' => $functionalities,
            'routesDump' => $routesDump,
            'notes' => [
                'always_update' => 'Este manual reflete rotas e permissões no momento da geração. Atualize sempre que houver mudanças.',
            ],
        ]);
    }
}

