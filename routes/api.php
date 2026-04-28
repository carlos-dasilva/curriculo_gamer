<?php

use App\Domain\Games\Http\Controllers\Api\GameSyncController;
use Illuminate\Support\Facades\Route;

Route::prefix('sync')
    ->middleware(['sync.token'])
    ->group(function () {
        Route::get('/ping', [GameSyncController::class, 'ping'])->name('api.sync.ping');
        Route::get('/tags-catalog', [GameSyncController::class, 'tagsCatalog'])->name('api.sync.tags_catalog');
        Route::get('/next-game', [GameSyncController::class, 'next'])->name('api.sync.next');
        Route::get('/games/rawg/{rawgId}', [GameSyncController::class, 'rawg'])
            ->whereNumber('rawgId')
            ->name('api.sync.rawg');
        Route::post('/games', [GameSyncController::class, 'store'])->name('api.sync.store');
        Route::post('/games/{game}', [GameSyncController::class, 'update'])
            ->whereNumber('game')
            ->name('api.sync.update');
    });
