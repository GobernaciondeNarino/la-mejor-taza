<?php
// app.php — shell SPA renderizado por PHP.
// Calcula el `base href` correcto sin importar si la app vive en la raíz
// (https://lamejortaza.co/) o en un subdirectorio (https://host/lamejortaza/).

declare(strict_types=1);

$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/'));
$scriptDir = rtrim($scriptDir, '/');
$base = $scriptDir === '' ? '' : $scriptDir;
$baseHref = ($base === '' ? '/' : $base . '/');

// Si aún no se ha instalado, manda al asistente.
if (!is_file(__DIR__ . '/api/config.php')) {
    header('Location: ' . $baseHref . 'install.php', true, 302);
    exit;
}

header('Content-Type: text/html; charset=utf-8');
// Si llegamos vía ErrorDocument 404 (hosts sin mod_rewrite), forzamos 200
// porque el SPA decidirá la ruta y mostrará el contenido apropiado.
http_response_code(200);
header('Cache-Control: no-store, must-revalidate');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()');

$cfg = include __DIR__ . '/api/config.php';
$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
if ($secure) header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');

$bootstrap = [
    'base'    => $base,
    'apiBase' => $base . '/api',
    'siteName'=> 'La Mejor Taza',
];
?>
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<meta name="referrer" content="strict-origin-when-cross-origin"/>
<meta name="color-scheme" content="light"/>
<base href="<?= htmlspecialchars($baseHref, ENT_QUOTES) ?>"/>
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdnjs.cloudflare.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com data:;
  img-src 'self' data: blob:;
  connect-src 'self';
  frame-ancestors 'self';
  base-uri 'self';
  form-action 'self';
  object-src 'none';
"/>
<title>La Mejor Taza — Pasaporte del Café de Nariño</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles/tokens.css"/>
<style>
  html, body { height: 100%; }
  body { overflow-x: hidden; }
  #root { min-height: 100dvh; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-thumb { background: var(--line-2); border-radius: 999px; }
  ::-webkit-scrollbar-track { background: transparent; }
  .lmt-three-wrap { position: relative; }
  .lmt-three-wrap > *:not(canvas) { position: relative; z-index: 1; }
  /* Vista mobile-first para /s/{id} y /pasaporte sobre desktop: ancho cómodo, fondo papel */
  .mobile-page { min-height: 100dvh; background: var(--paper); }
  .mobile-page .mobile-inner { max-width: 460px; margin: 0 auto; padding: 24px 20px 32px; }
  @media (min-width: 720px) {
    .mobile-page { padding-top: 32px; padding-bottom: 32px; background: var(--paper-2); }
    .mobile-page .mobile-inner { background: var(--paper); border-radius: var(--r-md); border: 1px solid var(--line); box-shadow: var(--shadow-2); padding: 28px 24px 36px; }
  }
  .splash { display:flex;align-items:center;justify-content:center;height:100dvh;color:var(--ink-3);font-family:var(--font-mono);font-size:11px;letter-spacing:.08em;text-transform:uppercase; }
</style>
</head>
<body>
<div id="root"><div class="splash">Cargando…</div></div>

