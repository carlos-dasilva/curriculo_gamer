<?php

namespace App\Domain\Home\Http\Controllers;

use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

class HomeController extends Controller
{
    public function index()
    {
        // Controller fino: apenas monta props e delega renderização ao Inertia
        $sites = [
            [
                'name' => 'Laravel',
                'path' => 'http://192.168.0.100/laravel-projeto/',
                'category' => 'Desenvolvimento',
                'description' => 'Sites criados com Laravel',
            ],
            [
                'name' => 'PhpMyAdmin',
                'path' => 'http://192.168.0.100/phpmyadmin',
                'category' => 'Desenvolvimento',
                'description' => 'Base de Dados MariaDB',
            ],
            [
                'name' => 'Bilhar',
                'path' => 'sites/_Bilhar',
                'category' => 'Entretenimento',
                'description' => 'Placar para o Jogo de bilhar',
            ],
            [
                'name' => 'Tabuada',
                'path' => 'sites/_tabuada',
                'category' => 'Educação',
                'description' => 'Aprenda e pratique tabuada',
            ],
            [
                'name' => 'GTCom',
                'path' => 'sites/GTCom',
                'category' => 'Negócios',
                'description' => 'Site da empresa GTCom',
            ],
            [
                'name' => 'PAI do IGOR',
                'path' => 'sites/PAIdoIGOR',
                'category' => 'Pessoal',
                'description' => 'Página pessoal do Igor',
            ],
            [
                'name' => 'QueliStore',
                'path' => 'sites/QueliStore',
                'category' => 'Comércio',
                'description' => 'Loja online QueliStore',
            ],
            [
                'name' => 'Site Matemática',
                'path' => 'sites/SiteMatematica',
                'category' => 'Educação',
                'description' => 'Recursos matemáticos',
            ],
            [
                'name' => 'Consulta CEP',
                'path' => 'sites/Uteis/ConsultaCep.html',
                'category' => 'Utilitários',
                'description' => 'Consulte CEPs rapidamente',
            ],
            [
                'name' => 'Desligar Servidor',
                'path' => 'sites/Uteis/DesligarServidor.html',
                'category' => 'Utilitários',
                'description' => 'Controle de servidores',
            ],
            [
                'name' => 'Falar Texto',
                'path' => 'sites/Uteis/falarTexto.html',
                'category' => 'Utilitários',
                'description' => 'Conversor de texto em voz',
            ],
            [
                'name' => 'Inverter Texto',
                'path' => 'sites/Uteis/InverterTexto.html',
                'category' => 'Utilitários',
                'description' => 'Ferramenta para inverter textos',
            ],
            [
                'name' => 'Tempo',
                'path' => 'sites/Uteis/Tempo.html',
                'category' => 'Utilitários',
                'description' => 'Previsão do tempo em tempo real',
            ],
            [
                'name' => 'TOP 10 Spotify',
                'path' => 'sites/Uteis/TOP10Spotify.html',
                'category' => 'Música',
                'description' => 'Top músicas do Spotify',
            ],
            [
                'name' => 'Treinar JavaScript',
                'path' => 'sites/Uteis/TreinarJavascript.html',
                'category' => 'Programação',
                'description' => 'Pratique JavaScript',
            ],
        ];

        return Inertia::render('Home/Index', [
            'sites' => $sites,
        ]);
    }
}
