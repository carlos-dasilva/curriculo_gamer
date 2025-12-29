<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('sync-api', function (Request $request) {
            $token = $request->bearerToken() ?: $request->header('X-Sync-Token');
            return [
                Limit::perMinute(30)->by($token ?: $request->ip()),
            ];
        });
    }
}
