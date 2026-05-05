<?php
defined('LMT_GUARD') || exit('forbidden');
use LMT\Db;
use LMT\Response;

function register_routes_dashboard(\LMT\Router $r): void
{
    // Endpoint único que devuelve stands + últimos votos para minimizar round-trips.
    $r->get('/dashboard', function () {
        $stands = Db::pdo()->query(
            'SELECT id, nombre, municipio, region, direccion, correo, descripcion,
                    coords_x, coords_y, color, votos_bueno, votos_regular, votos_malo
             FROM stands ORDER BY id'
        )->fetchAll();
        $standsApi = array_map('stand_row_to_api', $stands);

        $stmt = Db::pdo()->prepare(
            'SELECT v.stand_id, v.emoji, v.texto, v.compra, v.correo, v.created_at
             FROM votos v ORDER BY v.created_at DESC LIMIT 20'
        );
        $stmt->execute();
        $votos = array_map(function ($v) {
            return [
                'stand'  => $v['stand_id'],
                'emoji'  => $v['emoji'],
                'texto'  => $v['texto'] ?? '',
                'compra' => $v['compra'] !== null ? (bool)$v['compra'] : null,
                'autor'  => \LMT\Validate::maskEmail((string)$v['correo']),
                'hora'   => relative_time($v['created_at']),
            ];
        }, $stmt->fetchAll());

        // Métricas simples
        $totalVotos = 0; $bueno = 0;
        foreach ($stands as $s) {
            $b = (int)$s['votos_bueno']; $rg = (int)$s['votos_regular']; $m = (int)$s['votos_malo'];
            $totalVotos += $b + $rg + $m;
            $bueno += $b;
        }
        $pasaportesRow = Db::pdo()->query('SELECT COUNT(*) AS c FROM pasaportes')->fetch();
        $pasaportes = (int)($pasaportesRow['c'] ?? 0);

        Response::ok([
            'stands'  => $standsApi,
            'votos'   => $votos,
            'metricas' => [
                'votos_totales' => $totalVotos,
                'aprobacion'    => $totalVotos > 0 ? (int)round($bueno * 100 / $totalVotos) : 0,
                'stands'        => count($standsApi),
                'pasaportes'    => $pasaportes,
            ],
        ]);
    });
}
