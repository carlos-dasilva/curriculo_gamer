# Mapeamento da Aplicação Currículo Gamer

## Stack e Build
- Backend: Laravel 12 (PHP >= 8.2), Inertia, Socialite (Google); queue/cache/session em DB; sqlite como default.
- Front: React 18 + Vite 7 + Tailwind v4 (tokens em `resources/css/_brand.css`); SPA Inertia.
- Execução: `composer install && npm install && npm run dev` ou `composer run setup` / `composer run dev` (usa concurrently com artisan serve/queue/pail/vite).
- Entrada Vite: `resources/js/app.tsx`; CSS em `resources/css/app.css`.

## Layouts / Design System
- Layout principal Inertia: `resources/views/app.blade.php` (favicon, csrf, vite). `resources/js/components/layouts/AppLayout.tsx` centraliza `<Head>` SEO (OG/Twitter/JSON-LD) e usa Header/Footer.
- Header/Footer: `resources/js/components/ui/Header.tsx` e `Footer.tsx` (fallback de imagens, links sociais de share `site`). Cores/fontes em `resources/css/_brand.css`; ajustes globais em `app.css` (font Instrument Sans via bunny, bloqueio overflow-x mobile).
- Componentes UI: Button, Input, Pagination, Cards, GameCards, GameTitle etc.

## Domínios (HTTP Controllers)
- Autenticação: `App\Domain\Auth\Http\Controllers\GoogleAuthController` (OAuth2 Google, cria usuário comum, atualiza avatar, bloqueio). Middlewares: `RequireAuthentication`, `RedirectGuestsToGoogle`, `HandleInertiaRequests`, `EnsureRole`.
- Home: `HomeController@index` lista jogos liberados com filtros q/sub/dub.
- Jogos públicos: `PublicGameController@show` (gate: liberado ou criador/moderador/admin para avaliação; inativo redireciona para Home). Carrega estúdio, plataformas, tags, galeria, links, minhas infos/status.
- Progressos: `UserGameInfoController` (salva nota/dificuldade/horas/anotações); `GameProgressController` (status por plataforma e remove do backlog quando há transição para Finalizei/Fiz 100%). Backlog: `BacklogController` adiciona/remove jogos, lista `/meu-backlog` editável, expõe `/backlog/{user}` público somente leitura e reordena prioridades. Comentários: `GameCommentsController` (listar/notas/delete moderador/admin).
- Solicitações (usuário comum): `SolicitationController` CRUD jogos em avaliação, captura via RAWG, liberar (moderador/admin). Rotas `/opcoes/solicitacoes`.
- Catálogo Admin: `Admin\GameController` (CRUD completo + capture/captureById, removeImage). `PlatformController`, `StudioController`, `TagController` CRUD. Import jobs via RAWG (`ImportGameByRawgId`, `ImportPlatformGamesFromRawg`).
- Usuários Admin: `UserManagementController` (list/edit/block/unblock), request `UserUpdateRequest` com regras por papel. Follow/unfollow em `FollowController`.
- Perfil/Opções: `ProfileController`, `OptionsController` (meu resumo, seguindo, solicitações de jogos e cronologias), `CurriculumController` (meu currículo + show de outro usuário, agregações por status/plataforma, filtros q/sub/dub, agora jogando e aba de cronologias).
- Cronologias: `ChronologyController` permite criar/editar cronologias em avaliação em `/opcoes/cronologias`, aprovar via admin, listar em `/admin/cronologias` e visualizar progresso no currículo. `ChronologyProgressService` calcula conclusão por etapa: remakes/jogos equivalentes na mesma etapa contam como uma parte concluída quando ao menos um jogo está com status Finalizei ou Fiz 100%.
- Legal: `TermsController`, `PrivacyController`; páginas `resources/js/pages/Legal/*.tsx` usam datas de `config/legal.php`.
- Config/Admin: `ConfigController` (SiteSetting: contato, sociais, logs enable), `DiagnosticsController` (ambiente PHP, limites ini, temp dirs, storage, comandos de setup), `ManualController` (gera manual com rotas e perfis).

