<?php
namespace LMT;
defined('LMT_GUARD') || exit('forbidden');

use PDO;

final class RateLimit
{
    /**
     * Rate limit por (clave, ventana). Devuelve true si la solicitud es permitida.
     * Implementación: contador en DB con ventana fija. Suficiente para feria/POS.
     */
    public static function hit(string $bucket, string $subject): bool
    {
        $cfg = Config::get('rate_limits', []);
        $rule = $cfg[$bucket] ?? null;
        if (!$rule) return true;

        $window = (int)$rule['window'];
        $max    = (int)$rule['max'];
        $now    = time();
        $key    = hash('sha256', $bucket . '|' . $subject);

        $pdo = Db::pdo();

        try {
            // Reset si la ventana expiró.
            $stmt = $pdo->prepare('SELECT hits, window_start FROM rate_limits WHERE id = :id');
            $stmt->execute([':id' => $key]);
            $row = $stmt->fetch();

            if (!$row) {
                $ins = $pdo->prepare('INSERT INTO rate_limits (id, bucket, hits, window_start) VALUES (:id, :b, 1, :ws)');
                $ins->execute([':id' => $key, ':b' => $bucket, ':ws' => $now]);
                return true;
            }

            $start = (int)$row['window_start'];
            $hits  = (int)$row['hits'];

            if ($now - $start >= $window) {
                $upd = $pdo->prepare('UPDATE rate_limits SET hits = 1, window_start = :ws WHERE id = :id');
                $upd->execute([':ws' => $now, ':id' => $key]);
                return true;
            }
            if ($hits >= $max) {
                return false;
            }
            $upd = $pdo->prepare('UPDATE rate_limits SET hits = hits + 1 WHERE id = :id');
            $upd->execute([':id' => $key]);
            return true;
        } catch (\Throwable $e) {
            // Falla abierta sólo en debug; en producción cierra (deniega) para no exponer.
            error_log('[lmt][ratelimit] ' . $e->getMessage());
            return Config::debug();
        }
    }

    public static function ipHash(): string
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        return hash_hmac('sha256', $ip, (string) Config::get('app_secret', ''));
    }
}
