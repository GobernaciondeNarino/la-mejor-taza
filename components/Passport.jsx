// Pasaporte con efecto libreta 3D (anime.js opcional)
// Usa CSS transform 3D; anime.js se usa para los sellos que aterrizan al cambiar de página.

const Passport = ({ stands, passport, onBack }) => {
  const [page, setPage] = React.useState(0);
  const [flipping, setFlipping] = React.useState(false);

  const visitados = passport.visitados.map(id => stands.find(s => s.id === id)).filter(Boolean);
  // Páginas: 0 portada, 1 índice, 2..N cada visita, N+1 cierre
  const pages = [
    { type: "cover" },
    { type: "index" },
    ...visitados.map(s => ({ type: "stamp", stand: s })),
    { type: "end" },
  ];

  const go = (dir) => {
    if (flipping) return;
    const next = page + dir;
    if (next < 0 || next >= pages.length) return;
    setFlipping(true);
    setTimeout(() => {
      setPage(next);
      setFlipping(false);
    }, 500);
  };

  return (
    <div style={{ padding: "16px 16px 24px", minHeight: "100%", display: "flex", flexDirection: "column", background: "var(--ink)", color: "var(--paper)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px" }}>
        <button onClick={onBack} style={{ color: "var(--paper-3)", fontSize: 13 }}>← Volver</button>
        <div className="mono" style={{ color: "var(--paper-3)" }}>Pasaporte · {passport.nombre}</div>
        <span style={{ width: 40 }}/>
      </div>

      {/* Libreta 3D */}
      <div style={{
        marginTop: 20,
        aspectRatio: "0.72",
        perspective: "1400px",
        position: "relative",
      }}>
        {/* Lomo / sombra */}
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: "6px 12px 12px 6px",
          boxShadow: "0 30px 60px -20px rgba(0,0,0,0.6), -3px 0 0 rgba(0,0,0,0.3)",
        }}/>
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: "6px 12px 12px 6px",
          background: "var(--paper)",
          color: "var(--ink)",
          overflow: "hidden",
          transformStyle: "preserve-3d",
          transformOrigin: "left center",
          transform: flipping ? "rotateY(-12deg)" : "rotateY(0deg)",
          transition: "transform 0.5s cubic-bezier(.4,.1,.3,1)",
        }}>
          <PassportPage pageData={pages[page]} passport={passport} pageNum={page} total={pages.length}/>
        </div>
      </div>

      {/* Controles */}
      <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
        <button onClick={() => go(-1)} disabled={page === 0} style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "var(--paper)", color: "var(--ink)",
          opacity: page === 0 ? 0.3 : 1,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>←</button>
        <div className="mono" style={{ color: "var(--paper-3)" }}>
          {String(page + 1).padStart(2, "0")} / {String(pages.length).padStart(2, "0")}
        </div>
        <button onClick={() => go(1)} disabled={page === pages.length - 1} style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "var(--paper)", color: "var(--ink)",
          opacity: page === pages.length - 1 ? 0.3 : 1,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>→</button>
      </div>

      <div className="mono" style={{ textAlign: "center", color: "var(--paper-3)", marginTop: 16, lineHeight: 1.6 }}>
        {visitados.length} / {stands.length} stands sellados<br/>
        desliza o usa las flechas
      </div>
    </div>
  );
};

