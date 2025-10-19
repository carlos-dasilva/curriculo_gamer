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

// Rota Home (Inertia)
Route::get('/', [HomeController::class, 'index'])->name('home');

// Política de Privacidade (pública)
Route::get('/politica-privacidade', [PrivacyController::class, 'index'])->name('privacy');

// Termos de Uso (pública)
Route::get('/termos-uso', [TermsController::class, 'index'])->name('terms');

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

// Gestão de usuários (apenas moderador e admin)
Route::middleware(['auth','role:moderador,admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/usuarios', [UserManagementController::class, 'index'])->name('users.index');
    Route::get('/usuarios/{user}/editar', [UserManagementController::class, 'edit'])->name('users.edit');
    Route::put('/usuarios/{user}', [UserManagementController::class, 'update'])->name('users.update');

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