## Middlewares e Providers
- `bootstrap/app.php` adiciona HandleInertiaRequests e RedirectGuestsToGoogle ao grupo web e exige auth por padrão via `RequireAuthentication` (whitelist: home/auth/privacy/terms/curriculum.show/games.comments.index). Aliases: auth, role.
- `MiddlewareServiceProvider` injeta `SystemRequestLogger` no grupo web (log condicional por SiteSetting.system_logs_enabled).

## Modelos-chave
- /admin/jogos: ordenação padrão por cadastro mais recente; seletor por nome A–Z/Z–A, cadastro antigo, atualização recente e notas geral/Metacritic (crítica e usuários) crescentes/decrescentes. Valores ausentes ficam no fim, desempate por ID, com filtros e ordenação preservados na paginação.
- User (enum Role: comum/moderador/admin; avatar_url; is_blocked), Game (soft delete, tags, plataformas pivot release_date, imagens, links, scores), Chronology, ChronologyStep, ChronologyStepGame, Platform (rawg_id, cover_url), Tag, Studio, SiteSetting (redes sociais, logs), UserFollow, UserGameInfo, UserGamePlatformStatus, UserGameBacklog, UserGameCommentRating.

## Dados e Migrações
- Migrações em `database/migrations` (games, platforms, studios, tags, pivots, chronologies/chronology_steps/chronology_step_games, user follows, status, infos, backlog com posição, comment ratings, site_settings com socials/logs, rawg_id em games/plataformas, cover_url em plataformas, avatar/blocked/currently_playing legado em users, hours_to_finish em games etc.). Queue/cache/session usam tabelas padrão (jobs, cache, sessions). Rawg_id em games não é único (migração 2025_11_09_000100 remove unique).

