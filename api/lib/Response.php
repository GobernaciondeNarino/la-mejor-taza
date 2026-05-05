<?php
namespace LMT;
defined('LMT_GUARD') || exit('forbidden');

final class Response
{
    public static function json($data, int $status = 200): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store, no-cache, must-revalidate');
        header('Pragma: no-cache');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function ok($data = null): void
    {
        self::json(['ok' => true, 'data' => $data], 200);
    }

    public static function error(int $status, string $code, ?string $message = null): void
    {
        self::json([
            'ok' => false,
            'error' => $code,
            'message' => $message,
        ], $status);
    }
}
