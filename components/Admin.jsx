// Pantallas del Panel Administrador (con autenticación real, CRUD real,
// y navegación por rutas /admin/...).

const AdminShell = ({ active, user, children }) => {
  const items = [
    { id: "stands", label: "Stands",       sub: "Registro",   path: "/admin/stands" },
    { id: "qr",     label: "Códigos QR",   sub: "Impresión",  path: "/admin/qr" },
    { id: "live",   label: "Actividad",    sub: "En vivo",    path: "/admin/live" },
  ];
  const logout = async () => {
    if (window.LMTApi && window.LMTApi.enabled) await window.LMTApi.signOutAdmin();
    window.LMTRouter.go("/");
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100dvh", background: "var(--paper)" }}>
      <aside style={{ borderRight: "1px solid var(--line)", padding: "26px 18px", display: "flex", flexDirection: "column", gap: 28, background: "var(--paper)" }}>
        <a href="/" data-route style={{ textDecoration: "none", color: "inherit" }}>
          <Wordmark size={16}/>
        </a>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div className="mono" style={{ marginBottom: 8 }}>Admin · Festival 2026</div>
          {items.map((it) => (
            <a key={it.id} href={it.path} data-route style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start",
              padding: "10px 12px", borderRadius: "var(--r-md)",
              background: active === it.id ? "var(--paper-2)" : "transparent",
              textAlign: "left", textDecoration: "none", color: "var(--ink)",
            }}>
              <span style={{ fontSize: 14, fontWeight: active === it.id ? 600 : 400 }}>{it.label}</span>
              {it.sub && <span className="mono" style={{ fontSize: 9, marginTop: 2 }}>{it.sub}</span>}
            </a>
          ))}
        </nav>
        <div style={{ marginTop: "auto", padding: 12, border: "1px solid var(--line)", borderRadius: "var(--r-md)" }}>
          <div className="mono" style={{ marginBottom: 4 }}>Sesión</div>
          <div style={{ fontSize: 12, color: "var(--ink-2)", wordBreak: "break-all" }}>{user ? user.email : "—"}</div>
          <button onClick={logout} className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 10, padding: "8px" }}>
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main style={{ overflow: "auto" }}>{children}</main>
    </div>
  );
};

const LoginAdmin = ({ onLogin }) => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    // Si ya hay sesión activa, salta directo al panel.
    if (window.LMTApi && window.LMTApi.user && window.LMTApi.user() && window.LMTApi.user().admin) {
      onLogin();
    }
  }, [onLogin]);

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");
    if (!window.LMTSecurity || !window.LMTSecurity.isEmail(email)) { setError("Correo inválido"); return; }
    if (!password || password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }
    setBusy(true);
    try {
      if (!window.LMTApi || !window.LMTApi.enabled) throw new Error("api_unavailable");
      const u = await window.LMTApi.signInAdmin(email, password);
      if (!u || !u.admin) throw new Error("forbidden");
      onLogin();
    } catch (e) {
      const code = e && (e.code || e.message);
      if (code === "rate_limited") setError("Demasiados intentos. Espera unos minutos.");
      else if (code === "api_unavailable") setError("La API no está disponible. ¿Ejecutaste el asistente de instalación?");
      else if (code === "forbidden") setError("Esa cuenta no tiene permisos de administrador.");
      else setError("No fue posible iniciar sesión. Verifica las credenciales.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "var(--paper)" }}>
      <div style={{ background: "var(--ink)", color: "var(--paper)", padding: "60px 60px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ filter: "invert(1)" }}><LogoTaza size={36}/></div>
          <div className="mono" style={{ color: "var(--paper-3)" }}>La Mejor Taza · Admin</div>
        </div>
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 64, lineHeight: 0.95, margin: 0, fontWeight: 400, letterSpacing: "-0.02em" }}>
            El pasaporte<br/>del café<br/><span style={{ color: "var(--galeras)" }}>nariñense</span>.
          </h1>
          <p style={{ fontSize: 15, color: "var(--paper-3)", maxWidth: 420, marginTop: 24, lineHeight: 1.6 }}>
            Registra los stands del festival, genera códigos QR para cada uno y sigue en tiempo real la votación de los visitantes.
          </p>
        </div>
        <a href="/" data-route className="mono" style={{ color: "var(--paper-3)" }}>← Volver al sitio público</a>
      </div>
      <form onSubmit={handleLogin} style={{ padding: "70px 60px", display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 520 }}>
        <div className="mono">Acceso · Organizadores</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 40, fontWeight: 400, margin: "8px 0 28px" }}>
          Iniciar sesión
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div className="field">
            <label>Correo institucional</label>
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} required/>
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={128} required/>
          </div>
          {error && <div role="alert" style={{ fontSize: 13, color: "var(--bad)" }}>{error}</div>}
          <button className="btn btn-primary" type="submit" disabled={busy} style={{ marginTop: 6, justifyContent: "center", padding: 14, opacity: busy ? 0.6 : 1 }}>
            {busy ? "Validando…" : "Entrar al panel →"}
          </button>
          <div className="mono" style={{ textAlign: "center", color: "var(--ink-3)" }}>
            {window.LMTApi && window.LMTApi.enabled ? "API conectada" : "API no disponible"}
          </div>
        </div>
      </form>
    </div>
  );
};

