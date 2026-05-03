<?php
use LMT\Db;
use LMT\Response;
use LMT\Validate;
use LMT\Security;
use LMT\Session;
use LMT\RateLimit;

function register_routes_auth(\LMT\Router $r): void
{
    // Datos del usuario actual + token CSRF (lo necesita el frontend antes de hacer POST).
    $r->get('/auth/me', function () {
        $user = Session::user();
        Response::ok([
            'user' => $user,
            'csrf' => Session::csrfToken(),
        ]);
    });

    $r->post('/auth/login', function () {
        if (!RateLimit::hit('login', RateLimit::ipHash())) {
            Response::error(429, 'rate_limited');
        }

        $body  = Security::jsonBody();
        $email = Validate::email($body['email'] ?? null);
        $pwd   = $body['password'] ?? '';
        if (!$email || !is_string($pwd) || strlen($pwd) < 8 || strlen($pwd) > 128) {
            // Tiempo constante artificial para no filtrar existencia.
            usleep(random_int(150000, 350000));
            Response::error(401, 'invalid_credentials');
        }

        $stmt = Db::pdo()->prepare('SELECT id, email, password_hash, is_admin FROM admins WHERE email = :e LIMIT 1');
        $stmt->execute([':e' => $email]);
        $row = $stmt->fetch();

        // Verificar siempre algo (mitiga timing).
        $hash = $row['password_hash'] ?? '$2y$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
        if (!Security::verifyPassword($pwd, $hash) || !$row) {
            usleep(random_int(150000, 350000));
            Response::error(401, 'invalid_credentials');
        }

        Session::login((int)$row['id'], (string)$row['email'], (bool)$row['is_admin']);
        Response::ok([
            'user' => Session::user(),
            'csrf' => Session::csrfToken(),
        ]);
    });

    $r->post('/auth/logout', function () {
        Session::destroy();
        Response::ok(null);
    });
}
