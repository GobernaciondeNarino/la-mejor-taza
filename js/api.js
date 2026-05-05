// js/api.js — cliente del backend PHP.
// - Detecta automáticamente el base URL (raíz o subdirectorio).
// - Mantiene CSRF + sesión.
// - Polling ligero (5s) sobre /api/dashboard para datos en vivo.

(function () {
  // BASE apunta SIEMPRE al front controller PHP. Esto funciona con o
  // sin mod_rewrite en el servidor — la ruta interna se manda por
  // ?path=auth/me (preservada por mod_rewrite con QSA y leída por el
  // PHP directamente cuando los rewrites están desactivados).
  let BASE = (window.LMT_API_BASE
    || (window.LMT_BASE_URL ? window.LMT_BASE_URL + "/api/index.php" : "/api/index.php")
  ).replace(/\/$/, "");
  // Si nos dieron un BASE viejo del estilo "/api" sin index.php, lo arreglamos.
  if (!/index\.php$/i.test(BASE)) BASE = BASE + "/index.php";

  let csrf = "";
  let user = null;
  let pollTimer = null;
  let bootstrapDone = false;

  const dispatchData = () => window.dispatchEvent(new CustomEvent("lmt:data"));
  const dispatchAuth = () => window.dispatchEvent(new CustomEvent("lmt:auth", { detail: user }));

  // Convierte una ruta interna ("/auth/me", "/votos?limit=20") en una URL
  // absoluta a /api/index.php?path=auth/me[&...].
  function urlFor(path) {
    let routePath = path, qs = "";
    const qIdx = path.indexOf("?");
    if (qIdx !== -1) {
      routePath = path.slice(0, qIdx);
      qs = path.slice(qIdx + 1);
    }
    routePath = routePath.replace(/^\//, "");
    let url = BASE + "?path=" + encodeURIComponent(routePath);
    if (qs) url += "&" + qs;
    return url;
  }

  async function request(path, opts = {}) {
    const method = (opts.method || "GET").toUpperCase();
    const headers = Object.assign({ "Accept": "application/json" }, opts.headers || {});
    if (opts.body && !(opts.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    if (!["GET", "HEAD", "OPTIONS"].includes(method) && csrf) {
      headers["X-CSRF-Token"] = csrf;
    }
    const res = await fetch(urlFor(path), {
      method,
      credentials: "same-origin",
      headers,
      body: opts.body ? (typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body)) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch (_) {}
    if (!res.ok || (data && data.ok === false)) {
      const code = (data && (data.error || data.message)) || ("http_" + res.status);
      const err = new Error(code);
      err.status = res.status;
      err.code = code;
      throw err;
    }
    return data && data.data !== undefined ? data.data : data;
  }

  function mapStand(s) {
    return {
      id: s.id,
      nombre: s.nombre,
      municipio: s.municipio,
      region: s.region,
      direccion: s.direccion,
      correo: s.correo,
      descripcion: s.descripcion,
      coords: s.coords || { x: 0.5, y: 0.5 },
      color: s.color || "oklch(0.45 0.1 40)",
      votos: s.votos || { bueno: 0, regular: 0, malo: 0 },
    };
  }

  async function bootstrap() {
    try {
      const me = await request("/auth/me");
      user = me.user || null;
      csrf = me.csrf || "";
      window.LMTApi.enabled = true;
    } catch (e) {
      console.warn("[lmt] API no disponible:", e.message);
      window.LMTApi.enabled = false;
    } finally {
      bootstrapDone = true;
      dispatchAuth();
    }
  }

  async function pollDashboard() {
    if (!window.LMTApi.enabled) return;
    try {
      const data = await request("/dashboard");
      if (Array.isArray(data.stands)) {
        window.STANDS_DATA = data.stands.map(mapStand);
      }
      if (Array.isArray(data.votos)) {
        const standMap = Object.fromEntries((window.STANDS_DATA || []).map((s) => [s.id, s]));
        window.COMENTARIOS_DEMO = data.votos.map((v) => ({
          stand: v.stand,
          emoji: v.emoji,
          texto: window.LMTSecurity ? window.LMTSecurity.sanitizeText(v.texto || "", 500) : (v.texto || ""),
          compra: !!v.compra,
          autor: v.autor || "",
          hora: v.hora || "",
          _stand: standMap[v.stand],
        }));
      }
      window.LMTApi.metricas = data.metricas || null;
      dispatchData();
    } catch (_) { /* silencioso */ }
  }

  async function signInAdmin(email, password) {
    const data = await request("/auth/login", { method: "POST", body: { email, password } });
    user = data.user || null;
    csrf = data.csrf || "";
    dispatchAuth();
    return user;
  }

  async function signOutAdmin() {
    try { await request("/auth/logout", { method: "POST" }); } catch (_) {}
    user = null;
    // Refrescar CSRF tras logout (la sesión se regenera)
    try { const me = await request("/auth/me"); csrf = me.csrf || ""; } catch (_) {}
    dispatchAuth();
  }

  async function ensureCsrf() {
    if (csrf) return;
    try { const me = await request("/auth/me"); csrf = me.csrf || ""; } catch (_) {}
  }

  async function submitVote(raw) {
    if (!window.LMTSecurity) throw new Error("seguridad_no_cargada");
    const payload = window.LMTSecurity.buildVotePayload(raw);
    if (!window.LMTSecurity.canVote(payload.stand)) throw new Error("rate_limited");
    await ensureCsrf();
    await request("/votos", { method: "POST", body: payload });
    window.LMTSecurity.markVote(payload.stand);
    pollDashboard();
    return payload;
  }

  async function getPasaporte(correo) {
    return request("/pasaportes/" + encodeURIComponent(correo));
  }

  async function listStands()           { return (await request("/stands")).map(mapStand); }
  async function getStand(id)           { return mapStand(await request("/stands/" + encodeURIComponent(id))); }
  async function createStand(body)      { await ensureCsrf(); return request("/stands", { method: "POST", body }); }
  async function updateStand(id, body)  { await ensureCsrf(); return request("/stands/" + encodeURIComponent(id), { method: "PUT", body }); }
  async function deleteStand(id)        { await ensureCsrf(); return request("/stands/" + encodeURIComponent(id), { method: "DELETE" }); }

  window.LMTApi = {
    enabled: false,
    base: BASE,
    urlFor,                // útil para descargas (CSV) que necesitan URL completa
    user: () => user,
    csrf: () => csrf,
    bootstrapDone: () => bootstrapDone,
    signInAdmin,
    signOutAdmin,
    submitVote,
    getPasaporte,
    listStands,
    getStand,
    createStand,
    updateStand,
    deleteStand,
    pollDashboard,
  };

  // Arranque automático
  bootstrap().then(() => {
    pollDashboard();
    pollTimer = setInterval(pollDashboard, 5000);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        clearInterval(pollTimer); pollTimer = null;
      } else if (!pollTimer) {
        pollDashboard();
        pollTimer = setInterval(pollDashboard, 5000);
      }
    });
  });
})();
