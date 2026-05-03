<?php
// router.php — sólo para desarrollo con `php -S 127.0.0.1:8000 router.php`.
// En producción usa Apache + .htaccess o el bloque Nginx del README.

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';

// 1) Bloquear acceso directo a config y librerías
if (preg_match('#^/api/(config|lib/|routes/)#', $path)) {
    http_response_code(403);
    exit('forbidden');
}

// 2) Cualquier ruta /api/... la maneja el front controller PHP.
if (strpos($path, '/api') === 0) {
    require __DIR__ . '/api/index.php';
    return true;
}

// 3) Rewrites para la SPA: / y /s/{id}
if ($path === '/' || preg_match('#^/s/[a-z0-9\-]{2,32}/?$#', $path)) {
    require __DIR__ . '/La Mejor Taza.html';
    return true;
}

// 4) Servir archivo estático si existe
$file = __DIR__ . $path;
if (is_file($file)) {
    return false; // dejar que el servidor integrado sirva el archivo
}

http_response_code(404);
echo 'not found';
