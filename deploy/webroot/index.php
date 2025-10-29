<?php
define('LARAVEL_START', microtime(true));
require __DIR__.'/../curriculogamer/vendor/autoload.php';
$app = require __DIR__.'/../curriculogamer/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $kernel->handle(
    $request = Illuminate\Http\Request::capture()
)->send();
$kernel->terminate($request, $response);

