// Dashboard público con mapa + ranking + live + detalle

const PublicDashboard = ({ stands, comentarios, onDetail }) => {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 2500);
    return () => clearInterval(t);
  }, []);

  const sorted = [...stands].sort((a, b) => calcScore(b.votos) - calcScore(a.votos));
  const top3 = sorted.slice(0, 3);
  const totalVotosAll = stands.reduce((a, s) => a + totalVotos(s.votos), 0);

  return (
    <div style={{ minHeight: "100%", background: "var(--paper)" }}>
      {/* Header */}
      <header style={{
        padding: "24px 48px",
        borderBottom: "1px solid var(--line)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--paper)",
      }}>
        <Wordmark size={18}/>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--good)", animation: "pulse 2s infinite" }}/>
            <span className="mono" style={{ color: "var(--good)" }}>En vivo · actualiza automáticamente</span>
          </div>
          <div className="mono" style={{ color: "var(--ink-3)" }}>Día 1 de 7 · Festival 2026</div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ padding: "48px 48px 32px", display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 48, alignItems: "flex-end" }}>
        <div>
          <div className="mono">Ranking público</div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontStyle: "italic",
            fontSize: 96, fontWeight: 400, margin: "8px 0 0",
            lineHeight: 0.9, letterSpacing: "-0.03em",
          }}>
            ¿Cuál es la<br/>mejor taza de<br/><span style={{ color: "var(--galeras)" }}>Nariño</span>?
          </h1>
          <p style={{ fontSize: 15, color: "var(--ink-2)", marginTop: 20, maxWidth: 520, lineHeight: 1.6 }}>
            El festival lo decide el público. Escanea el QR de cada stand, vota con un emoji y sella tu pasaporte.
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {[
            { k: totalVotosAll.toLocaleString(), sub: "votos totales" },
            { k: "1.247", sub: "pasaportes activos" },
            { k: stands.length, sub: "stands participan" },
            { k: "87%", sub: "aprobación general" },
          ].map((m, i) => (
            <div key={i} style={{ padding: 20, border: "1px solid var(--line)", borderRadius: "var(--r-md)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 40, fontStyle: "italic", lineHeight: 1 }}>{m.k}</div>
              <div className="mono" style={{ marginTop: 8 }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Podio */}
      <section style={{ padding: "24px 48px 48px" }}>
        <div className="mono" style={{ marginBottom: 16 }}>Top 3 · Podio en vivo</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: 16, alignItems: "flex-end" }}>
          {[top3[1], top3[0], top3[2]].map((s, displayIdx) => {
            const actualRank = [2, 1, 3][displayIdx];
            const h = [200, 260, 170][displayIdx];
            return (
              <div key={s.id} onClick={() => onDetail(s.id)} style={{ cursor: "pointer" }}>
                <div style={{
                  height: h,
                  background: actualRank === 1 ? "var(--ink)" : "var(--paper-2)",
                  color: actualRank === 1 ? "var(--paper)" : "var(--ink)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--r-md)",
                  padding: 20,
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  position: "relative", overflow: "hidden",
                }}>
                  <div className="mono" style={{ color: actualRank === 1 ? "var(--paper-3)" : "var(--ink-3)" }}>
                    #{actualRank} {actualRank === 1 && "· La Mejor Taza"}
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: actualRank === 1 ? 40 : 28, fontWeight: 400, lineHeight: 1, letterSpacing: "-0.01em" }}>
                      {s.nombre}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 8, opacity: 0.7 }}>
                      {s.municipio}
                    </div>
                    <div style={{ marginTop: 14, display: "flex", alignItems: "baseline", gap: 10 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 32 }}>
                        {calcScore(s.votos).toFixed(0)}
                      </span>
                      <span className="mono" style={{ color: actualRank === 1 ? "var(--paper-3)" : "var(--ink-3)" }}>
                        / 100 · {totalVotos(s.votos)} votos
                      </span>
                    </div>
                  </div>
                  {/* Sello decorativo en el ganador */}
                  {actualRank === 1 && (
                    <div style={{ position: "absolute", top: 20, right: 20 }}>
                      <SelloCircular stand={s} size={110} rotation={10}/>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mapa + Live feed */}
      <section style={{ padding: "0 48px 48px", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
        <MapaNarino stands={stands} onDetail={onDetail}/>
        <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div className="mono">Últimos votos</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--good)", animation: "pulse 2s infinite" }}/>
              <span className="mono" style={{ color: "var(--good)" }}>Live</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {comentarios.slice(0, 5).map((c, i) => {
              const s = stands.find(x => x.id === c.stand);
              const emoji = { bueno: "😍", regular: "😐", malo: "😞" }[c.emoji];
              return (
                <div key={i} onClick={() => onDetail(c.stand)} style={{
                  display: "flex", gap: 12, paddingBottom: 14,
                  borderBottom: i < 4 ? "1px solid var(--line)" : "none",
                  cursor: "pointer",
                  animation: i === 0 ? "fade-up 0.4s" : "none",
                }}>
                  <div style={{ fontSize: 22 }}>{emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{s.nombre}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-2)", marginTop: 4, lineHeight: 1.4, fontStyle: "italic", fontFamily: "var(--font-display)" }}>
                      "{c.texto}"
                    </div>
                    <div className="mono" style={{ marginTop: 6 }}>
                      {c.autor} · {c.hora} {c.compra && <span style={{ color: "var(--cafeto)" }}>· compró</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tabla completa */}
      <section style={{ padding: "0 48px 64px" }}>
        <div className="mono" style={{ marginBottom: 16 }}>Tabla completa · {stands.length} stands</div>
        <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
          {sorted.map((s, i) => (
            <div key={s.id} onClick={() => onDetail(s.id)} style={{
              display: "grid", gridTemplateColumns: "60px 2.5fr 1.5fr 1fr 1fr 1fr",
              padding: "18px 24px",
              borderBottom: i < sorted.length - 1 ? "1px solid var(--line)" : "none",
              cursor: "pointer", alignItems: "center",
            }}>
              <div className="mono" style={{ fontSize: 13 }}>{String(i + 1).padStart(2, "0")}</div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, letterSpacing: "-0.01em" }}>{s.nombre}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{s.descripcion.slice(0, 80)}…</div>
              </div>
              <div style={{ fontSize: 13 }}>{s.municipio}</div>
              <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 26 }}>{calcScore(s.votos).toFixed(0)}</div>
              <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{totalVotos(s.votos)} votos</div>
              <BarraVotos votos={s.votos}/>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "40px 48px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Wordmark size={14}/>
        <div className="mono" style={{ color: "var(--ink-3)" }}>
          Comité del Café · Gobernación de Nariño · 2026
        </div>
      </footer>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </div>
  );
};

const MapaNarino = ({ stands, onDetail }) => {
  const [hover, setHover] = React.useState(null);
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: "var(--r-md)", padding: 24, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div className="mono">Mapa · Nariño</div>
        <div className="mono" style={{ color: "var(--ink-3)" }}>{stands.length} stands ubicados</div>
      </div>
      <div style={{
        aspectRatio: "1.3",
        position: "relative",
        background: "var(--paper-2)",
        borderRadius: "var(--r-sm)",
        overflow: "hidden",
      }} className="paper-texture">
        {/* Silueta estilizada Nariño */}
        <svg width="100%" height="100%" viewBox="0 0 100 76" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0 }}>
          {/* Contorno aprox de Nariño */}
          <path
            d="M 15 10 L 25 5 L 45 8 L 58 4 L 70 12 L 82 18 L 88 28 L 90 40 L 85 50 L 78 58 L 68 64 L 55 68 L 42 70 L 28 68 L 18 62 L 10 52 L 8 40 L 10 28 L 15 18 Z"
            fill="var(--paper)"
            stroke="var(--line-2)"
            strokeWidth="0.3"
            strokeDasharray="0.5 0.5"
          />
          {/* Volcán Galeras marker */}
          <g transform="translate(52, 50)">
            <path d="M -3 0 L 0 -5 L 3 0 Z" fill="var(--ink-3)" opacity="0.4"/>
            <text x="0" y="6" textAnchor="middle" fontSize="2.2" fill="var(--ink-3)" fontFamily="var(--font-mono)">GALERAS</text>
          </g>
          {/* Texto Pacífico */}
          <text x="6" y="60" fontSize="2.2" fill="var(--ink-3)" fontFamily="var(--font-mono)" opacity="0.6">OCÉANO PACÍFICO</text>
          <text x="78" y="10" fontSize="2.2" fill="var(--ink-3)" fontFamily="var(--font-mono)" opacity="0.6">CAUCA →</text>
        </svg>

        {/* Puntos */}
        {stands.map(s => {
          const rank = [...stands].sort((a,b) => calcScore(b.votos) - calcScore(a.votos)).findIndex(x => x.id === s.id) + 1;
          const size = rank === 1 ? 28 : rank <= 3 ? 22 : 16;
          return (
            <button
              key={s.id}
              onClick={() => onDetail(s.id)}
              onMouseEnter={() => setHover(s.id)}
              onMouseLeave={() => setHover(null)}
              style={{
                position: "absolute",
                left: `${s.coords.x * 100}%`,
                top: `${s.coords.y * 100}%`,
                transform: "translate(-50%, -50%)",
                width: size, height: size,
                borderRadius: "50%",
                background: s.color,
                border: "2px solid var(--paper)",
                boxShadow: hover === s.id ? `0 0 0 6px ${s.color.replace(")", " / 0.2)")}` : "0 2px 4px oklch(0.22 0.02 60 / 0.2)",
                transition: "box-shadow 0.2s",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--paper)", fontSize: 10, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {rank <= 3 ? rank : ""}
              {hover === s.id && (
                <div style={{
                  position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
                  transform: "translateX(-50%)",
                  background: "var(--ink)", color: "var(--paper)",
                  padding: "8px 12px", borderRadius: "var(--r-sm)",
                  whiteSpace: "nowrap", fontSize: 12, fontWeight: 500,
                  pointerEvents: "none",
                }}>
                  {s.nombre}
                  <div style={{ fontSize: 10, opacity: 0.7, fontWeight: 400 }}>{s.municipio} · {calcScore(s.votos).toFixed(0)}/100</div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="mono" style={{ marginTop: 12, display: "flex", gap: 16, color: "var(--ink-3)" }}>
        <span>● Top 3</span>
        <span>● Participantes</span>
        <span style={{ marginLeft: "auto" }}>Toca un punto para ver detalle</span>
      </div>
    </div>
  );
};

const PublicDetail = ({ stand, comentarios, allStands, onBack, onVote }) => {
  const commentsForStand = comentarios.filter(c => c.stand === stand.id);
  const rank = [...allStands].sort((a,b) => calcScore(b.votos) - calcScore(a.votos)).findIndex(x => x.id === stand.id) + 1;
  return (
    <div style={{ minHeight: "100%", background: "var(--paper)" }}>
      <header style={{ padding: "24px 48px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onBack} className="btn btn-ghost">← Ranking</button>
        <Wordmark size={16}/>
      </header>
      <section style={{ padding: "48px 48px 24px", display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 48 }}>
        <div>
          <div className="mono">Posición #{rank} · {stand.municipio}</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 80, fontWeight: 400, margin: "8px 0 0", lineHeight: 0.9, letterSpacing: "-0.02em" }}>
            {stand.nombre}
          </h1>
          <p style={{ fontSize: 16, color: "var(--ink-2)", marginTop: 20, maxWidth: 540, lineHeight: 1.6 }}>
            {stand.descripcion}
          </p>
          <div style={{ marginTop: 32, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { k: "Calificación", v: calcScore(stand.votos).toFixed(0), sub: "/ 100" },
              { k: "Votos", v: totalVotos(stand.votos), sub: "totales" },
              { k: "Aprobación", v: `${Math.round(stand.votos.bueno / totalVotos(stand.votos) * 100)}%`, sub: "excelente" },
            ].map(m => (
              <div key={m.k} style={{ padding: 16, border: "1px solid var(--line)", borderRadius: "var(--r-md)" }}>
                <div className="mono">{m.k}</div>
                <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 36, marginTop: 6, lineHeight: 1 }}>{m.v}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{m.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 32, padding: 20, background: "var(--paper-2)", borderRadius: "var(--r-md)" }}>
            <div className="mono" style={{ marginBottom: 12 }}>Distribución</div>
            {[
              { k: "Excelente", v: stand.votos.bueno, color: "var(--good)", emoji: "😍" },
              { k: "Regular", v: stand.votos.regular, color: "var(--meh)", emoji: "😐" },
              { k: "Malo", v: stand.votos.malo, color: "var(--bad)", emoji: "😞" },
            ].map(r => {
              const pct = (r.v / totalVotos(stand.votos)) * 100;
              return (
                <div key={r.k} style={{ display: "flex", alignItems: "center", gap: 14, padding: "8px 0" }}>
                  <span style={{ fontSize: 20 }}>{r.emoji}</span>
                  <span style={{ width: 80, fontSize: 13 }}>{r.k}</span>
                  <div style={{ flex: 1, height: 6, background: "var(--paper)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: r.color, transition: "width 0.5s" }}/>
                  </div>
                  <span className="mono" style={{ width: 60, textAlign: "right" }}>{pct.toFixed(0)}% · {r.v}</span>
                </div>
              );
            })}
          </div>
        </div>
        <aside>
          <div style={{ aspectRatio: "1/1.3", background: stand.color, borderRadius: "var(--r-md)", padding: 32, color: "var(--paper)", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
            <div className="mono" style={{ color: "oklch(0.95 0.01 75)" }}>#{stand.id.toUpperCase()}</div>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 48, lineHeight: 0.95, letterSpacing: "-0.02em" }}>
                {stand.nombre}
              </div>
              <div style={{ fontSize: 13, marginTop: 12, opacity: 0.85 }}>{stand.direccion}</div>
              <div style={{ fontSize: 13, marginTop: 4, opacity: 0.85 }}>{stand.correo}</div>
            </div>
            <button onClick={onVote} className="btn" style={{ background: "var(--paper)", color: "var(--ink)", justifyContent: "center", padding: 14 }}>
              Escanear y votar →
            </button>
          </div>
          <div style={{ marginTop: 20 }}>
            <div className="mono" style={{ marginBottom: 10 }}>Comentarios recientes</div>
            {commentsForStand.length === 0 && (
              <div style={{ fontSize: 13, color: "var(--ink-3)", fontStyle: "italic", fontFamily: "var(--font-display)" }}>
                Aún no hay comentarios. Sé el primero.
              </div>
            )}
            {commentsForStand.map((c, i) => (
              <div key={i} style={{ padding: "12px 0", borderBottom: i < commentsForStand.length - 1 ? "1px solid var(--line)" : "none" }}>
                <div style={{ fontSize: 13, fontFamily: "var(--font-display)", fontStyle: "italic", lineHeight: 1.4 }}>"{c.texto}"</div>
                <div className="mono" style={{ marginTop: 6 }}>{c.autor} · {c.hora}</div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
};

Object.assign(window, { PublicDashboard, MapaNarino, PublicDetail });
