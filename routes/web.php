<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Domain\Home\Http\Controllers\HomeController;
use App\Domain\Auth\Http\Controllers\GoogleAuthController;
use App\Domain\Profile\Http\Controllers\ProfileController;
use App\Domain\Users\Http\Controllers\UserManagementController;
use App\Domain\Dashboard\Http\Controllers\DashboardController;
use App\Domain\Diagnostics\Http\Controllers\DiagnosticsController;
use App\Domain\Settings\Http\Controllers\ConfigController;
use App\Domain\Legal\Http\Controllers\PrivacyController;
use App\Domain\Legal\Http\Controllers\TermsController;
use App\Domain\Studios\Http\Controllers\StudioController;
use App\Domain\Platforms\Http\Controllers\PlatformController;
use App\Domain\Tags\Http\Controllers\TagController;
use App\Domain\Games\Http\Controllers\GameController as GamesController;
use App\Domain\Games\Http\Controllers\PublicGameController;
use App\Domain\Games\Http\Controllers\UserGameInfoController;
use App\Domain\Games\Http\Controllers\GameProgressController;
use App\Domain\Games\Http\Controllers\CurriculumController;
use App\Domain\Users\Http\Controllers\FollowController;
use App\Domain\Profile\Http\Controllers\OptionsController;

// Rota Home (Inertia)
Route::get('/', [HomeController::class, 'index'])->name('home');

// Política de Privacidade (pública)
Route::get('/politica-privacidade', [PrivacyController::class, 'index'])->name('privacy');

// Termos de Uso (pública)
Route::get('/termos-uso', [TermsController::class, 'index'])->name('terms');

// Página pública de jogo (apenas liberados)
Route::get('/jogos/{game}', [PublicGameController::class, 'show'])->name('games.show');
Route::middleware('auth')->post('/jogos/{game}/minhas-informacoes', [UserGameInfoController::class, 'save'])->name('games.mine.save');
Route::middleware('auth')->post('/jogos/{game}/plataformas/{platform}/status', [GameProgressController::class, 'update'])->name('games.platform.status');

// Autenticação Google OAuth2 (Socialite)
Route::get('/auth/redirect/google', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
Route::get('/auth/callback/google', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');

// Logout via POST para evitar CSRF via GET
Route::post('/logout', function () {
    Auth::logout();
    request()->session()->invalidate();
    request()->session()->regenerateToken();
    return redirect()->route('home');
})->name('logout');

// Perfil do usuário (somente autenticado)
Route::middleware('auth')->group(function () {
    Route::get('/perfil', [ProfileController::class, 'index'])->name('profile.index');
    Route::put('/perfil', [ProfileController::class, 'update'])->name('profile.update');
});

// Opções (menu lateral para usuário)
Route::middleware('auth')->get('/opcoes', [OptionsController::class, 'index'])->name('options.index');

// Meu Currículo (somente autenticado)
Route::middleware('auth')->get('/meu-curriculo', [CurriculumController::class, 'index'])->name('curriculum.index');
// Currículo de outro usuário (somente autenticado)
Route::middleware('auth')->get('/curriculo/{user}', [CurriculumController::class, 'show'])->whereNumber('user')->name('curriculum.show');

// Seguir/Deixar de seguir usuário (somente autenticado)
Route::middleware('auth')->post('/usuarios/{user}/seguir', [FollowController::class, 'follow'])->name('users.follow');
Route::middleware('auth')->delete('/usuarios/{user}/seguir', [FollowController::class, 'unfollow'])->name('users.unfollow');

// Gestão de usuários (apenas moderador e admin)
Route::middleware(['auth','role:moderador,admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/usuarios', [UserManagementController::class, 'index'])->name('users.index');
    Route::get('/usuarios/{user}/editar', [UserManagementController::class, 'edit'])->name('users.edit');
    Route::put('/usuarios/{user}', [UserManagementController::class, 'update'])->name('users.update');

    // Estúdios (moderador e admin)
    Route::get('/estudios', [StudioController::class, 'index'])->name('studios.index');
    Route::get('/estudios/novo', [StudioController::class, 'create'])->name('studios.create');
    Route::post('/estudios', [StudioController::class, 'store'])->name('studios.store');
    Route::get('/estudios/{studio}/editar', [StudioController::class, 'edit'])->name('studios.edit');
    Route::put('/estudios/{studio}', [StudioController::class, 'update'])->name('studios.update');
    Route::delete('/estudios/{studio}', [StudioController::class, 'destroy'])->name('studios.destroy');

    // Plataformas (moderador e admin)
    Route::get('/plataformas', [PlatformController::class, 'index'])->name('platforms.index');
    Route::get('/plataformas/novo', [PlatformController::class, 'create'])->name('platforms.create');
    Route::post('/plataformas', [PlatformController::class, 'store'])->name('platforms.store');
    Route::get('/plataformas/{platform}/editar', [PlatformController::class, 'edit'])->name('platforms.edit');
    Route::put('/plataformas/{platform}', [PlatformController::class, 'update'])->name('platforms.update');
    Route::delete('/plataformas/{platform}', [PlatformController::class, 'destroy'])->name('platforms.destroy');

    // Marcadores (moderador e admin)
    Route::get('/marcadores', [TagController::class, 'index'])->name('tags.index');
    Route::get('/marcadores/novo', [TagController::class, 'create'])->name('tags.create');
    Route::post('/marcadores', [TagController::class, 'store'])->name('tags.store');
    Route::get('/marcadores/{tag}/editar', [TagController::class, 'edit'])->name('tags.edit');
    Route::put('/marcadores/{tag}', [TagController::class, 'update'])->name('tags.update');
    Route::delete('/marcadores/{tag}', [TagController::class, 'destroy'])->name('tags.destroy');

    // Jogos (moderador e admin)
    Route::get('/jogos', [GamesController::class, 'index'])->name('games.index');
    Route::get('/jogos/novo', [GamesController::class, 'create'])->name('games.create');
    Route::post('/jogos', [GamesController::class, 'store'])->name('games.store');
    Route::get('/jogos/{game}/editar', [GamesController::class, 'edit'])->name('games.edit');
    Route::put('/jogos/{game}', [GamesController::class, 'update'])->name('games.update');
    Route::delete('/jogos/{game}', [GamesController::class, 'destroy'])->name('games.destroy');

    // Diagnóstico detalhado do servidor (somente admin)
    Route::get('/diagnostico', [DiagnosticsController::class, 'index'])
        ->name('diagnostics.index')
        ->middleware('role:admin');

    // Configuração do site (somente admin)
    Route::get('/configuracao', [ConfigController::class, 'index'])
        ->name('config.index')
        ->middleware('role:admin');
    Route::put('/configuracao', [ConfigController::class, 'update'])
        ->name('config.update')
        ->middleware('role:admin');
});
