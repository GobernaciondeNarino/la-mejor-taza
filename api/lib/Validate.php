<?php
namespace LMT;

final class Validate
{
    public static function email(?string $value): ?string
    {
        if ($value === null) return null;
        $value = trim(strtolower($value));
        if (strlen($value) < 5 || strlen($value) > 254) return null;
        if (!filter_var($value, FILTER_VALIDATE_EMAIL)) return null;
        // Doble chequeo con regex conservadora
        if (!preg_match('/^[a-z0-9._%+\-]{1,64}@[a-z0-9.\-]{1,253}\.[a-z]{2,}$/i', $value)) return null;
        return $value;
    }

    public static function standId(?string $value): ?string
    {
        if ($value === null) return null;
        $value = trim($value);
        if (!preg_match('/^[a-z0-9\-]{2,32}$/', $value)) return null;
        return $value;
    }

    public static function emoji(?string $value): ?string
    {
        if ($value === null) return null;
        return in_array($value, ['bueno', 'regular', 'malo'], true) ? $value : null;
    }

    /** Sanitiza texto libre: NFC, sin caracteres de control, longitud máxima. */
    public static function comment(?string $value, int $max = 500): string
    {
        if ($value === null) return '';
        if (function_exists('Normalizer::normalize')) {
            $value = \Normalizer::normalize($value, \Normalizer::FORM_C) ?: $value;
        }
        // Eliminar caracteres de control salvo \n y \t
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '';
        $value = preg_replace('/\s+/u', ' ', $value) ?? '';
        $value = trim($value);
        if (mb_strlen($value, 'UTF-8') > $max) {
            $value = mb_substr($value, 0, $max, 'UTF-8');
        }
        return $value;
    }

    public static function bool($value): ?bool
    {
        if (is_bool($value)) return $value;
        if ($value === 1 || $value === '1' || $value === 'true') return true;
        if ($value === 0 || $value === '0' || $value === 'false') return false;
        return null;
    }

    public static function maskEmail(string $email): string
    {
        if (!self::email($email)) return '';
        [$user, $domain] = explode('@', $email);
        $head = mb_substr($user, 0, min(2, mb_strlen($user)));
        return $head . str_repeat('*', max(1, mb_strlen($user) - mb_strlen($head))) . '@' . $domain;
    }
}
