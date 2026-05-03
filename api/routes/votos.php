<?php
use LMT\Db;
use LMT\Response;
use LMT\Validate;
use LMT\Security;
use LMT\RateLimit;

function register_routes_votos(\LMT\Router $r): void
{
    // Últimos N votos para el feed live.
    $r->get('/votos', function () {
        $limit = isset($_GET['limit']) ? max(1, min(50, (int)$_GET['limit'])) : 20;
        $stmt = Db::pdo()->prepare(
            'SELECT v.stand_id, v.emoji, v.texto, v.compra, v.correo, v.created_at,
                    s.nombre AS stand_nombre, s.municipio AS stand_municipio
             FROM votos v
             LEFT JOIN stands s ON s.id = v.stand_id
             ORDER BY v.created_at DESC
             LIMIT :lim'
        );
        $stmt->bindValue(':lim', $limit, \PDO::PARAM_INT);
        $stmt->execute();
        $rows = $stmt->fetchAll();

        $items = array_map(function ($v) {
            return [
                'stand'  => $v['stand_id'],
                'emoji'  => $v['emoji'],
                'texto'  => $v['texto'] ?? '',
                'compra' => $v['compra'] !== null ? (bool)$v['compra'] : null,
                'autor'  => Validate::maskEmail((string)$v['correo']),
                'hora'   => relative_time($v['created_at']),
                'nombre' => $v['stand_nombre'] ?? null,
                'municipio' => $v['stand_municipio'] ?? null,
            ];
        }, $rows);
        Response::ok($items);
    });

    // Crear voto. Anónimo, pero con CSRF + rate limit + dedupe.
    $r->post('/votos', function () {
        $b = Security::jsonBody();

        $stand  = Validate::standId($b['stand'] ?? null);
        $emoji  = Validate::emoji($b['emoji']  ?? null);
        $correo = Validate::email($b['correo'] ?? null);
        $compra = Validate::bool($b['compra']  ?? null);
        $texto  = Validate::comment($b['texto'] ?? '', 500);

        if (!$stand)  Response::error(422, 'stand_invalido');
        if (!$emoji)  Response::error(422, 'emoji_invalido');
        if (!$correo) Response::error(422, 'correo_invalido');

        // Rate limits combinados
        $ip = RateLimit::ipHash();
        if (!RateLimit::hit('vote', $ip . '|' . $stand)) {
            Response::error(429, 'rate_limited');
        }
        if (!RateLimit::hit('vote_email', hash('sha256', $correo))) {
            Response::error(429, 'rate_limited');
        }

        // Verificar que el stand exista
        $check = Db::pdo()->prepare('SELECT 1 FROM stands WHERE id = :id');
        $check->execute([':id' => $stand]);
        if (!$check->fetchColumn()) Response::error(404, 'stand_no_existe');

        // Insertar voto + actualizar agregados + upsert pasaporte en una transacción.
        try {
            \LMT\Db::tx(function (\PDO $pdo) use ($stand, $emoji, $correo, $compra, $texto) {
                $insVoto = $pdo->prepare(
                    'INSERT INTO votos (stand_id, emoji, correo, compra, texto, ip_hash, created_at)
                     VALUES (:s, :e, :c, :compra, :t, :ip, CURRENT_TIMESTAMP)'
                );
                $insVoto->execute([
                    ':s'      => $stand,
                    ':e'      => $emoji,
                    ':c'      => $correo,
                    ':compra' => $compra === null ? null : ($compra ? 1 : 0),
                    ':t'      => $texto !== '' ? $texto : null,
                    ':ip'     => RateLimit::ipHash(),
                ]);

                $col = ['bueno' => 'votos_bueno', 'regular' => 'votos_regular', 'malo' => 'votos_malo'][$emoji];
                $pdo->prepare("UPDATE stands SET $col = $col + 1 WHERE id = :s")
                    ->execute([':s' => $stand]);

                // Upsert pasaporte
                $driver = $pdo->getAttribute(\PDO::ATTR_DRIVER_NAME);
                if ($driver === 'mysql') {
                    $pdo->prepare(
                        "INSERT INTO pasaportes (correo, visitados, inicio)
                         VALUES (:c, JSON_ARRAY(:s), CURRENT_TIMESTAMP)
                         ON DUPLICATE KEY UPDATE
                           visitados = IF(JSON_CONTAINS(visitados, JSON_QUOTE(:s2)),
                                          visitados,
                                          JSON_ARRAY_APPEND(visitados, '$', :s3))"
                    )->execute([':c' => $correo, ':s' => $stand, ':s2' => $stand, ':s3' => $stand]);
                } else {
                    // SQLite / fallback
                    $sel = $pdo->prepare('SELECT visitados FROM pasaportes WHERE correo = :c');
                    $sel->execute([':c' => $correo]);
                    $row = $sel->fetch();
                    if (!$row) {
                        $pdo->prepare('INSERT INTO pasaportes (correo, visitados, inicio) VALUES (:c, :v, CURRENT_TIMESTAMP)')
                            ->execute([':c' => $correo, ':v' => json_encode([$stand], JSON_UNESCAPED_UNICODE)]);
                    } else {
                        $list = json_decode((string)$row['visitados'], true) ?: [];
                        if (!in_array($stand, $list, true)) $list[] = $stand;
                        $pdo->prepare('UPDATE pasaportes SET visitados = :v WHERE correo = :c')
                            ->execute([':v' => json_encode($list, JSON_UNESCAPED_UNICODE), ':c' => $correo]);
                    }
                }
            });
        } catch (\PDOException $e) {
            // Único índice (stand_id, correo) -> ya votó.
            $sqlState = $e->getCode();
            if ($sqlState === '23000' || str_contains((string)$e->getMessage(), 'UNIQUE')) {
                Response::error(409, 'ya_votaste');
            }
            throw $e;
        }

        Response::ok(null);
    });
}

function relative_time($createdAt): string
{
    $ts = is_numeric($createdAt) ? (int)$createdAt : strtotime((string)$createdAt);
    if (!$ts) return '';
    $d = max(0, time() - $ts);
    if ($d < 60) return "hace {$d}s";
    if ($d < 3600) return 'hace ' . intdiv($d, 60) . ' min';
    if ($d < 86400) return 'hace ' . intdiv($d, 3600) . ' h';
    return 'hace ' . intdiv($d, 86400) . ' d';
}
