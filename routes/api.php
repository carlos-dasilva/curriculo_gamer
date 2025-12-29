<?php

use App\Domain\Games\Http\Controllers\Api\GameSyncController;
use Illuminate\Support\Facades\Route;

Route::prefix('sync')
    ->middleware(['sync.token'])
    ->group(function () {
                Route::get('/ping', [GameSyncController::class, 'ping'])->name('api.sync.ping');
Route::get('/next-game', [GameSyncController::class, 'next'])->name('api.sync.next');
        Route::post('/games/{game}', [GameSyncController::class, 'update'])
            ->whereNumber('game')
            ->name('api.sync.update');
    });
