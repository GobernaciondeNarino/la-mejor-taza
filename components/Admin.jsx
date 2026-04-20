// Pantallas del Panel Administrador

const AdminShell = ({ active, setActive, children }) => {
  const items = [
    { id: "stands", label: "Stands", sub: "Registro" },
    { id: "qr", label: "Códigos QR", sub: "Impresión" },
    { id: "live", label: "Actividad", sub: "En vivo" },
    { id: "config", label: "Configuración", sub: "" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", minHeight: "100%", background: "var(--paper)" }}>
      {/* Sidebar */}
      <aside style={{
        borderRight: "1px solid var(--line)",
        padding: "28px 20px",
        display: "flex", flexDirection: "column", gap: 32,
        background: "var(--paper)",
      }}>
        <Wordmark size={16}/>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div className="mono" style={{ marginBottom: 8 }}>Admin · Festival 2026</div>
          {items.map(it => (
            <button key={it.id} onClick={() => setActive(it.id)} style={{
              display: "flex", flexDirection: "column", alignItems: "flex-start",
              padding: "10px 12px",
              borderRadius: "var(--r-md)",
              background: active === it.id ? "var(--paper-2)" : "transparent",
              textAlign: "left",
            }}>
              <span style={{ fontSize: 14, fontWeight: active === it.id ? 600 : 400 }}>{it.label}</span>
              {it.sub && <span className="mono" style={{ fontSize: 9, marginTop: 2 }}>{it.sub}</span>}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: "auto", padding: 12, border: "1px solid var(--line)", borderRadius: "var(--r-md)" }}>
          <div className="mono" style={{ marginBottom: 4 }}>Organizador</div>
          <div style={{ fontSize: 13 }}>Comité del Café · Nariño</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>admin@lamejortaza.co</div>
        </div>
      </aside>
      <main style={{ overflow: "auto" }}>{children}</main>
    </div>
  );
};

const LoginAdmin = ({ onLogin }) => (
  <div style={{
    minHeight: "100%", display: "grid", gridTemplateColumns: "1fr 1fr",
    background: "var(--paper)",
  }}>
    <div style={{
      background: "var(--ink)", color: "var(--paper)",
      padding: "60px 60px",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ filter: "invert(1)" }}><LogoTaza size={36}/></div>
        <div className="mono" style={{ color: "var(--paper-3)" }}>La Mejor Taza · Admin</div>
      </div>
      <div>
        <h1 style={{
          fontFamily: "var(--font-display)", fontStyle: "italic",
          fontSize: 72, lineHeight: 0.95, margin: 0, fontWeight: 400,
          letterSpacing: "-0.02em",
        }}>El pasaporte<br/>del café<br/><span style={{ color: "var(--galeras)" }}>nariñense</span>.</h1>
        <p style={{ fontSize: 15, color: "var(--paper-3)", maxWidth: 420, marginTop: 24, lineHeight: 1.6 }}>
          Registra los stands del festival, genera códigos QR para cada uno y sigue en tiempo real la votación de los visitantes.
        </p>
      </div>
      <div className="mono" style={{ color: "var(--paper-3)", display: "flex", gap: 24 }}>
        <span>Festival 2026</span>
        <span>·</span>
        <span>Pasto — San Juan de Pasto</span>
        <span>·</span>
        <span>14–20 abr</span>
      </div>
      <div style={{ position: "absolute", bottom: -20, right: -20, opacity: 0.08 }}>
        <MontanasSilueta height={220} opacity={0.4}/>
      </div>
    </div>
    <div style={{ padding: "80px 80px", display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 520 }}>
      <div className="mono">Acceso · Organizadores</div>
      <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 44, fontWeight: 400, margin: "8px 0 32px" }}>
        Iniciar sesión
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div className="field">
          <label>Correo institucional</label>
          <input type="email" defaultValue="admin@lamejortaza.co"/>
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input type="password" defaultValue="••••••••••"/>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-2)" }}>
            <input type="checkbox" defaultChecked/> Recordarme
          </label>
          <a href="#" style={{ fontSize: 13, color: "var(--ink-2)" }}>¿Olvidó su contraseña?</a>
        </div>
        <button className="btn btn-primary" onClick={onLogin} style={{ marginTop: 16, justifyContent: "center", padding: "14px" }}>
          Entrar al panel →
        </button>
        <div className="mono" style={{ textAlign: "center", marginTop: 20, color: "var(--ink-3)" }}>
          Acceso controlado · v 1.0
        </div>
      </div>
    </div>
  </div>
);

