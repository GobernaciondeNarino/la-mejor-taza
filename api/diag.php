<?php
// api/diag.php — diagnóstico independiente del front controller.
// NO carga el router ni la sesión; sólo prueba uno por uno los componentes
// para que sepas EXACTAMENTE dónde está el 500 cuando /api/index.php falla.
//
// Uso: visita https://tu-sitio/lamejortaza/api/diag.php
// Devuelve un JSON con el estado de PHP, extensiones, config, conexión a la
// BD y carga de cada lib/route. Una vez localizado el problema, BORRA este
// archivo (no es seguro dejarlo en producción a largo plazo).

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

// Mostramos errores aquí porque es el archivo de diagnóstico.
ini_set('display_errors', '0');
error_reporting(E_ALL);

$out = [
    'php_version'     => PHP_VERSION,
    'php_sapi'        => PHP_SAPI,
    'argon2id'        => defined('PASSWORD_ARGON2ID'),
    'extensions'      => [
        'pdo'         => extension_loaded('pdo'),
        'pdo_mysql'   => extension_loaded('pdo_mysql'),
        'pdo_sqlite'  => extension_loaded('pdo_sqlite'),
        'mbstring'    => extension_loaded('mbstring'),
        'json'        => extension_loaded('json'),
        'session'     => extension_loaded('session'),
        'intl'        => extension_loaded('intl'),
    ],
    'request' => [
        'request_uri' => $_SERVER['REQUEST_URI'] ?? null,
        'script_name' => $_SERVER['SCRIPT_NAME'] ?? null,
        'https'       => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ],
    'config_exists'   => is_file(__DIR__ . '/config.php'),
    'config_readable' => is_readable(__DIR__ . '/config.php'),
];

// Intentar cargar el config sin reventar el endpoint.
$cfg = null;
if ($out['config_exists'] && $out['config_readable']) {
    try {
        if (!defined('LMT_GUARD')) define('LMT_GUARD', true);
        $cfg = include __DIR__ . '/config.php';
        $out['config_load']    = is_array($cfg) ? 'ok' : 'invalid_return';
        $out['config_keys']    = is_array($cfg) ? array_keys($cfg) : [];
        $out['config_installed'] = is_array($cfg) ? !empty($cfg['installed']) : false;
        $out['config_debug_mode'] = is_array($cfg) ? !empty($cfg['debug']) : false;
        $out['config_force_https'] = is_array($cfg) ? !empty($cfg['force_https']) : false;
        if (is_array($cfg) && !empty($cfg['db']['dsn'])) {
            $dsn = (string) $cfg['db']['dsn'];
            $out['db_dsn_scheme']   = strtolower(explode(':', $dsn, 2)[0] ?? '');
            $out['db_dsn_redacted'] = preg_replace('/(password|pwd)=[^;]+/i', '$1=REDACTED', $dsn);
        }
    } catch (\Throwable $e) {
        $out['config_load_error'] = $e->getMessage();
    }
}

// Probar conexión a BD si tenemos config.
if (is_array($cfg) && !empty($cfg['db']['dsn'])) {
    try {
        $pdo = new PDO($cfg['db']['dsn'], $cfg['db']['user'] ?? null, $cfg['db']['password'] ?? null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5,
        ]);
        $out['db_connect'] = 'ok';
        try {
            $out['db_stands_count'] = (int) $pdo->query('SELECT COUNT(*) FROM stands')->fetchColumn();
            $out['db_votos_count']  = (int) $pdo->query('SELECT COUNT(*) FROM votos')->fetchColumn();
            $out['db_admins_count'] = (int) $pdo->query('SELECT COUNT(*) FROM admins')->fetchColumn();
        } catch (\Throwable $e) {
            $out['db_query_error'] = $e->getMessage();
        }
    } catch (\Throwable $e) {
        $out['db_connect_error'] = $e->getMessage();
    }
}

// Probar carga de cada lib (cada uno por separado para localizar el fallo).
if (!defined('LMT_GUARD')) define('LMT_GUARD', true);
foreach (['Config', 'Response', 'Db', 'Session', 'Validate', 'Security', 'RateLimit', 'Router'] as $lib) {
    $f = __DIR__ . "/lib/$lib.php";
    $out['lib'][$lib] = !file_exists($f) ? 'missing' : (
        is_readable($f) ? null : 'unreadable'
    );
    if ($out['lib'][$lib] === null) {
        try {
            require_once $f;
            $out['lib'][$lib] = 'ok';
        } catch (\Throwable $e) {
            $out['lib'][$lib] = 'error: ' . $e->getMessage();
        }
    }
}

// Probar carga de cada route.
foreach (['health', 'auth', 'stands', 'votos', 'pasaportes', 'dashboard', 'exports'] as $r) {
    $f = __DIR__ . "/routes/$r.php";
    $out['route'][$r] = !file_exists($f) ? 'missing' : (
        is_readable($f) ? null : 'unreadable'
    );
    if ($out['route'][$r] === null) {
        try {
            require_once $f;
            $out['route'][$r] = 'ok';
        } catch (\Throwable $e) {
            $out['route'][$r] = 'error: ' . $e->getMessage();
        }
    }
}

// Probar Session::start() — un sospechoso común de 500.
try {
    if (class_exists('\\LMT\\Session')) {
        \LMT\Config::load(__DIR__ . '/config.php');
        \LMT\Session::start();
        $out['session_start'] = 'ok';
    }
} catch (\Throwable $e) {
    $out['session_start_error'] = $e->getMessage();
}

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
