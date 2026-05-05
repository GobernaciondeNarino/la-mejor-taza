<?php
// db/create-admin.php
// Crea (o actualiza) un administrador en la tabla `admins`.
// Uso (desde la raíz del proyecto):
//   php db/create-admin.php admin@lamejortaza.co 'ContraseñaSuperSegura'
//
// El hash usa Argon2id + pepper de api/config.php. Nunca pongas la contraseña
// en un fichero o en el historial del shell en producción: prefiere `read -s`.

declare(strict_types=1);
if (!defined('LMT_GUARD')) define('LMT_GUARD', true);

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "Sólo CLI.\n"); exit(1);
}
if ($argc < 3) {
    fwrite(STDERR, "Uso: php db/create-admin.php <email> <password>\n"); exit(1);
}

require __DIR__ . '/../api/lib/Config.php';
require __DIR__ . '/../api/lib/Response.php';
require __DIR__ . '/../api/lib/Db.php';
require __DIR__ . '/../api/lib/Validate.php';
require __DIR__ . '/../api/lib/Security.php';

\LMT\Config::load(__DIR__ . '/../api/config.php');

$email = \LMT\Validate::email($argv[1]);
$pwd   = (string) $argv[2];
if (!$email)               { fwrite(STDERR, "Email inválido\n"); exit(1); }
if (strlen($pwd) < 12)     { fwrite(STDERR, "Mínimo 12 caracteres\n"); exit(1); }

$hash = \LMT\Security::hashPassword($pwd);
$pdo = \LMT\Db::pdo();
$driver = $pdo->getAttribute(\PDO::ATTR_DRIVER_NAME);
if ($driver === 'mysql') {
    $pdo->prepare(
        'INSERT INTO admins (email, password_hash, is_admin) VALUES (:e, :h, 1)
         ON DUPLICATE KEY UPDATE password_hash = :h2, is_admin = 1'
    )->execute([':e' => $email, ':h' => $hash, ':h2' => $hash]);
} else {
    $pdo->prepare(
        'INSERT INTO admins (email, password_hash, is_admin) VALUES (:e, :h, 1)
         ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, is_admin = 1'
    )->execute([':e' => $email, ':h' => $hash]);
}
echo "Administrador listo: {$email}\n";
