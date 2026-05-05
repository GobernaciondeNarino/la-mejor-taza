<?php
namespace LMT;
defined('LMT_GUARD') || exit('forbidden');

final class Session
{
    public static function start(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) return;

        $cfg = Config::get('session', []);
        $secure = !empty($cfg['secure']) || (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');

        session_name($cfg['name'] ?? 'lmt_sid');
        session_set_cookie_params([
            'lifetime' => (int)($cfg['lifetime'] ?? 28800),
            'path'     => $cfg['path'] ?? '/',
            'domain'   => $cfg['domain'] ?? '',
            'secure'   => $secure,
            'httponly' => true,
            'samesite' => $cfg['samesite'] ?? 'Strict',
        ]);
        // Endurecer (algunas directivas están deprecadas a partir de PHP 8.4)
        @ini_set('session.use_strict_mode', '1');
        @ini_set('session.use_only_cookies', '1');
        @ini_set('session.cookie_httponly', '1');
        @ini_set('session.use_trans_sid', '0');
        if (PHP_VERSION_ID < 80400) {
            @ini_set('session.sid_length', '64');
            @ini_set('session.sid_bits_per_character', '6');
        }

        session_start();

        // Detección básica de fijación: bind a UA + IP-prefix.
        $fp = self::fingerprint();
        if (empty($_SESSION['_fp'])) {
            $_SESSION['_fp'] = $fp;
        } elseif (!hash_equals($_SESSION['_fp'], $fp)) {
            self::destroy();
            session_start();
            $_SESSION['_fp'] = $fp;
        }

        // Rotación periódica del id (cada 30 min) para mitigar robo de cookie.
        $now = time();
        if (empty($_SESSION['_rotated_at']) || $now - (int)$_SESSION['_rotated_at'] > 1800) {
            session_regenerate_id(true);
            $_SESSION['_rotated_at'] = $now;
        }
    }

    public static function login(int $userId, string $email, bool $admin): void
    {
        session_regenerate_id(true);
        $_SESSION['_uid']     = $userId;
        $_SESSION['_email']   = $email;
        $_SESSION['_admin']   = $admin;
        $_SESSION['_login_at']= time();
        $_SESSION['_csrf']    = bin2hex(random_bytes(32));
    }

    public static function destroy(): void
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 3600,
                $params['path'], $params['domain'],
                $params['secure'], $params['httponly']
            );
        }
        session_destroy();
    }

    public static function user(): ?array
    {
        if (empty($_SESSION['_uid'])) return null;
        return [
            'id'    => (int)$_SESSION['_uid'],
            'email' => (string)$_SESSION['_email'],
            'admin' => !empty($_SESSION['_admin']),
        ];
    }

    public static function isAdmin(): bool
    {
        return !empty($_SESSION['_admin']);
    }

    public static function csrfToken(): string
    {
        if (empty($_SESSION['_csrf'])) {
            $_SESSION['_csrf'] = bin2hex(random_bytes(32));
        }
        return $_SESSION['_csrf'];
    }

    public static function checkCsrf(?string $sent): bool
    {
        if ($sent === null || $sent === '') return false;
        $expected = $_SESSION['_csrf'] ?? '';
        return $expected !== '' && hash_equals($expected, $sent);
    }

    private static function fingerprint(): string
    {
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';
        // Usar sólo prefijo de IP para tolerar NAT móviles
        $prefix = '';
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $parts = explode('.', $ip); array_pop($parts);
            $prefix = implode('.', $parts);
        } else {
            $prefix = substr($ip, 0, strrpos($ip, ':') ?: strlen($ip));
        }
        $secret = (string) Config::get('app_secret', '');
        return hash_hmac('sha256', $ua . '|' . $prefix, $secret);
    }
}