## Coleção
- Área privada em `/minha-colecao`, integrada ao Header (desktop e menu compacto). Usa Laravel/Inertia, as três migrations `2026_09_15_*` e componentes em `resources/js/components/collection`, sem alterar colunas das tabelas existentes.
- Itens: `user_collection_consoles`, `user_collection_games` e `user_collection_accessories`, models `UserCollectionConsole`, `UserCollectionGame` e `UserCollectionAccessory`. Relações em User: `collectionConsoles`, `collectionGames`, `collectionAccessories`. Consoles e jogos admitem cópias repetidas; acessórios possuem quantidade com default 1 e compatibilidade N:N em `user_collection_accessory_platform`.
- Itens têm proprietário obrigatório, status referenciado, aquisição, valor decimal, observações, timestamps e soft delete. `user_id` não é fillable e é rejeitado no payload; o servidor usa o usuário autenticado. Detalhe/edição/gravação/exclusão consultam o proprietário, retornando 404 para IDs de outro usuário.
- Consoles usam `platforms`; jogos usam `games` e a plataforma específica da cópia. A relação da cópia com Game inclui jogos removidos logicamente para preservar o histórico do inventário. Nome, descrição e capa do catálogo não são copiados.
- `collection_companies` registra fabricantes/ecossistemas. `collection_platform_companies` associa no máximo uma empresa a cada plataforma; acesso em Platform por `collectionCompanyMapping.company`. O fabricante do acessório é uma relação independente. Nenhuma associação é inferida automaticamente a partir de `platforms.manufacturer`; o campo legado permanece intacto.
- Catálogos expansíveis: regiões, originalidades, edições, estados funcionais, tipos/classificações de acessórios, formas de aquisição, serviços, tipos de posse digital, status dos itens e lojas digitais. Lojas possuem URLs de logo/ícone/site e cor opcional.
- `CollectionCatalogSeeder`, chamado pelo DatabaseSeeder, adiciona classificações e lojas iniciais por slug com `firstOrCreate`, preservando nomes, ordem e desativações já editados. Não cria empresas nem altera plataformas, jogos ou usuários. O status inicial é `na-colecao`, resolvido pelo servidor.
- Imagens pessoais ficam em `user_collection_console_images`, `user_collection_game_images` e `user_collection_accessory_images`: URL, ordem, descrição e indicador principal, com FK real ao item. Os models ordenam por `sort_order` e ID. Nenhum mecanismo de upload ou download foi adicionado.
- Referências ao catálogo restringem exclusão física; exclusão do usuário remove seus itens e imagens. Exclusão lógica de um item preserva suas imagens. Exclusão física de um console desassocia acessórios sem apagá-los. PlatformController apresenta mensagem quando uma FK impede remover a plataforma. Cópias de jogos removidos logicamente continuam acessíveis e editáveis, preservando sua plataforma histórica.
- Valores em reais; `purchase_price` representa o total do grupo de acessórios, somado uma única vez no investimento. Valores não informados não equivalem a zero na contagem de itens com preço. Notas e flags opcionais preservam o estado não informado via null.
- `SaveCollectionItemRequest` valida notas 1–10, quantidade 1–1.000.000, aquisição não futura, valores não negativos com até duas casas decimais, classificações disponíveis e compatibilidade. Campos físicos/digitais incompatíveis e detalhes de caixa ausente são limpos no servidor. Um console associado ao acessório deve pertencer ao usuário e ter plataforma compatível.
- Imagens: máximo de 20 URLs por item, apenas HTTP(S), sem credenciais e sem endereços locais literais. `ExternalUrl` não resolve DNS nem baixa arquivos. `CollectionItemWriter` grava item/compatibilidade/imagens em transação, bloqueia o item em edições e define uma única principal (primeira imagem quando não escolhida). Fotos usam lazy loading, placeholder e referrer-policy sem referência.
- `CollectionController` atende dashboard, listas, detalhe e formulários em `/{kind}`, `/{kind}/novo`, `/{kind}/{item}` e `/{kind}/{item}/editar`, com POST/PUT/DELETE correspondentes; kinds permitidos: consoles, jogos e acessorios. `/buscar/games` pesquisa jogos liberados; `/buscar/consoles` pesquisa somente unidades do usuário; ambos limitam a 20 resultados.
- Páginas `Collection/{Dashboard,Index,Form,Show}.tsx`: cards responsivos, formulários em seções expansíveis, campos condicionais, galeria ordenável, imagem ampliada em dialog nativo, confirmação de exclusão e mensagens de validação. As páginas de Coleção e seus cadastros administrativos usam importação dinâmica em `app.tsx`, carregadas somente ao acessar.
- `CollectionQuery` centraliza filtros combinados, ordenação autorizada, paginação (24 registros), eager loading e estatísticas agregadas. Listagens não retornam galerias. Busca geral por nome e navegações por `?company_id=` / `?platform_id=` com resumos e seções de consoles, jogos e acessórios.
- Empresa do jogo vem da plataforma da cópia; empresa do acessório vem das plataformas compatíveis, independentemente do fabricante. Agrupamento por empresa usa registros distintos antes de somar quantidade, evitando duplicar um acessório compatível com duas plataformas da mesma empresa. Totais gerais contam cada grupo uma única vez.
- Completude calculada: CIB = mídia + caixa + manual; Com caixa = mídia + caixa sem manual confirmado; Loose = mídia sem caixa. Demais situações aparecem como sem mídia/completude não informada. Encartes e extras são independentes; jogos digitais não entram nesses totais.
- Administração em `/admin/colecao` (somente admin): criação/edição/ativação/desativação dos catálogos em `/cadastros/{catalog}` e associação explícita de empresas em `/plataformas`. Slugs são identidades estáveis após criar. Itens existentes podem manter classificações desativadas; novas seleções são bloqueadas.
- Acesso aos cadastros: administradores têm atalhos “Cadastros da coleção” e “Regiões” em Minha Coleção, além de “Regiões da coleção” no menu administrativo. No formulário de item, “Cadastrar região” abre outra aba; “Atualizar regiões” recarrega as opções sem descartar os campos preenchidos.
- Privacidade: nenhuma rota pública; respostas de leitura com Cache-Control private/no-store; layout noindex; SystemRequestLogger omite query/payload/corpo das respostas nas rotas `collection.*`, mantendo metadados operacionais.
- Testes em `CollectionSchemaTest`, `CollectionCatalogTest` e `CollectionFlowTest`: integridade estrutural, seeds, autorização, isolamento, validações, CRUD, imagens, transições físico/digital, compatibilidade, filtros, paginação, contagens e privacidade dos logs.
- Para ativar em um ambiente: aplicar migrations com `php artisan migrate`, popular auxiliares com `php artisan db:seed --class=CollectionCatalogSeeder` e gerar assets com `npm run build`. Em seguida cadastrar empresas e associar plataformas no admin. Migrations e seeds foram executados somente em SQLite isolado durante o desenvolvimento.
- Recursos explicitamente futuros permanecem fora desta entrega: coleção pública, wishlist, empréstimos, grupos/tags pessoais, QR Code e avaliação de mercado.
- Validação desta entrega: suíte completa com 38 testes/564 assertions aprovada em SQLite isolado; build de produção aprovado e Pint aprovado nos arquivos novos. Typecheck ainda aponta 14 erros anteriores em Admin/Config, Admin/Games/Create, Admin/Games/Edit e Games/Show, sem erros nos arquivos novos da Coleção.
- Limitações do ambiente: o MySQL local configurado recusou conexão, portanto migrations/seeder não foram aplicados ao banco da aplicação. Browser não disponibilizou navegador, impedindo validar interativamente mobile/tablet/desktop. Node 20.12.2 está abaixo da versão pedida pelo Vite instalado (20.19+ ou 22.12+), embora o build tenha concluído; o bundle principal existente permanece acima de 500 kB.

