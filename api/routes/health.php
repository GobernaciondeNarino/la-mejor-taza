<?php
defined('LMT_GUARD') || exit('forbidden');
use LMT\Db;
use LMT\Response;

function register_routes_health(\LMT\Router $r): void
{
    // GET /api/health — diagnóstico público (sin secretos).
    // Útil para verificar rápidamente que mod_rewrite, PHP y la BD están bien.
    $r->get('/health', function () {
        $info = [
            'ok'           => true,
            'php'          => PHP_VERSION,
            'argon2id'     => defined('PASSWORD_ARGON2ID'),
            'db_driver'    => null,
            'db_reachable' => false,
            'stands'       => null,
            'votos'        => null,
            'request_uri'  => $_SERVER['REQUEST_URI']  ?? null,
            'script_name'  => $_SERVER['SCRIPT_NAME']  ?? null,
            'https'        => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        ];
        try {
            $pdo = Db::pdo();
            $info['db_driver'] = $pdo->getAttribute(\PDO::ATTR_DRIVER_NAME);
            $info['db_reachable'] = true;
            $info['stands'] = (int) $pdo->query('SELECT COUNT(*) FROM stands')->fetchColumn();
            $info['votos']  = (int) $pdo->query('SELECT COUNT(*) FROM votos')->fetchColumn();
        } catch (\Throwable $e) {
            $info['db_error'] = 'unreachable';
        }
        Response::ok($info);
    });
}
