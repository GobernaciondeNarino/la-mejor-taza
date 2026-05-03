// js/api.js
// Cliente del backend PHP. Reemplaza al wiring previo con Firebase.
// - Hace polling ligero (5s) sobre /api/dashboard para mantener la UI viva.
// - Incluye CSRF token en cada POST/PUT/DELETE.
// - Si el backend no responde, mantiene los datos demo de data/stands.js.

(function () {
  const BASE = (window.LMT_API_BASE || "/api").replace(/\/$/, "");
  let csrf = "";
  let user = null;
  let pollTimer = null;

  const dispatch = () => window.dispatchEvent(new CustomEvent("lmt:data"));

  async function request(path, opts = {}) {
    const method = (opts.method || "GET").toUpperCase();
    const headers = Object.assign({ "Accept": "application/json" }, opts.headers || {});
    if (opts.body && !(opts.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    if (!["GET", "HEAD", "OPTIONS"].includes(method) && csrf) {
      headers["X-CSRF-Token"] = csrf;
    }
    const res = await fetch(BASE + path, {
      method,
      credentials: "same-origin",
      headers,
      body: opts.body ? (typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body)) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch (_) { /* sin cuerpo JSON */ }
    if (!res.ok || (data && data.ok === false)) {
      const code = (data && (data.error || data.message)) || `http_${res.status}`;
      const err = new Error(code);
      err.status = res.status;
      err.code = code;
      throw err;
    }
    return data && data.data !== undefined ? data.data : data;
  }

  async function bootstrap() {
    try {
      const me = await request("/auth/me");
      user = me.user || null;
      csrf = me.csrf || "";
    } catch (_) {
      // API no disponible: queda en modo demo.
      window.LMTApi.enabled = false;
    }
  }

  async function pollDashboard() {
    try {
      const data = await request("/dashboard");
      if (Array.isArray(data.stands) && data.stands.length) {
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
      dispatch();
    } catch (_) { /* silencioso */ }
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

  async function signInAdmin(email, password) {
    const data = await request("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    user = data.user || null;
    csrf = data.csrf || "";
    return user;
  }

  async function signOutAdmin() {
    try { await request("/auth/logout", { method: "POST" }); }
    finally { user = null; csrf = ""; }
  }

  async function submitVote(raw) {
    if (!window.LMTSecurity) throw new Error("seguridad_no_cargada");
    const payload = window.LMTSecurity.buildVotePayload(raw);
    if (!window.LMTSecurity.canVote(payload.stand)) {
      throw new Error("rate_limited");
    }
    // Refrescar CSRF si hizo falta (por si la sesión se renovó)
    if (!csrf) {
      try { const me = await request("/auth/me"); csrf = me.csrf || ""; } catch (_) {}
    }
    await request("/votos", { method: "POST", body: payload });
    window.LMTSecurity.markVote(payload.stand);
    pollDashboard();
  }

  async function listStands() {
    return mapStandsResponse(await request("/stands"));
  }
  async function createStand(body) {
    return request("/stands", { method: "POST", body });
  }
  async function updateStand(id, body) {
    return request("/stands/" + encodeURIComponent(id), { method: "PUT", body });
  }
  async function deleteStand(id) {
    return request("/stands/" + encodeURIComponent(id), { method: "DELETE" });
  }
  function mapStandsResponse(data) { return Array.isArray(data) ? data.map(mapStand) : []; }

  window.LMTApi = {
    enabled: true,
    base: BASE,
    user: () => user,
    csrf: () => csrf,
    signInAdmin,
    signOutAdmin,
    submitVote,
    listStands,
    createStand,
    updateStand,
    deleteStand,
    pollDashboard,
  };

  // Arranque automático: bootstrap, primer poll, luego cada 5s.
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
