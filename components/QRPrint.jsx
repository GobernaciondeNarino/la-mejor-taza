// Vista QR para imprimir (A5) + selector + acción de impresión real.

const QRPoster = ({ stand, variant = "vertical" }) => {
  const url = standUrl(stand.id);
  return (
    <div className="qr-poster" style={{
      width: 420, height: 594, background: "var(--paper)",
      border: "1px solid var(--line-2)", padding: 36,
      display: "flex", flexDirection: "column",
      boxShadow: "var(--shadow-2)", position: "relative",
      fontFamily: "var(--font-sans)",
    }}>
      {[["tl"],["tr"],["bl"],["br"]].map(([p], i) => {
        const pos = {
          tl: { top: 8, left: 8, borderTop: "1px solid var(--ink-3)", borderLeft: "1px solid var(--ink-3)" },
          tr: { top: 8, right: 8, borderTop: "1px solid var(--ink-3)", borderRight: "1px solid var(--ink-3)" },
          bl: { bottom: 8, left: 8, borderBottom: "1px solid var(--ink-3)", borderLeft: "1px solid var(--ink-3)" },
          br: { bottom: 8, right: 8, borderBottom: "1px solid var(--ink-3)", borderRight: "1px solid var(--ink-3)" },
        }[p];
        return <div key={i} style={{ position: "absolute", width: 14, height: 14, ...pos }}/>;
      })}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Wordmark size={14}/>
        <div className="mono" style={{ textAlign: "right" }}>
          #{stand.id.toUpperCase()}<br/>
          <span style={{ color: "var(--ink-3)" }}>Festival 2026</span>
        </div>
      </div>

      <div style={{ marginTop: 20, marginBottom: 16 }}>
        <div className="mono">Escanea para calificar</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 44, fontWeight: 400, lineHeight: 1, margin: "6px 0 0", letterSpacing: "-0.01em" }}>{stand.nombre}</h1>
        <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 8 }}>
          {stand.municipio} · {stand.region}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16, border: "1px solid var(--line)", borderRadius: "var(--r-md)", position: "relative", background: "#fff" }}>
        <QRCode data={url} size={240} fg="#111111" bg="#ffffff"/>
        <div className="mono" style={{ marginTop: 14, color: "var(--ink-2)", textAlign: "center", maxWidth: 320, wordBreak: "break-all" }}>{url}</div>
        <div style={{ position: "absolute", top: -20, right: -20 }}>
          <SelloCircular stand={stand} size={80} rotation={12}/>
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "var(--ink-2)" }}>Califica. Opina. Sella tu pasaporte.</span>
          <div style={{ display: "flex", gap: 6, fontSize: 20 }}>
            <span>😞</span><span>😐</span><span>😍</span>
          </div>
        </div>
        <div style={{ height: 1, background: "var(--line)" }}/>
        <div className="mono" style={{ marginTop: 8, display: "flex", justifyContent: "space-between" }}>
          <span>Pega en el frente del stand</span>
          <span>· 14—20 abr · Pasto</span>
        </div>
      </div>
    </div>
  );
};

const QRPrintView = ({ stands }) => {
  const [selected, setSelected] = React.useState(stands[0] ? stands[0].id : null);
  const [printAll, setPrintAll] = React.useState(false);
  const stand = stands.find((s) => s.id === selected) || stands[0];

  React.useEffect(() => {
    if (!printAll) return;
    const t = setTimeout(() => {
      window.print();
      setPrintAll(false);
    }, 250);
    return () => clearTimeout(t);
  }, [printAll]);

  if (!stand) {
    return (
      <div style={{ padding: "40px 48px" }}>
        <div className="mono">Códigos QR</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 36, fontWeight: 400, margin: "4px 0 18px" }}>Aún no hay stands.</h1>
        <a href="/admin/stands/new" data-route className="btn btn-primary">+ Registrar el primero</a>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 48px" }} className="qr-print-screen">
      <style>{`
        @media print {
          @page { size: A5; margin: 0; }
          body { background: #fff !important; }
          .qr-print-screen aside, .qr-print-screen .mono, .qr-print-screen h1, .qr-print-screen .qr-frame, .lmt-admin-aside { display: none !important; }
          .qr-print-screen { padding: 0 !important; }
          .qr-print-page { display: block !important; page-break-after: always; padding: 0; background: #fff; }
          .qr-poster { box-shadow: none !important; border: none !important; transform: none !important; margin: 0 auto; }
          aside, header { display: none !important; }
        }
      `}</style>

      <div className="mono">Códigos QR · Imprimir y pegar</div>
      <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 40, fontWeight: 400, margin: "4px 0 22px" }}>
        Carteles A5
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 36, alignItems: "flex-start" }}>
        <aside>
          <div className="mono" style={{ marginBottom: 12 }}>Seleccionar stand</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 460, overflow: "auto", border: "1px solid var(--line)", borderRadius: "var(--r-sm)" }}>
            {stands.map((s) => (
              <button key={s.id} onClick={() => setSelected(s.id)} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 0,
                background: selected === s.id ? "var(--paper-2)" : "transparent",
                textAlign: "left",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color, flexShrink: 0 }}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: selected === s.id ? 500 : 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.nombre}</div>
                  <div className="mono" style={{ fontSize: 9 }}>{s.id}</div>
                </div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 18, padding: 16, border: "1px solid var(--line)", borderRadius: "var(--r-md)" }}>
            <div className="mono" style={{ marginBottom: 8 }}>Acciones</div>
            <button className="btn btn-primary" onClick={() => window.print()} style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}>
              🖨 Imprimir este cartel
            </button>
            <button className="btn btn-ghost" onClick={() => setPrintAll(true)} style={{ width: "100%", justifyContent: "center", marginBottom: 8 }}>
              Imprimir todos ({stands.length})
            </button>
            <a href={standUrl(stand.id)} target="_blank" rel="noopener" className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginBottom: 8, textDecoration: "none" }}>
              Probar URL del QR ↗
            </a>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 8, lineHeight: 1.5 }}>
              Cartel A5 · 148 × 210 mm · Papel offset mate recomendado.<br/>
              Para PDF: imprimir → "Guardar como PDF".
            </div>
          </div>
        </aside>

        <div className="qr-frame" style={{
          background: "var(--paper-2)", padding: 40, borderRadius: "var(--r-md)",
          border: "1px solid var(--line)", display: "flex", justifyContent: "center",
          backgroundImage: "linear-gradient(45deg, var(--paper-2) 25%, transparent 25%), linear-gradient(-45deg, var(--paper-2) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--paper-2) 75%), linear-gradient(-45deg, transparent 75%, var(--paper-2) 75%)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
        }}>
          {printAll ? (
            stands.map((s) => (
              <div key={s.id} className="qr-print-page"><QRPoster stand={s}/></div>
            ))
          ) : (
            <QRPoster stand={stand}/>
          )}
        </div>
      </div>
    </div>
  );
};

