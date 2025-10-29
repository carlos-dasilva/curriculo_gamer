<!DOCTYPE html>
<html lang="pt-BR">
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <link rel="icon" type="image/png" href="/img/favicon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <title inertia>{{ config('app.name', 'Aplicação') }}</title>
        @inertiaHead
        @env('testing')
            
        @else
            @viteReactRefresh
            @vite(['resources/css/app.css','resources/js/app.tsx'])
        @endenv
    </head>
    <body class="min-h-screen bg-gray-50 text-gray-900">
        @inertia
    </body>
    </html>

