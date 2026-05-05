// Pasaporte real del usuario.
// URL: /pasaporte. Lee el correo de localStorage (lo guarda VoteFlow tras votar)
// y consulta /api/pasaportes/{correo} para obtener los stands visitados reales.

const PassportEmpty = () => (
  <div className="mobile-page">
    <div className="mobile-inner" style={{ textAlign: "center", padding: 40 }}>
      <div className="mono" style={{ marginBottom: 8 }}>Aún no tienes pasaporte</div>
      <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 38, fontWeight: 400, margin: "0 0 16px", lineHeight: 1.05 }}>
        Empieza tu travesía<br/>del café.
      </h2>
      <p style={{ color: "var(--ink-2)", lineHeight: 1.6, maxWidth: 360, margin: "0 auto 24px" }}>
        Escanea el QR de cualquier stand del festival y emite tu primer voto. Cada visita estampa una página en tu pasaporte.
      </p>
      <a href="/" data-route className="btn btn-ghost" style={{ justifyContent: "center" }}>← Ver el ranking</a>
    </div>
  </div>
);

const PassportPage = ({ stands }) => {
  const [email, setEmail] = React.useState(() => {
    try { return localStorage.getItem("lmt.email") || ""; } catch (_) { return ""; }
  });
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(0);
  const [flipping, setFlipping] = React.useState(false);
  const [askingEmail, setAskingEmail] = React.useState(!email);

  const load = React.useCallback(async (correo) => {
    setLoading(true); setError("");
    try {
      const res = await window.LMTApi.getPasaporte(correo);
      setData(res);
      setAskingEmail(false);
    } catch (e) {
      const code = String((e && (e.code || e.message)) || e);
      if (code.includes("not_found")) setError("Aún no hay pasaporte para ese correo. Vota en cualquier stand para crearlo.");
      else if (code.includes("bad_email")) setError("El correo no es válido.");
      else setError("No fue posible cargar tu pasaporte.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (email && window.LMTApi && window.LMTApi.enabled) load(email);
  }, [email, load]);

  if (askingEmail) {
    return (
      <div className="mobile-page">
        <div className="mobile-inner">
          <a href="/" data-route style={{ color: "var(--ink-3)", fontSize: 13 }}>← Volver al ranking</a>
          <div className="mono" style={{ marginTop: 24 }}>Mi pasaporte</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 36, fontWeight: 400, margin: "6px 0 12px", lineHeight: 1.05 }}>
            Identifícate con el<br/>correo que usaste<br/>al votar.
          </h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const sec = window.LMTSecurity;
            const v = (e.target.correo.value || "").trim();
            if (!sec || !sec.isEmail(v)) { setError("Correo inválido."); return; }
            try { localStorage.setItem("lmt.email", sec.normalizeEmail(v)); } catch (_) {}
            setEmail(v);
          }}>
            <div className="field" style={{ marginTop: 24 }}>
              <label>Correo</label>
              <input name="correo" type="email" inputMode="email" autoComplete="email" required maxLength={254} placeholder="nombre@correo.co"/>
            </div>
            {error && <div role="alert" style={{ color: "var(--bad)", fontSize: 13, marginTop: 8 }}>{error}</div>}
            <button className="btn btn-primary" type="submit" style={{ width: "100%", justifyContent: "center", padding: 14, marginTop: 20 }}>
              Ver mi pasaporte →
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="mobile-page"><div className="mobile-inner"><div className="splash">Cargando pasaporte…</div></div></div>;
  }

  if (error || !data) {
    return (
      <div className="mobile-page">
        <div className="mobile-inner" style={{ textAlign: "center", padding: 40 }}>
          <div className="mono">Pasaporte</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 32, fontWeight: 400, margin: "8px 0 16px", lineHeight: 1.1 }}>
            {error || "No fue posible cargar tu pasaporte."}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
            <button className="btn btn-ghost" onClick={() => { setAskingEmail(true); setError(""); }}>Cambiar correo</button>
            <a href="/" data-route className="btn btn-primary" style={{ justifyContent: "center" }}>Volver al ranking</a>
          </div>
        </div>
      </div>
    );
  }

  const visitadosIds = data.visitados || [];
  const visitados = visitadosIds.map((id) => stands.find((s) => s.id === id)).filter(Boolean);
  if (!visitados.length) return <PassportEmpty/>;

  const passport = {
    nombre: data.nombre || "Visitante",
    correo: data.correo || email,
    inicio: data.inicio || "",
    visitados: visitadosIds,
  };
  const pages = [
    { type: "cover" },
    { type: "index" },
    ...visitados.map((s) => ({ type: "stamp", stand: s })),
    { type: "end" },
  ];

  const go = (dir) => {
    if (flipping) return;
    const next = page + dir;
    if (next < 0 || next >= pages.length) return;
    setFlipping(true);
    setTimeout(() => { setPage(next); setFlipping(false); }, 380);
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--ink)", color: "var(--paper)", padding: "16px 16px 28px" }}>
      <div className="mobile-inner" style={{ background: "transparent", border: "none", boxShadow: "none", padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px", color: "var(--paper-3)" }}>
          <a href="/" data-route style={{ color: "var(--paper-3)", fontSize: 13 }}>← Salir</a>
          <div className="mono" style={{ color: "var(--paper-3)" }}>Pasaporte · {passport.nombre}</div>
          <button onClick={() => {
            try { localStorage.removeItem("lmt.email"); } catch (_) {}
            window.LMTRouter.go("/");
          }} style={{ color: "var(--paper-3)", fontSize: 12 }}>Cerrar</button>
        </div>

        <div style={{ marginTop: 18, aspectRatio: "0.72", perspective: "1400px", position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "6px 12px 12px 6px", boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6), -3px 0 0 rgba(0,0,0,0.3)" }}/>
          <div style={{
            position: "absolute", inset: 0, borderRadius: "6px 12px 12px 6px",
            background: "var(--paper)", color: "var(--ink)", overflow: "hidden",
            transformStyle: "preserve-3d", transformOrigin: "left center",
            transform: flipping ? "rotateY(-12deg)" : "rotateY(0deg)",
            transition: "transform 0.5s cubic-bezier(.4,.1,.3,1)",
          }}>
            <PassportPage_Page pageData={pages[page]} passport={passport} totalSlots={Math.max(8, visitados.length)} totalStands={stands.length}/>
          </div>
        </div>

        <div style={{ marginTop: 18, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
          <button onClick={() => go(-1)} disabled={page === 0} style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "var(--paper)", color: "var(--ink)", opacity: page === 0 ? 0.3 : 1,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>←</button>
          <div className="mono" style={{ color: "var(--paper-3)" }}>
            {String(page + 1).padStart(2, "0")} / {String(pages.length).padStart(2, "0")}
          </div>
          <button onClick={() => go(1)} disabled={page === pages.length - 1} style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "var(--paper)", color: "var(--ink)", opacity: page === pages.length - 1 ? 0.3 : 1,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>→</button>
        </div>
        <div className="mono" style={{ textAlign: "center", color: "var(--paper-3)", marginTop: 14, lineHeight: 1.6 }}>
          {visitados.length} / {stands.length} stands sellados
        </div>
      </div>
    </div>
  );
};

const PassportPage_Page = ({ pageData, passport, totalSlots, totalStands }) => {
  const lineBg = { backgroundImage: "repeating-linear-gradient(var(--paper) 0, var(--paper) 26px, var(--line) 26px, var(--line) 27px)" };

  if (pageData.type === "cover") {
    return (
      <div style={{
        height: "100%", padding: 28, display: "flex", flexDirection: "column", justifyContent: "space-between",
        background: "linear-gradient(135deg, var(--grano) 0%, oklch(0.32 0.08 45) 100%)", color: "var(--paper)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ filter: "invert(1) hue-rotate(180deg)" }}><LogoTaza size={36}/></div>
          <div className="mono" style={{ color: "var(--paper-3)", textAlign: "right" }}>NARIÑO<br/>COLOMBIA</div>
        </div>
        <div>
          <div className="mono" style={{ color: "var(--paper-3)" }}>Pasaporte del Café</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 48, fontWeight: 400, margin: "6px 0 0", lineHeight: 0.9, letterSpacing: "-0.02em" }}>
            La Mejor<br/>Taza.
          </h1>
        </div>
        <div>
          <div style={{ height: 1, background: "var(--paper-3)", opacity: 0.3, marginBottom: 16 }}/>
          <div className="mono" style={{ color: "var(--paper-3)", marginBottom: 4 }}>Portador</div>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 26, fontWeight: 400 }}>{passport.nombre}</div>
          <div style={{ fontSize: 12, color: "var(--paper-3)", marginTop: 6 }}>{passport.correo}</div>
        </div>
      </div>
    );
  }

  if (pageData.type === "index") {
    return (
      <div style={{ height: "100%", padding: 22, ...lineBg }}>
        <div className="mono" style={{ marginBottom: 6 }}>Índice</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 28, fontWeight: 400, margin: "0 0 16px", lineHeight: 1 }}>
          Tu travesía.
        </h2>
        <p style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 16, lineHeight: 1.5 }}>
          Cada stand visitado sella una página. Colecciónalos todos.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...Array(totalSlots)].map((_, i) => {
            const visitado = i < passport.visitados.length;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                <span className="mono" style={{ width: 20 }}>{String(i + 1).padStart(2, "0")}</span>
                <span style={{ flex: 1, borderBottom: "1px dotted var(--line-2)", height: 14 }}/>
                <span style={{ fontSize: 16 }}>{visitado ? "●" : "○"}</span>
              </div>
            );
          })}
        </div>
        <div className="mono" style={{ position: "absolute", bottom: 22, left: 22, right: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{passport.visitados.length} sellados</span>
            <span>{Math.max(0, totalStands - passport.visitados.length)} faltantes</span>
          </div>
        </div>
      </div>
    );
  }

  if (pageData.type === "stamp") {
    const s = pageData.stand;
    const rot = ((s.id.charCodeAt(s.id.length - 1) || 0) % 20) - 10;
    return (
      <div style={{ height: "100%", padding: 22, ...lineBg, position: "relative", overflow: "hidden" }}>
        <div className="mono" style={{ marginBottom: 6 }}>Sello · {s.municipio}</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 26, fontWeight: 400, margin: "0 0 4px", lineHeight: 1 }}>
          {s.nombre}
        </h2>
        <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{s.region}</div>
        <div style={{
          position: "absolute", top: "48%", left: "52%", transform: "translate(-50%, -50%)",
          "--stamp-rot": rot + "deg",
          animation: "stamp-land 0.6s cubic-bezier(.2,.8,.2,1.2) forwards",
        }}>
          <SelloCircular stand={s} size={150} rotation={rot}/>
        </div>
        <div style={{ position: "absolute", bottom: 22, left: 22, right: 22 }}>
          <div style={{ fontSize: 11, color: "var(--ink-2)", lineHeight: 1.5, fontStyle: "italic", fontFamily: "var(--font-display)" }}>
            "{s.descripcion}"
          </div>
        </div>
      </div>
    );
  }

  if (pageData.type === "end") {
    return (
      <div style={{ height: "100%", padding: 28, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", ...lineBg }}>
        <div className="mono">Fin del pasaporte</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 30, fontWeight: 400, margin: "12px 0 8px", lineHeight: 1 }}>
          Gracias por<br/>caminar el café<br/>con nosotros.
        </h2>
        <div style={{ marginTop: 20, padding: "12px 18px", border: "1px solid var(--line-2)", borderRadius: 999, fontSize: 12 }}>
          Vuelve el próximo festival
        </div>
      </div>
    );
  }
  return null;
};

Object.assign(window, { PassportPage });