## RAWG Integração
- `App\Domain\Games\Services\RawgImporter` importa/upserta: preenche campos vazios, promove status em avaliação a liberado sem reativar inativos, sync tags/plataformas (normaliza Genesis/NES/SNES), cria studio/tag/platform se preciso, cria galeria. Jobs dispatch async. Uso em Admin e Solicitações via `/admin/jogos/capturar` e `/opcoes/solicitacoes/capturar`.

## Frontend (páginas principais)
- Home: `pages/Home/Index.tsx` (Hero, filtros server-side, GameCards, Pagination).
- Currículo: `pages/Curriculum/Index.tsx` (resumo por status/plataforma, filtros q/sub/dub, follow/unfollow, share link modal, banner “Jogando atualmente” vindo do topo do backlog, GameCards e modo Cronologias ordenado por porcentagem de conclusão).
- Cronologias: `pages/Chronologies/{Create,Edit,Show}.tsx` com formulário de etapas ordenadas, múltiplos jogos por etapa, aprovação admin e detalhe visual do progresso por jogador.
- Backlog: `pages/Backlog/Index.tsx` (lista priorizada do usuário; editável em `/meu-backlog` com arrastar, botões de prioridade e remoção; somente leitura em `/backlog/{user}`).
- Jogo: `pages/Games/Show.tsx` (hero com capa, badges PT-BR, notas, galeria modal com exclusão para admins, plataformas ordenadas, horas/dificuldade, links externos, minhas infos/status, comentários ajax).
- Opções: `pages/Options/Index.tsx` (tabs Perfil/Seguindo/Solicitações/Cronologias, resumo following, tabela solicitações com delete). Sidebar `OptionsSidebar.tsx`.
- Solicitações: `pages/Solicitations/{Create,Edit}.tsx` (form similar ao admin, sem external_links; captura RAWG; liberar botão na edição para moderador/admin).
- Admin: Dashboard, Jogos CRUD (`Admin/Games/*`) com status Em avaliação, Liberado e Inativo (inativos só aparecem na consulta administrativa), Cronologias (`Admin/Chronologies/Index.tsx`) para aprovação, Plataformas/Estúdios/Tags CRUD, Usuários list/edit, Config, Diagnostics, Manual, Admin Layout com sidebar e ações rápidas. Header/Footer neutros com botões brand-600.

