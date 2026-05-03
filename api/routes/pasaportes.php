<?php
use LMT\Db;
use LMT\Response;
use LMT\Validate;

function register_routes_pasaportes(\LMT\Router $r): void
{
    $r->get('/pasaportes/:correo', function (array $p) {
        $correo = Validate::email(urldecode($p['correo'] ?? ''));
        if (!$correo) Response::error(400, 'bad_email');

        $stmt = Db::pdo()->prepare('SELECT correo, nombre, inicio, visitados FROM pasaportes WHERE correo = :c');
        $stmt->execute([':c' => $correo]);
        $row = $stmt->fetch();
        if (!$row) Response::error(404, 'not_found');

        $visitados = is_string($row['visitados'])
            ? (json_decode($row['visitados'], true) ?: [])
            : ($row['visitados'] ?: []);

        Response::ok([
            'correo'    => Validate::maskEmail($row['correo']),
            'nombre'    => $row['nombre'] ?? '',
            'inicio'    => $row['inicio'] ?? null,
            'visitados' => array_values(array_filter($visitados, [Validate::class, 'standId'])),
        ]);
    });
}
