<?php
// api/check.php — el archivo más simple posible. Si esto NO devuelve un
// JSON válido sino un 500, es problema del hosting (PHP no corre en api/,
// .htaccess está bloqueando, AllowOverride None, etc.) — no del código.
// BORRA este archivo cuando termines de diagnosticar.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
echo json_encode([
    'ok'             => true,
    'php_version'    => PHP_VERSION,
    'sapi'           => PHP_SAPI,
    'request_uri'    => $_SERVER['REQUEST_URI']    ?? null,
    'script_name'    => $_SERVER['SCRIPT_NAME']    ?? null,
    'document_root'  => $_SERVER['DOCUMENT_ROOT']  ?? null,
    'server_software'=> $_SERVER['SERVER_SOFTWARE']?? null,
    'message'        => 'PHP corre correctamente en api/.',
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