## Rotas Web (principais)
- Públicas: `/` home, `/politica-privacidade`, `/termos-uso`, `/curriculo/{user}`, `/curriculo/{user}/cronologias/{chronology}`, `/backlog/{user}`, `/jogos/{game}/comentarios` (GET). OAuth: `/auth/redirect/google`, `/auth/callback/google`.
- Auth obrigatória: jogos `/jogos/{game}` etc., perfil `/perfil`, opções `/opcoes`, meu currículo `/meu-curriculo`, cronologias do próprio currículo `/meu-curriculo/cronologias/{chronology}`, meu backlog editável `/meu-backlog`, follow/unfollow, solicitações CRUD `/opcoes/solicitacoes/...`, cronologias CRUD `/opcoes/cronologias/...`, status/infos, admin `/admin` (dashboard, users, cronologias, jogos, estúdios, plataformas, marcadores, diagnósticos, config, manual). Logout via POST `/logout`.

## Segurança e Políticas
- `RequireAuthentication` força login Google (whitelist acima). Usuário bloqueado é desconectado. `EnsureRole` controla admin/mod. CSRF via meta token (axios). SystemRequestLogger condicionado a SiteSetting.system_logs_enabled. Logout POST.

## Config e Valores Importantes
- App name em `config/app.php` ainda com encoding incorreto (`Currículo`), ajustar quando possível.
- Cache driver database; queue database; session database. Mail log. Filesystem local/public (symlink storage). Vite HMR host `192-168-0-100.nip.io:5173`.

## Internacionalização
- Strings pt-BR em `resources/js/i18n/pt-BR/home.json` e roles.json. Comentários indicam traduções removidas no services.php.

## Testes
- Exemplos: `tests/Feature/ExampleTest.php` e `tests/Unit/ExampleTest.php` com RefreshDatabase.

## Pendências/Observações
- Diversos textos estavam com caracteres corrompidos; corrigir progressivamente.
- Galeria/ratings usam axios global (window.axios). Sem Redux/context.
- Logs RAWG usam key default hardcoded; mover para env depois.

## API de sincronização de jogos
- Campo `games.times_updated` (uint, default 0) para priorizar ordem de atualização.
- Autenticação: header `Authorization: Bearer {SYNC_API_TOKEN}` ou `X-Sync-Token`; token em env (`SYNC_API_TOKEN`), lido via `config/services.php`; middleware `sync.token` retorna 503 se não configurado e 401 se token inválido.
- Proteção: grupo `api` com throttle `sync-api` (30 req/min por token/IP).
- GET `/api/sync/ping`: healthcheck autenticado.
- GET `/api/sync/tags-catalog`: retorna `tags_catalog` oficial do banco (`id`, `name`, `slug`, `synonyms` básico) e regras para o prompt.
- GET `/api/sync/games/rawg/{rawgId}`: verifica se um jogo RAWG já existe; retorna `exists`, `rawg_id`, `deleted` e `data` serializado quando encontrado. Usado pelo n8n para pular jogos já cadastrados.
- POST `/api/sync/games`: cria um jogo novo a partir do payload enriquecido pelo n8n/IA. Aceita o mesmo formato do sync request, mas `id` é opcional e ignorado na criação porque o ID local é gerado pelo banco; `rawg_id` e `name` são obrigatórios. Retorna 201 com `data`; retorna 409 se o `rawg_id` já existir.
- GET `/api/sync/next-game`: ordena por menor `times_updated`, maior `overall_score`, maior `metacritic_metascore`, maior `metacritic_user_score`, nome A-Z; retorna JSON completo (studio, tags, plataformas com `release_date`, imagens ordenadas, links externos, notas, flags PT-BR, timestamps).
- POST `/api/sync/games/{id}`: valida payload (`SyncGameUpdateRequest`); atualiza campos principais e `studio`; sincroniza tags/plataformas criando se necessário; incrementa `times_updated`; imagens e links apenas adicionam novas URLs/labels, nunca alteram ou removem existentes.
- Respostas sempre JSON; transações para consistência; logs de sistema em `SystemLog` (`API.sync.next_game`, `API.sync.update_game`).