const PassportPage = ({ pageData, passport, pageNum, total }) => {
  const lineBg = {
    backgroundImage: "repeating-linear-gradient(var(--paper) 0, var(--paper) 26px, var(--line) 26px, var(--line) 27px)",
  };

  if (pageData.type === "cover") {
    return (
      <div style={{
        height: "100%", padding: 32,
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        background: "linear-gradient(135deg, var(--grano) 0%, oklch(0.32 0.08 45) 100%)",
        color: "var(--paper)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ filter: "invert(1) hue-rotate(180deg)" }}>
            <LogoTaza size={40}/>
          </div>
          <div className="mono" style={{ color: "var(--paper-3)", textAlign: "right" }}>
            NARIÑO<br/>COLOMBIA
          </div>
        </div>

        <div>
          <div className="mono" style={{ color: "var(--paper-3)" }}>Pasaporte del Café</div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontStyle: "italic",
            fontSize: 56, fontWeight: 400, margin: "6px 0 0",
            lineHeight: 0.9, letterSpacing: "-0.02em",
          }}>
            La Mejor<br/>Taza.
          </h1>
        </div>

        <div>
          <div style={{ height: 1, background: "var(--paper-3)", opacity: 0.3, marginBottom: 16 }}/>
          <div className="mono" style={{ color: "var(--paper-3)", marginBottom: 4 }}>Portadora</div>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 28, fontWeight: 400 }}>
            {passport.nombre}
          </div>
          <div style={{ fontSize: 12, color: "var(--paper-3)", marginTop: 6 }}>{passport.correo}</div>
          <div className="mono" style={{ color: "var(--paper-3)", marginTop: 16, display: "flex", justifyContent: "space-between" }}>
            <span>Inicio: {passport.inicio}</span>
            <span>#P-0142</span>
          </div>
        </div>
      </div>
    );
  }

  if (pageData.type === "index") {
    return (
      <div style={{ height: "100%", padding: 24, ...lineBg }}>
        <div className="mono" style={{ marginBottom: 8 }}>Índice</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 30, fontWeight: 400, margin: "0 0 20px", lineHeight: 1 }}>
          Tu travesía.
        </h2>
        <p style={{ fontSize: 12, color: "var(--ink-2)", marginBottom: 20, lineHeight: 1.5 }}>
          Cada stand que visites sella una página. Colecciona los 8 del festival.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[...Array(8)].map((_, i) => {
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
        <div style={{ position: "absolute", bottom: 24, left: 24, right: 24 }} className="mono">
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{passport.visitados.length} sellados</span>
            <span>{8 - passport.visitados.length} faltantes</span>
          </div>
        </div>
      </div>
    );
  }

  if (pageData.type === "stamp") {
    const s = pageData.stand;
    return (
      <div style={{ height: "100%", padding: 24, ...lineBg, position: "relative", overflow: "hidden" }}>
        <div className="mono" style={{ marginBottom: 6 }}>Sello · {s.municipio}</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 28, fontWeight: 400, margin: "0 0 4px", lineHeight: 1 }}>
          {s.nombre}
        </h2>
        <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{s.region}</div>

        {/* Sello aterrizado */}
        <div style={{
          position: "absolute",
          top: "48%", left: "52%",
          transform: "translate(-50%, -50%)",
          "--stamp-rot": `${(s.id.charCodeAt(3) % 20) - 10}deg`,
          animation: "stamp-land 0.6s cubic-bezier(.2,.8,.2,1.2) forwards",
        }}>
          <SelloCircular stand={s} size={160} rotation={(s.id.charCodeAt(3) % 20) - 10}/>
        </div>

        {/* Datos al pie */}
        <div style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
          <div style={{ fontSize: 11, color: "var(--ink-2)", lineHeight: 1.5, fontStyle: "italic", fontFamily: "var(--font-display)" }}>
            "{s.descripcion}"
          </div>
          <div className="mono" style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
            <span>14·abr·2026</span>
            <span>08:42</span>
          </div>
        </div>
      </div>
    );
  }

  if (pageData.type === "end") {
    return (
      <div style={{ height: "100%", padding: 32, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", ...lineBg }}>
        <div className="mono">Fin del pasaporte</div>
        <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 34, fontWeight: 400, margin: "12px 0 8px", lineHeight: 1 }}>
          Gracias por<br/>caminar el café<br/>con nosotros.
        </h2>
        <div style={{ marginTop: 24, padding: "14px 20px", border: "1px solid var(--line-2)", borderRadius: 999, fontSize: 12 }}>
          Vuelve el próximo festival
        </div>
      </div>
    );
  }

  return null;
};

Object.assign(window, { Passport });
