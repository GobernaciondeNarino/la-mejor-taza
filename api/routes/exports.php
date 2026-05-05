<?php
use LMT\Db;
use LMT\Response;
use LMT\Security;

function register_routes_exports(\LMT\Router $r): void
{
    $r->get('/export/votos.csv', function () {
        Security::requireAdmin();
        export_csv_stream('votos.csv', ['id', 'stand_id', 'emoji', 'correo', 'compra', 'texto', 'created_at'],
            'SELECT id, stand_id, emoji, correo, compra, texto, created_at FROM votos ORDER BY created_at DESC');
    });

    $r->get('/export/stands.csv', function () {
        Security::requireAdmin();
        export_csv_stream('stands.csv',
            ['id', 'nombre', 'municipio', 'region', 'direccion', 'correo', 'descripcion', 'votos_bueno', 'votos_regular', 'votos_malo', 'created_at'],
            'SELECT id, nombre, municipio, region, direccion, correo, descripcion, votos_bueno, votos_regular, votos_malo, created_at FROM stands ORDER BY id');
    });

    $r->get('/export/pasaportes.csv', function () {
        Security::requireAdmin();
        export_csv_stream('pasaportes.csv', ['correo', 'nombre', 'inicio', 'visitados'],
            'SELECT correo, nombre, inicio, visitados FROM pasaportes ORDER BY inicio DESC');
    });
}

function export_csv_stream(string $filename, array $columns, string $sql): void
{
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: no-store, no-cache, must-revalidate');

    $out = fopen('php://output', 'w');
    // BOM para que Excel reconozca UTF-8
    fwrite($out, "\xEF\xBB\xBF");
    fputcsv($out, $columns, ',', '"', '\\');
    $stmt = Db::pdo()->query($sql);
    while ($row = $stmt->fetch()) {
        $line = [];
        foreach ($columns as $col) {
            $v = $row[$col] ?? '';
            if (is_array($v)) $v = json_encode($v, JSON_UNESCAPED_UNICODE);
            if (is_bool($v))  $v = $v ? '1' : '0';
            $line[] = (string) $v;
        }
        fputcsv($out, $line, ',', '"', '\\');
    }
    fclose($out);
    exit;
}
