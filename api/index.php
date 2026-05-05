<?php
declare(strict_types=1);

// Marca de "entrada legítima" — todos los archivos sensibles (config, lib,
// routes) chequean esta constante y abortan si están siendo accedidos
// directamente. Defensa en profundidad por si .htaccess es ignorado.
if (!defined('LMT_GUARD')) define('LMT_GUARD', true);

// Front controller — no exponer detalles de errores al cliente.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

require __DIR__ . '/lib/Config.php';
require __DIR__ . '/lib/Response.php';
require __DIR__ . '/lib/Db.php';
require __DIR__ . '/lib/Session.php';
require __DIR__ . '/lib/Validate.php';
require __DIR__ . '/lib/RateLimit.php';
require __DIR__ . '/lib/Security.php';
require __DIR__ . '/lib/Router.php';

use LMT\Config;
use LMT\Response;
use LMT\Security;
use LMT\Session;
use LMT\Router;

set_exception_handler(function (\Throwable $e) {
    error_log('[lmt][unhandled] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
    if (!headers_sent()) Response::error(500, 'internal_error', Config::debug() ? $e->getMessage() : null);
    else exit;
});
set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) return false;
    throw new \ErrorException($message, 0, $severity, $file, $line);
});

Config::load(__DIR__ . '/config.php');
Security::applyHeaders();
Session::start();

// Anti-flood global por IP
if (!\LMT\RateLimit::hit('global', \LMT\RateLimit::ipHash())) {
    Response::error(429, 'rate_limited');
}

// CSRF/Origin para métodos no seguros
Security::requireCsrfAndOrigin();

// Calcular path interno con múltiples estrategias (en orden de preferencia):
//   1. ?path=...           — el cliente lo manda explícito (no requiere mod_rewrite).
//   2. PATH_INFO            — Apache lo expone si visitan /api/index.php/auth/me.
//   3. REQUEST_URI parsing  — funciona cuando hay rewrites activos.
$path = '/';
if (isset($_GET['path']) && is_string($_GET['path']) && $_GET['path'] !== '') {
    $path = '/' . trim($_GET['path'], '/');
} elseif (!empty($_SERVER['PATH_INFO'])) {
    $path = '/' . trim((string) $_SERVER['PATH_INFO'], '/');
} else {
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/api/index.php'));
    $scriptDir = '/' . trim($scriptDir, '/');
    $stripped = $uri;
    if ($scriptDir !== '/' && strpos($stripped, $scriptDir) === 0) {
        $stripped = substr($stripped, strlen($scriptDir));
    } elseif (($pos = strrpos($stripped, '/api/')) !== false) {
        $stripped = substr($stripped, $pos + 4);
    } elseif (substr($stripped, -4) === '/api') {
        $stripped = '';
    }
    $stripped = '/' . trim((string) $stripped, '/');
    if ($stripped !== '/' && $stripped !== '/index.php') {
        $path = $stripped;
    }
}

$router = new Router();
require __DIR__ . '/routes/health.php';
require __DIR__ . '/routes/auth.php';
require __DIR__ . '/routes/stands.php';
require __DIR__ . '/routes/votos.php';
require __DIR__ . '/routes/pasaportes.php';
require __DIR__ . '/routes/dashboard.php';
require __DIR__ . '/routes/exports.php';

\register_routes_health($router);
\register_routes_auth($router);
\register_routes_stands($router);
\register_routes_votos($router);
\register_routes_pasaportes($router);
\register_routes_dashboard($router);
\register_routes_exports($router);

$router->dispatch($_SERVER['REQUEST_METHOD'] ?? 'GET', $path);
