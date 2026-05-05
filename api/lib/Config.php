<?php
namespace LMT;
defined('LMT_GUARD') || exit('forbidden');

final class Config
{
    private static ?array $cfg = null;

    public static function load(string $path): void
    {
        if (!is_readable($path)) {
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode(['error' => 'config_missing']);
            exit;
        }
        $cfg = require $path;
        if (!is_array($cfg)) {
            http_response_code(500);
            exit('invalid_config');
        }
        self::$cfg = $cfg;
    }

    /** @return mixed */
    public static function get(string $key, $default = null)
    {
        if (self::$cfg === null) {
            throw new \RuntimeException('Config no cargado');
        }
        return self::$cfg[$key] ?? $default;
    }

    public static function debug(): bool
    {
        return (bool) self::get('debug', false);
    }
}