// Punto único del panel admin: switch interno por sección
const AdminPage = ({ section, user, stands, comentarios, editingId }) => {
  if (section === "stands")  return <AdminShell active="stands" user={user}><StandsList stands={stands}/></AdminShell>;
  if (section === "editor")  return <AdminShell active="stands" user={user}><StandEditor stand={editingId ? stands.find((s) => s.id === editingId) : null}/></AdminShell>;
  if (section === "qr")      return <AdminShell active="qr" user={user}><QRPrintView stands={stands}/></AdminShell>;
  if (section === "live")    return <AdminShell active="live" user={user}><ActivityLive stands={stands} comentarios={comentarios || (window.COMENTARIOS_DEMO || [])}/></AdminShell>;
  return <AdminShell active="stands" user={user}><div style={{ padding: 32 }}>—</div></AdminShell>;
};

const StandsList = ({ stands }) => {
  const sorted = [...stands].sort((a, b) => calcScore(b.votos) - calcScore(a.votos));
  return (
    <div style={{ padding: "40px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="mono">Registro · {stands.length} stands</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 44, fontWeight: 400, margin: "4px 0 0", letterSpacing: "-0.01em" }}>
            Stands del festival
          </h1>
        </div>
        <a href="/admin/stands/new" data-route className="btn btn-primary">+ Registrar stand</a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { k: "Stands", v: stands.length, sub: "registrados" },
          { k: "Votos", v: stands.reduce((a, s) => a + totalVotos(s.votos), 0), sub: "totales" },
          { k: "Aprobación", v: (window.LMTApi && window.LMTApi.metricas ? window.LMTApi.metricas.aprobacion + "%" : "—"), sub: "promedio" },
          { k: "Pasaportes", v: (window.LMTApi && window.LMTApi.metricas ? window.LMTApi.metricas.pasaportes : "—"), sub: "activos" },
        ].map(m => (
          <div key={m.k} style={{ padding: 20, border: "1px solid var(--line)", borderRadius: "var(--r-md)", background: "var(--paper)" }}>
            <div className="mono">{m.k}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 40, fontStyle: "italic", lineHeight: 1, marginTop: 8 }}>{m.v}</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {stands.length === 0 ? (
        <div style={{ padding: 60, border: "1px dashed var(--line-2)", borderRadius: "var(--r-md)", textAlign: "center", color: "var(--ink-3)" }}>
          <div className="mono">Sin stands</div>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 28, color: "var(--ink)", margin: "8px 0 16px" }}>Registra el primero.</div>
          <a href="/admin/stands/new" data-route className="btn btn-primary">+ Registrar stand</a>
        </div>
      ) : (
        <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", overflow: "hidden", background: "var(--paper)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "60px 2fr 1fr 1fr 1.2fr 80px", padding: "12px 20px", borderBottom: "1px solid var(--line)", background: "var(--paper-2)" }}>
            {["#", "Stand", "Municipio", "Región", "Calificación", ""].map((h, i) => (<div key={i} className="mono">{h}</div>))}
          </div>
          {sorted.map((s, i) => (
            <a key={s.id} href={"/admin/stands/" + s.id + "/edit"} data-route style={{
              display: "grid", gridTemplateColumns: "60px 2fr 1fr 1fr 1.2fr 80px",
              padding: "16px 20px", borderBottom: i < sorted.length - 1 ? "1px solid var(--line)" : "none",
              alignItems: "center", textDecoration: "none", color: "var(--ink)",
            }}>
              <div className="mono" style={{ fontSize: 13 }}>{String(i + 1).padStart(2, "0")}</div>
              <div>
                <div style={{ fontWeight: 500, fontSize: 15 }}>{s.nombre}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{s.direccion}</div>
              </div>
              <div style={{ fontSize: 14 }}>{s.municipio}</div>
              <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{s.region}</div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontStyle: "italic" }}>{calcScore(s.votos).toFixed(0)}</span>
                  <span className="mono" style={{ fontSize: 10 }}>{totalVotos(s.votos)} votos</span>
                </div>
                <BarraVotos votos={s.votos}/>
              </div>
              <div style={{ textAlign: "right", fontSize: 18, color: "var(--ink-3)" }}>→</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

const StandEditor = ({ stand }) => {
  const isNew = !stand;
  const [form, setForm] = React.useState(stand || {
    id: "st-" + Math.random().toString(36).slice(2, 6),
    nombre: "", municipio: "", region: "", direccion: "", correo: "",
    descripcion: "", votos: { bueno: 0, regular: 0, malo: 0 },
    coords: { x: 0.5, y: 0.5 },
    color: "oklch(0.45 0.1 40)",
  });
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setError(""); setBusy(true);
    try {
      const payload = {
        id: form.id,
        nombre: form.nombre,
        municipio: form.municipio,
        region: form.region,
        direccion: form.direccion,
        correo: form.correo,
        descripcion: form.descripcion,
        coords: form.coords,
        color: form.color,
      };
      if (isNew) await window.LMTApi.createStand(payload);
      else       await window.LMTApi.updateStand(form.id, payload);
      await window.LMTApi.pollDashboard();
      window.LMTRouter.go(isNew ? "/admin/qr" : "/admin/stands");
    } catch (e) {
      const code = String((e && (e.code || e.message)) || e);
      if (code.includes("bad_id")) setError("Identificador inválido (sólo minúsculas, números y guión).");
      else if (code.includes("bad_nombre")) setError("Nombre obligatorio (máx. 80).");
      else if (code.includes("bad_municipio")) setError("Municipio obligatorio (máx. 80).");
      else if (code.includes("unauthorized")) setError("Tu sesión expiró. Vuelve a iniciar sesión.");
      else setError("No fue posible guardar: " + code);
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!confirmDelete || isNew) return;
    setBusy(true);
    try {
      await window.LMTApi.deleteStand(form.id);
      await window.LMTApi.pollDashboard();
      window.LMTRouter.go("/admin/stands");
    } catch (e) {
      setError("No fue posible borrar: " + (e.code || e.message));
    } finally { setBusy(false); }
  };

  return (
    <div style={{ padding: "40px 48px", maxWidth: 960 }}>
      <a href="/admin/stands" data-route style={{ color: "var(--ink-2)", fontSize: 13, marginBottom: 20, display: "inline-block" }}>← Volver a stands</a>
      <div className="mono">{isNew ? "Nuevo registro" : "Editar stand"} · {form.id}</div>
      <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 40, fontWeight: 400, margin: "4px 0 28px" }}>
        {isNew ? "Registrar stand" : (form.nombre || "Sin nombre")}
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 40 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {isNew && (
            <div className="field">
              <label>ID del stand (URL del QR)</label>
              <input value={form.id} onChange={e => update("id", e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, ""))} maxLength={32}/>
            </div>
          )}
          <div className="field">
            <label>Nombre del stand</label>
            <input value={form.nombre} onChange={e => update("nombre", e.target.value)} placeholder="Ej: Finca El Tambo" maxLength={80} required/>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div className="field">
              <label>Municipio</label>
              <input value={form.municipio} onChange={e => update("municipio", e.target.value)} placeholder="La Unión" maxLength={80} required/>
            </div>
            <div className="field">
              <label>Región</label>
              <input value={form.region} onChange={e => update("region", e.target.value)} placeholder="Norte de Nariño" maxLength={80}/>
            </div>
          </div>
          <div className="field">
            <label>Dirección</label>
            <input value={form.direccion} onChange={e => update("direccion", e.target.value)} maxLength={255}/>
          </div>
          <div className="field">
            <label>Correo de contacto</label>
            <input type="email" value={form.correo} onChange={e => update("correo", e.target.value)} maxLength={254}/>
          </div>
          <div className="field">
            <label>Descripción corta</label>
            <textarea value={form.descripcion} onChange={e => update("descripcion", e.target.value)} rows={3} maxLength={800}/>
          </div>

          <div>
            <div className="mono" style={{ marginBottom: 12 }}>Color del sello</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                "oklch(0.42 0.09 50)", "oklch(0.55 0.13 30)", "oklch(0.5 0.08 145)",
                "oklch(0.48 0.1 60)", "oklch(0.5 0.1 200)", "oklch(0.4 0.08 120)",
                "oklch(0.55 0.12 20)", "oklch(0.45 0.11 300)"
              ].map(c => (
                <button key={c} type="button" onClick={() => update("color", c)} style={{
                  width: 36, height: 36, borderRadius: "50%", background: c,
                  border: form.color === c ? "2px solid var(--ink)" : "2px solid transparent",
                  outline: "1px solid var(--line)", outlineOffset: 2,
                }}/>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div className="field">
              <label>Coords X (0..1)</label>
              <input type="number" min="0" max="1" step="0.01" value={form.coords?.x ?? 0.5} onChange={e => update("coords", { ...form.coords, x: parseFloat(e.target.value) })}/>
            </div>
            <div className="field">
              <label>Coords Y (0..1)</label>
              <input type="number" min="0" max="1" step="0.01" value={form.coords?.y ?? 0.5} onChange={e => update("coords", { ...form.coords, y: parseFloat(e.target.value) })}/>
            </div>
          </div>

          {error && <div role="alert" style={{ padding: "10px 12px", border: "1px solid var(--bad)", color: "var(--bad)", borderRadius: "var(--r-sm)", fontSize: 13 }}>{error}</div>}

          <div style={{ display: "flex", gap: 12, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={save} disabled={busy} style={{ opacity: busy ? 0.6 : 1 }}>
              {busy ? "Guardando…" : (isNew ? "Registrar y generar QR →" : "Guardar cambios")}
            </button>
            <a href="/admin/stands" data-route className="btn btn-ghost">Cancelar</a>
            {!isNew && (
              <label style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, color: "var(--bad)", fontSize: 13 }}>
                <input type="checkbox" checked={confirmDelete} onChange={(e) => setConfirmDelete(e.target.checked)}/> confirmar borrar
                <button className="btn btn-ghost" onClick={remove} disabled={!confirmDelete || busy} style={{ borderColor: "var(--bad)", color: "var(--bad)" }}>Eliminar</button>
              </label>
            )}
          </div>
        </div>

        <aside style={{ position: "sticky", top: 24 }}>
          <div className="mono" style={{ marginBottom: 12 }}>Vista previa · Sello</div>
          <div style={{ padding: 32, border: "1px dashed var(--line-2)", borderRadius: "var(--r-md)", background: "var(--paper-2)", display: "flex", alignItems: "center", justifyContent: "center", aspectRatio: "1/1" }}>
            {form.nombre ? (
              <SelloCircular stand={form} size={170} rotation={-6}/>
            ) : (
              <div style={{ textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
                <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, marginBottom: 4 }}>—</div>
                Completa el nombre<br/>para ver el sello
              </div>
            )}
          </div>
          <div className="mono" style={{ marginTop: 16 }}>URL del QR</div>
          <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--ink-2)", wordBreak: "break-all", marginTop: 4 }}>
            {window.location.origin}{window.LMT_BASE_URL || ""}/s/{form.id}
          </div>
        </aside>
      </div>
    </div>
  );
};

Object.assign(window, { AdminShell, LoginAdmin, AdminPage, StandsList, StandEditor });