<script>
window.LMT_BOOTSTRAP = <?= json_encode($bootstrap, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?>;
window.LMT_BASE_URL  = window.LMT_BOOTSTRAP.base;
window.LMT_API_BASE  = window.LMT_BOOTSTRAP.apiBase;
</script>

<!-- Utilidades de seguridad -->
<script src="js/security.js"></script>

<!-- Three.js (animaciones) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r160/three.min.js" crossorigin="anonymous"></script>
<script src="js/three-background.js"></script>

<!-- Cliente del backend PHP + router del SPA -->
<script src="js/router.js"></script>
<script src="js/api.js"></script>

<!-- React + Babel (CDN) -->
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" crossorigin="anonymous"></script>
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" crossorigin="anonymous"></script>

<!-- Componentes -->
<script type="text/babel" src="components/Shared.jsx"></script>
<script type="text/babel" src="components/Admin.jsx"></script>
<script type="text/babel" src="components/QRPrint.jsx"></script>
<script type="text/babel" src="components/VoteFlow.jsx"></script>
<script type="text/babel" src="components/Passport.jsx"></script>
<script type="text/babel" src="components/Dashboard.jsx"></script>

<script type="text/babel">
const PALETTES = {
  "nariño": { grano: "oklch(0.42 0.09 50)", galeras: "oklch(0.55 0.13 30)", cafeto: "oklch(0.5 0.08 145)", paper: "oklch(0.97 0.015 75)", ink: "oklch(0.22 0.02 60)" },
};
const applyPalette = (name) => {
  const p = PALETTES[name] || PALETTES["nariño"];
  const r = document.documentElement.style;
  Object.entries(p).forEach(([k, v]) => r.setProperty("--" + k, v));
};
applyPalette("nariño");

const App = () => {
  const [route, setRoute] = React.useState(() => window.LMTRouter.current());
  const [user, setUser]   = React.useState(() => (window.LMTApi && window.LMTApi.user()) || null);
  const [ready, setReady] = React.useState(() => !!(window.LMTApi && window.LMTApi.bootstrapDone && window.LMTApi.bootstrapDone()));
  const [, setTick]       = React.useState(0);

  React.useEffect(() => {
    const off1 = window.LMTRouter.subscribe(setRoute);
    const onAuth = () => {
      setUser((window.LMTApi && window.LMTApi.user()) || null);
      setReady(true);
    };
    window.addEventListener("lmt:auth", onAuth);
    const onData = () => setTick((t) => t + 1);
    window.addEventListener("lmt:data", onData);
    // Safety: si LMTApi nunca dispara auth (API caída), igualmente desbloquear UI tras 1.5s.
    const t = setTimeout(() => setReady(true), 1500);
    return () => {
      off1();
      window.removeEventListener("lmt:auth", onAuth);
      window.removeEventListener("lmt:data", onData);
      clearTimeout(t);
    };
  }, []);

  const stands = window.STANDS_DATA || [];
  const comentarios = window.COMENTARIOS_DEMO || [];

  // Hasta que termine el bootstrap, no decidimos si redirigir a login (evita parpadeo).
  if (!ready && route.path.startsWith("/admin") && route.path !== "/admin/login") {
    return <Splash/>;
  }

  // Auth gate para /admin/*
  if (route.path.startsWith("/admin") && route.path !== "/admin/login") {
    if (!user || !user.admin) {
      window.LMTRouter.go("/admin/login");
      return null;
    }
  }

  // 1. Dashboard público
  if (route.path === "/" || route.path === "") {
    return <PublicDashboard
      stands={stands}
      comentarios={comentarios}
      onDetail={(id) => window.LMTRouter.go("/festival/" + id)}/>;
  }

  // 2. Detalle público de stand
  const festivalMatch = route.path.match(/^\/festival\/([a-z0-9\-]+)$/);
  if (festivalMatch) {
    const stand = stands.find((s) => s.id === festivalMatch[1]);
    if (!stand) return <NotFound back="/"/>;
    return <PublicDetail stand={stand} comentarios={comentarios} allStands={stands}
      onBack={() => window.LMTRouter.go("/")}
      onVote={() => window.LMTRouter.go("/s/" + stand.id)}/>;
  }

  // 3. Voto desde QR — mobile real
  const voteMatch = route.path.match(/^\/s\/([a-z0-9\-]+)$/);
  if (voteMatch) {
    const stand = stands.find((s) => s.id === voteMatch[1]);
    if (!stand) {
      // Stand puede no estar aún si la primera carga aún no llegó
      if (!stands.length) return <Splash/>;
      return <NotFound back="/"/>;
    }
    return <MobileVotePage stand={stand}/>;
  }

  // 4. Pasaporte del usuario (real)
  if (route.path === "/pasaporte") {
    return <PassportPage stands={stands}/>;
  }

  // 5. Admin login
  if (route.path === "/admin/login") {
    return <LoginAdmin onLogin={() => window.LMTRouter.go("/admin")}/>;
  }

  // 6. Admin home → stands
  if (route.path === "/admin" || route.path === "/admin/stands") {
    return <AdminPage section="stands" user={user} stands={stands}/>;
  }
  if (route.path === "/admin/stands/new") {
    return <AdminPage section="editor" user={user} stands={stands} editingId={null}/>;
  }
  const editMatch = route.path.match(/^\/admin\/stands\/([a-z0-9\-]+)\/edit$/);
  if (editMatch) {
    return <AdminPage section="editor" user={user} stands={stands} editingId={editMatch[1]}/>;
  }
  if (route.path === "/admin/qr") {
    return <AdminPage section="qr" user={user} stands={stands}/>;
  }
  if (route.path === "/admin/live") {
    return <AdminPage section="live" user={user} stands={stands} comentarios={comentarios}/>;
  }

  return <NotFound back="/"/>;
};

const Splash = () => (<div className="splash">Cargando…</div>);

const NotFound = ({ back }) => (
  <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24, textAlign: "center", background: "var(--paper)" }}>
    <div>
      <div className="mono">404</div>
      <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 56, margin: "12px 0", lineHeight: 1 }}>Página no encontrada.</h1>
      <a href={back} data-route className="btn btn-primary">← Volver al inicio</a>
    </div>
  </div>
);

window.NotFound = NotFound;
window.Splash = Splash;

const waitForGlobals = () => {
  const needed = ["LoginAdmin", "AdminPage", "MobileVotePage", "PassportPage", "PublicDashboard", "PublicDetail"];
  if (needed.every((k) => window[k])) {
    ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
  } else {
    setTimeout(waitForGlobals, 40);
  }
};
waitForGlobals();
</script>
</body>
</html>