const StandsList = ({ stands, onNuevo, onSelect, selected }) => {
  const sorted = [...stands].sort((a, b) => calcScore(b.votos) - calcScore(a.votos));
  return (
    <div style={{ padding: "40px 48px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
        <div>
          <div className="mono">Registro · {stands.length} stands activos</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 48, fontWeight: 400, margin: "4px 0 0", letterSpacing: "-0.01em" }}>
            Stands del festival
          </h1>
        </div>
        <button className="btn btn-primary" onClick={onNuevo}>+ Registrar stand</button>
      </div>

      {/* Métricas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {[
          { k: "Stands", v: stands.length, sub: "registrados" },
          { k: "Votos hoy", v: stands.reduce((a, s) => a + totalVotos(s.votos), 0), sub: "totales" },
          { k: "Aprobación", v: "87%", sub: "promedio" },
          { k: "Pasaportes", v: "1.247", sub: "activos" },
        ].map(m => (
          <div key={m.k} style={{ padding: 20, border: "1px solid var(--line)", borderRadius: "var(--r-md)", background: "var(--paper)" }}>
            <div className="mono">{m.k}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 44, fontStyle: "italic", lineHeight: 1, marginTop: 8 }}>{m.v}</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 4 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", overflow: "hidden", background: "var(--paper)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "60px 2fr 1fr 1fr 1.2fr 80px", padding: "12px 20px", borderBottom: "1px solid var(--line)", background: "var(--paper-2)" }}>
          {["#", "Stand", "Municipio", "Región", "Calificación", ""].map((h, i) => (
            <div key={i} className="mono">{h}</div>
          ))}
        </div>
        {sorted.map((s, i) => (
          <div key={s.id} onClick={() => onSelect(s.id)} style={{
            display: "grid", gridTemplateColumns: "60px 2fr 1fr 1fr 1.2fr 80px",
            padding: "16px 20px", borderBottom: i < sorted.length - 1 ? "1px solid var(--line)" : "none",
            cursor: "pointer",
            background: selected === s.id ? "var(--paper-2)" : "transparent",
            alignItems: "center",
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
          </div>
        ))}
      </div>
    </div>
  );
};

const StandEditor = ({ stand, onClose, onSave }) => {
  const [form, setForm] = React.useState(stand || {
    id: "st-" + Math.random().toString(36).slice(2, 6),
    nombre: "", municipio: "", region: "", direccion: "", correo: "",
    descripcion: "", votos: { bueno: 0, regular: 0, malo: 0 },
    color: "oklch(0.45 0.1 40)",
  });
  const isNew = !stand;
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ padding: "40px 48px", maxWidth: 960 }}>
      <button onClick={onClose} style={{ color: "var(--ink-2)", fontSize: 13, marginBottom: 20 }}>← Volver a stands</button>
      <div className="mono">{isNew ? "Nuevo registro" : "Editar stand"} · {form.id}</div>
      <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 44, fontWeight: 400, margin: "4px 0 32px" }}>
        {isNew ? "Registrar stand" : form.nombre || "Sin nombre"}
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 48 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div className="field">
            <label>Nombre del stand</label>
            <input value={form.nombre} onChange={e => update("nombre", e.target.value)} placeholder="Ej: Finca El Tambo"/>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
            <div className="field">
              <label>Municipio</label>
              <input value={form.municipio} onChange={e => update("municipio", e.target.value)} placeholder="La Unión"/>
            </div>
            <div className="field">
              <label>Región</label>
              <input value={form.region} onChange={e => update("region", e.target.value)} placeholder="Norte de Nariño"/>
            </div>
          </div>
          <div className="field">
            <label>Dirección</label>
            <input value={form.direccion} onChange={e => update("direccion", e.target.value)}/>
          </div>
          <div className="field">
            <label>Correo de contacto</label>
            <input type="email" value={form.correo} onChange={e => update("correo", e.target.value)}/>
          </div>
          <div className="field">
            <label>Descripción corta</label>
            <textarea value={form.descripcion} onChange={e => update("descripcion", e.target.value)} rows={3}/>
          </div>

          <div className="divider-stamp">sello</div>

          <div>
            <div className="mono" style={{ marginBottom: 12 }}>Color del sello</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                "oklch(0.42 0.09 50)", "oklch(0.55 0.13 30)", "oklch(0.5 0.08 145)",
                "oklch(0.48 0.1 60)", "oklch(0.5 0.1 200)", "oklch(0.4 0.08 120)",
                "oklch(0.55 0.12 20)", "oklch(0.45 0.11 300)"
              ].map(c => (
                <button key={c} onClick={() => update("color", c)} style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: c,
                  border: form.color === c ? "2px solid var(--ink)" : "2px solid transparent",
                  outline: "1px solid var(--line)",
                  outlineOffset: 2,
                }}/>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button className="btn btn-primary" onClick={() => onSave(form)}>
              {isNew ? "Registrar y generar QR →" : "Guardar cambios"}
            </button>
            <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          </div>
        </div>

        {/* Preview */}
        <aside style={{ position: "sticky", top: 24 }}>
          <div className="mono" style={{ marginBottom: 12 }}>Vista previa · Sello</div>
          <div style={{
            padding: 40, border: "1px dashed var(--line-2)", borderRadius: "var(--r-md)",
            background: "var(--paper-2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            aspectRatio: "1/1",
          }}>
            {form.nombre ? (
              <SelloCircular stand={form} size={180} rotation={-6}/>
            ) : (
              <div style={{ textAlign: "center", color: "var(--ink-3)", fontSize: 13 }}>
                <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, marginBottom: 4 }}>—</div>
                Completa el nombre<br/>para ver el sello
              </div>
            )}
          </div>
          <div className="mono" style={{ marginTop: 20, marginBottom: 12 }}>Logo del stand</div>
          <Placeholder height={120} label="Subir logo · PNG / SVG"/>
          <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 12 }}>
            + Cargar archivo
          </button>
        </aside>
      </div>
    </div>
  );
};

Object.assign(window, { AdminShell, LoginAdmin, StandsList, StandEditor });
