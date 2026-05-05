<?php
// router.php — para desarrollo con `php -S 127.0.0.1:8000 router.php`.
// En producción, Apache + .htaccess hace lo mismo.

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';

// 1) Bloquear acceso directo a config y librerías
if (preg_match('#^/api/(config|lib/|routes/)#', $path)) {
    http_response_code(403);
    exit('forbidden');
}

// 2) Si no hay api/config.php, redirige al asistente (excepto para /api/* e /install.php)
if (!is_file(__DIR__ . '/api/config.php')
    && $path !== '/install.php'
    && strpos($path, '/api') !== 0) {
    if (!is_file(__DIR__ . $path)) {
        header('Location: /install.php', true, 302);
        exit;
    }
}

// 3) /api/... → front controller
if (strpos($path, '/api') === 0) {
    require __DIR__ . '/api/index.php';
    return true;
}

// 4) Rutas de la SPA → app.php
$spaRoute = (
    $path === '/' ||
    $path === '/app.php' ||
    preg_match('#^/s/[a-z0-9\-]{2,32}/?$#', $path) ||
    preg_match('#^/admin(/.*)?$#', $path) ||
    preg_match('#^/festival/[a-z0-9\-]+/?$#', $path) ||
    $path === '/pasaporte' || $path === '/pasaporte/'
);
if ($spaRoute) {
    require __DIR__ . '/app.php';
    return true;
}

// 5) Archivo estático
$file = __DIR__ . $path;
if (is_file($file)) return false;

http_response_code(404);
echo 'not found';
