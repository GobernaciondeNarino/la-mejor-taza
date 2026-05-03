<?php
use LMT\Db;
use LMT\Response;
use LMT\Validate;
use LMT\Security;

function register_routes_stands(\LMT\Router $r): void
{
    $r->get('/stands', function () {
        $rows = Db::pdo()->query(
            'SELECT id, nombre, municipio, region, direccion, correo, descripcion,
                    coords_x, coords_y, color, votos_bueno, votos_regular, votos_malo
             FROM stands ORDER BY id'
        )->fetchAll();
        $list = array_map(fn($s) => stand_row_to_api($s), $rows);
        Response::ok($list);
    });

    $r->get('/stands/:id', function (array $p) {
        $id = Validate::standId($p['id'] ?? null);
        if (!$id) Response::error(400, 'bad_id');
        $stmt = Db::pdo()->prepare(
            'SELECT id, nombre, municipio, region, direccion, correo, descripcion,
                    coords_x, coords_y, color, votos_bueno, votos_regular, votos_malo
             FROM stands WHERE id = :id'
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        if (!$row) Response::error(404, 'not_found');
        Response::ok(stand_row_to_api($row));
    });

    $r->post('/stands', function () {
        Security::requireAdmin();
        $b = Security::jsonBody();
        $stand = stand_payload($b, true);
        $stmt = Db::pdo()->prepare(
            'INSERT INTO stands (id, nombre, municipio, region, direccion, correo, descripcion,
                                 coords_x, coords_y, color)
             VALUES (:id, :nombre, :municipio, :region, :direccion, :correo, :descripcion,
                     :cx, :cy, :color)'
        );
        $stmt->execute([
            ':id'          => $stand['id'],
            ':nombre'      => $stand['nombre'],
            ':municipio'   => $stand['municipio'],
            ':region'      => $stand['region'],
            ':direccion'   => $stand['direccion'],
            ':correo'      => $stand['correo'],
            ':descripcion' => $stand['descripcion'],
            ':cx'          => $stand['coords_x'],
            ':cy'          => $stand['coords_y'],
            ':color'       => $stand['color'],
        ]);
        Response::ok(['id' => $stand['id']]);
    });

    $r->put('/stands/:id', function (array $p) {
        Security::requireAdmin();
        $id = Validate::standId($p['id'] ?? null);
        if (!$id) Response::error(400, 'bad_id');
        $b = Security::jsonBody();
        $stand = stand_payload($b, false);
        $stmt = Db::pdo()->prepare(
            'UPDATE stands SET nombre=:nombre, municipio=:municipio, region=:region,
                                direccion=:direccion, correo=:correo, descripcion=:descripcion,
                                coords_x=:cx, coords_y=:cy, color=:color
             WHERE id=:id'
        );
        $stmt->execute([
            ':nombre'      => $stand['nombre'],
            ':municipio'   => $stand['municipio'],
            ':region'      => $stand['region'],
            ':direccion'   => $stand['direccion'],
            ':correo'      => $stand['correo'],
            ':descripcion' => $stand['descripcion'],
            ':cx'          => $stand['coords_x'],
            ':cy'          => $stand['coords_y'],
            ':color'       => $stand['color'],
            ':id'          => $id,
        ]);
        Response::ok(null);
    });

    $r->delete('/stands/:id', function (array $p) {
        Security::requireAdmin();
        $id = Validate::standId($p['id'] ?? null);
        if (!$id) Response::error(400, 'bad_id');
        $stmt = Db::pdo()->prepare('DELETE FROM stands WHERE id=:id');
        $stmt->execute([':id' => $id]);
        Response::ok(null);
    });
}

function stand_row_to_api(array $r): array
{
    return [
        'id'          => $r['id'],
        'nombre'      => $r['nombre'],
        'municipio'   => $r['municipio'],
        'region'      => $r['region'] ?? '',
        'direccion'   => $r['direccion'] ?? '',
        'correo'      => $r['correo'] ?? '',
        'descripcion' => $r['descripcion'] ?? '',
        'coords'      => [
            'x' => isset($r['coords_x']) ? (float)$r['coords_x'] : 0.5,
            'y' => isset($r['coords_y']) ? (float)$r['coords_y'] : 0.5,
        ],
        'color'       => $r['color'] ?? 'oklch(0.45 0.1 40)',
        'votos'       => [
            'bueno'   => (int)($r['votos_bueno']   ?? 0),
            'regular' => (int)($r['votos_regular'] ?? 0),
            'malo'    => (int)($r['votos_malo']    ?? 0),
        ],
    ];
}

function stand_payload(array $b, bool $needsId): array
{
    $id = $needsId ? Validate::standId($b['id'] ?? null) : null;
    if ($needsId && !$id) Response::error(400, 'bad_id');

    $nombre    = trim((string)($b['nombre'] ?? ''));
    $municipio = trim((string)($b['municipio'] ?? ''));
    if ($nombre === '' || mb_strlen($nombre, 'UTF-8') > 80)    Response::error(422, 'bad_nombre');
    if ($municipio === '' || mb_strlen($municipio, 'UTF-8') > 80) Response::error(422, 'bad_municipio');

    $region    = mb_substr(trim((string)($b['region']    ?? '')), 0, 80, 'UTF-8');
    $direccion = mb_substr(trim((string)($b['direccion'] ?? '')), 0, 255, 'UTF-8');
    $descripcion = Validate::comment((string)($b['descripcion'] ?? ''), 800);
    $correo    = Validate::email($b['correo'] ?? null) ?? '';

    $color = (string)($b['color'] ?? 'oklch(0.45 0.1 40)');
    if (!preg_match('/^oklch\([^)]{1,80}\)$/i', $color) && !preg_match('/^#[0-9a-f]{3,8}$/i', $color)) {
        $color = 'oklch(0.45 0.1 40)';
    }

    $cx = isset($b['coords']['x']) ? (float)$b['coords']['x'] : 0.5;
    $cy = isset($b['coords']['y']) ? (float)$b['coords']['y'] : 0.5;
    $cx = max(0.0, min(1.0, $cx));
    $cy = max(0.0, min(1.0, $cy));

    return compact('id', 'nombre', 'municipio', 'region', 'direccion', 'correo', 'descripcion', 'color')
        + ['coords_x' => $cx, 'coords_y' => $cy];
}
