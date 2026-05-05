<?php
defined('LMT_GUARD') || exit('forbidden');
// api/config.example.php
// Copia a `config.php` y rellena los valores. `config.php` está en .gitignore.

return [
    // Base de datos: MySQL/MariaDB recomendado en producción.
    // Para desarrollo rápido puedes usar SQLite con DSN sqlite:/ruta/db.sqlite
    'db' => [
        'dsn'      => 'mysql:host=127.0.0.1;dbname=la_mejor_taza;charset=utf8mb4',
        'user'     => 'lmt_app',
        'password' => 'CAMBIAR_EN_PRODUCCION',
        // Para SQLite descomentar y comentar las anteriores:
        // 'dsn'      => 'sqlite:' . __DIR__ . '/../db/la-mejor-taza.sqlite',
        // 'user'     => null,
        // 'password' => null,
    ],

    // Pimienta para hashes adicionales (NUNCA cambiar en caliente sin migrar).
    // Genera con: php -r "echo bin2hex(random_bytes(32));"
    'pepper' => 'CAMBIAR_POR_64_HEX_CARACTERES',

    // Secret para HMAC de tokens y CSRF cuando no hay sesión.
    'app_secret' => 'CAMBIAR_POR_64_HEX_CARACTERES',

    // Cookie / sesión.
    'session' => [
        'name'     => 'lmt_sid',
        'lifetime' => 60 * 60 * 8,   // 8 horas
        'secure'   => true,           // requiere HTTPS en producción
        'samesite' => 'Strict',
        'path'     => '/',
        'domain'   => '',             // dejar vacío = host actual
    ],

    // Origen permitido (para chequeo de Origin/Referer en POST/PUT/DELETE).
    // Lista blanca; usa el dominio real en producción.
    'allowed_origins' => [
        'https://lamejortaza.co',
        'https://la-mejor-taza.web.app',
        'http://localhost:8000',
        'http://127.0.0.1:8000',
    ],

    // Rate limits por IP (segundos / max hits).
    'rate_limits' => [
        'login'      => ['window' => 600, 'max' => 5],   // 5 intentos / 10 min
        'vote'       => ['window' => 60,  'max' => 1],   // 1 voto / min / IP / stand
        'vote_email' => ['window' => 600, 'max' => 12],  // 12 votos / 10 min / correo
        'global'     => ['window' => 60,  'max' => 120], // anti-flood
    ],

    // Forzar HTTPS (envía 301 a https://). Apaga si haces dev local sin TLS.
    'force_https' => false,

    // Modo debug (NUNCA true en producción).
    'debug' => false,
];
