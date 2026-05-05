<?php
namespace LMT;
defined('LMT_GUARD') || exit('forbidden');

final class Security
{
    /** Aplica cabeceras de seguridad a toda respuesta de la API. */
    public static function applyHeaders(): void
    {
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()');
        if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
        }
        if (Config::get('force_https') && (empty($_SERVER['HTTPS']) || $_SERVER['HTTPS'] === 'off')) {
            $url = 'https://' . ($_SERVER['HTTP_HOST'] ?? '') . ($_SERVER['REQUEST_URI'] ?? '/');
            header('Location: ' . $url, true, 301);
            exit;
        }
    }

    /** Devuelve el cuerpo JSON decodificado o array vacío. */
    public static function jsonBody(): array
    {
        $raw = file_get_contents('php://input') ?: '';
        if ($raw === '') return [];
        if (strlen($raw) > 65536) Response::error(413, 'payload_too_large');
        $data = json_decode($raw, true, 8);
        if (!is_array($data) || json_last_error() !== JSON_ERROR_NONE) {
            Response::error(400, 'bad_json');
        }
        return $data;
    }

    /**
     * En métodos no seguros exige:
     *  - Origin/Referer dentro de la lista blanca
     *  - Header X-CSRF-Token igual al token de sesión
     */
    /**
     * Normaliza una URL al "origin" (esquema://host[:puerto]) usado por el
     * navegador en el header Origin.
     */
    private static function originOf(string $url): string
    {
        $u = parse_url(trim($url));
        if (!$u || empty($u['scheme']) || empty($u['host'])) return rtrim($url, '/');
        $o = strtolower($u['scheme']) . '://' . strtolower($u['host']);
        if (!empty($u['port'])) $o .= ':' . $u['port'];
        return $o;
    }

    public static function requireCsrfAndOrigin(): void
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) return;

        $allowed = (array) Config::get('allowed_origins', []);
        $allowedOrigins = array_map([self::class, 'originOf'], $allowed);

        $origin  = $_SERVER['HTTP_ORIGIN']  ?? '';
        $referer = $_SERVER['HTTP_REFERER'] ?? '';

        $ok = false;
        if ($origin !== '') {
            $oNorm = self::originOf($origin);
            $ok = in_array($oNorm, $allowedOrigins, true);
        }
        // Fallback Referer: chequea por prefijo contra la URL completa permitida.
        if (!$ok && $referer !== '') {
            $rNorm = self::originOf($referer);
            $ok = in_array($rNorm, $allowedOrigins, true);
            if (!$ok) {
                foreach ($allowed as $a) {
                    if (stripos($referer, rtrim($a, '/')) === 0) { $ok = true; break; }
                }
            }
        }
        if (!$ok) Response::error(403, 'origin_not_allowed');

        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        if (!Session::checkCsrf($token)) {
            Response::error(403, 'csrf_invalid');
        }
    }

    public static function requireAdmin(): void
    {
        if (!Session::isAdmin()) Response::error(401, 'unauthorized');
    }

    public static function hashPassword(string $plain): string
    {
        $pepper = (string) Config::get('pepper', '');
        $hmac = hash_hmac('sha256', $plain, $pepper, true);
        if (defined('PASSWORD_ARGON2ID')) {
            return password_hash(base64_encode($hmac), PASSWORD_ARGON2ID, [
                'memory_cost' => 65536,
                'time_cost'   => 4,
                'threads'     => 2,
            ]);
        }
        return password_hash(base64_encode($hmac), PASSWORD_BCRYPT, ['cost' => 12]);
    }

    public static function verifyPassword(string $plain, string $hash): bool
    {
        $pepper = (string) Config::get('pepper', '');
        $hmac = hash_hmac('sha256', $plain, $pepper, true);
        return password_verify(base64_encode($hmac), $hash);
    }

    public static function constantTimeEquals(string $a, string $b): bool
    {
        return hash_equals($a, $b);
    }
}