const ActivityLive = ({ stands, comentarios }) => {
  const standMap = Object.fromEntries(stands.map((s) => [s.id, s]));
  const getEmoji = (e) => ({ bueno: "😍", regular: "😐", malo: "😞" }[e] || "•");

  return (
    <div style={{ padding: "40px 48px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="mono">Actividad</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999, background: "oklch(0.6 0.14 145 / 0.12)", color: "var(--good)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--good)", animation: "pulse 2s infinite" }}/>
          <span className="mono" style={{ color: "var(--good)" }}>En vivo</span>
        </div>
      </div>
      <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 40, fontWeight: 400, margin: "4px 0 22px" }}>
        Votos en tiempo real
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 22 }}>
        <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 18 }}>
          <div className="mono" style={{ marginBottom: 14 }}>Últimos votos</div>
          {comentarios.length === 0 && (
            <div className="mono" style={{ color: "var(--ink-3)" }}>Aún no hay votos.</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {comentarios.slice(0, 8).map((c, i) => {
              const s = standMap[c.stand];
              return (
                <div key={i} style={{ display: "flex", gap: 12, paddingBottom: 12, borderBottom: i < Math.min(comentarios.length, 8) - 1 ? "1px solid var(--line)" : "none", animation: i === 0 ? "fade-up 0.4s" : "none" }}>
                  <div style={{ fontSize: 22, lineHeight: 1 }}>{getEmoji(c.emoji)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{s ? s.nombre : c.stand}</div>
                    {c.texto && (
                      <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4, lineHeight: 1.4 }}>"{c.texto}"</div>
                    )}
                    <div className="mono" style={{ marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap" }}>
                      <span>{c.autor}</span>
                      <span>·</span>
                      <span>{c.hora}</span>
                      {c.compra && <span style={{ color: "var(--cafeto)" }}>· Compró</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 18 }}>
          <div className="mono" style={{ marginBottom: 14 }}>Ranking actual</div>
          {[...stands].sort((a, b) => calcScore(b.votos) - calcScore(a.votos)).slice(0, 8).map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "10px 0", borderBottom: i < Math.min(stands.length, 8) - 1 ? "1px solid var(--line)" : "none" }}>
              <span className="mono" style={{ width: 24, fontSize: 13 }}>{String(i + 1).padStart(2, "0")}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{s.nombre}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{s.municipio} · {totalVotos(s.votos)} votos</div>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22 }}>{calcScore(s.votos).toFixed(0)}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24, padding: 18, border: "1px solid var(--line)", borderRadius: "var(--r-md)", background: "var(--paper)" }}>
        <div className="mono" style={{ marginBottom: 10 }}>Exportar para reportes</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href={(window.LMT_API_BASE || "/api") + "/export/votos.csv"} className="btn btn-ghost" download>⤓ Votos (CSV)</a>
          <a href={(window.LMT_API_BASE || "/api") + "/export/stands.csv"} className="btn btn-ghost" download>⤓ Stands (CSV)</a>
          <a href={(window.LMT_API_BASE || "/api") + "/export/pasaportes.csv"} className="btn btn-ghost" download>⤓ Pasaportes (CSV)</a>
        </div>
        <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 8 }}>
          Las descargas requieren sesión activa de administrador.
        </div>
      </div>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
};

Object.assign(window, { QRPoster, QRPrintView, ActivityLive });
