// Formulario de voto (vista móvil) + confirmación

const VoteForm = ({ stand, onComplete }) => {
  const [step, setStep] = React.useState(0); // 0: correo, 1: emoji, 2: detalles, 3: confirmando
  const [data, setData] = React.useState({ correo: "", emoji: null, compra: null, texto: "" });
  const [submitError, setSubmitError] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const update = (k, v) => setData(d => ({ ...d, [k]: v }));
  const sec = window.LMTSecurity;
  const correoOk = sec ? sec.isEmail(data.correo.trim()) : data.correo.includes("@");

  const handleSubmit = async () => {
    setSubmitError("");
    setSubmitting(true);
    try {
      if (window.LMTApi && window.LMTApi.enabled) {
        await window.LMTApi.submitVote({
          stand: stand.id,
          emoji: data.emoji,
          correo: data.correo,
          compra: data.compra,
          texto: data.texto,
        });
      } else if (sec) {
        // Modo demo: validamos igual aunque no haya backend.
        sec.buildVotePayload({
          stand: stand.id,
          emoji: data.emoji,
          correo: data.correo,
          compra: data.compra,
          texto: data.texto,
        });
      }
      onComplete(data);
    } catch (e) {
      const code = String((e && (e.code || e.message)) || e);
      if (code.includes("rate_limited")) setSubmitError("Ya votaste por este stand hace poco. Intenta más tarde.");
      else if (code.includes("ya_votaste")) setSubmitError("Ya registraste un voto para este stand con ese correo.");
      else if (code.includes("correo_invalido")) setSubmitError("El correo no es válido.");
      else if (code.includes("emoji_invalido")) setSubmitError("Selecciona una calificación.");
      else if (code.includes("stand_no_existe")) setSubmitError("Este stand ya no está disponible.");
      else setSubmitError("No fue posible registrar tu voto. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const emojis = [
    { id: "malo", label: "Malo", emoji: "😞", color: "var(--bad)" },
    { id: "regular", label: "Regular", emoji: "😐", color: "var(--meh)" },
    { id: "bueno", label: "Excelente", emoji: "😍", color: "var(--good)" },
  ];

  return (
    <div style={{ padding: "16px 24px 32px", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      {/* Header con logo del stand */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 16, borderBottom: "1px solid var(--line)" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: stand.color, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--paper)", fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18 }}>
          {stand.nombre[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div className="mono" style={{ fontSize: 9 }}>#{stand.id.toUpperCase()}</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{stand.nombre}</div>
        </div>
      </div>

      {/* Progreso */}
      <div style={{ display: "flex", gap: 4, marginTop: 16, marginBottom: 24 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ flex: 1, height: 2, background: step >= i ? "var(--ink)" : "var(--line)", transition: "background 0.3s" }}/>
        ))}
      </div>

      {step === 0 && (
        <div style={{ animation: "fade-up 0.4s", flex: 1, display: "flex", flexDirection: "column" }}>
          <div className="mono">Paso 1 / 3</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 32, fontWeight: 400, margin: "6px 0 6px", lineHeight: 1.1, letterSpacing: "-0.01em" }}>
            Califica<br/>{stand.nombre}
          </h2>
          <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 8, lineHeight: 1.5 }}>
            Tu correo se usa solo para crear tu pasaporte del café y evitar votos repetidos.
          </p>
          <div className="field" style={{ marginTop: 28 }}>
            <label>Tu correo</label>
            <input type="email" autoComplete="email" inputMode="email" maxLength={254} placeholder="nombre@correo.co" value={data.correo} onChange={e => update("correo", e.target.value)}/>
          </div>
          <div style={{ marginTop: "auto", paddingTop: 24 }}>
            <button className="btn btn-primary" onClick={() => setStep(1)} disabled={!correoOk} style={{
              width: "100%", justifyContent: "center", padding: "14px",
              opacity: correoOk ? 1 : 0.4,
            }}>
              Continuar →
            </button>
            <p className="mono" style={{ textAlign: "center", marginTop: 12, lineHeight: 1.6 }}>
              Al continuar aceptas el tratamiento<br/>de datos del festival.
            </p>
          </div>
        </div>
      )}

      {step === 1 && (
        <div style={{ animation: "fade-up 0.4s", flex: 1, display: "flex", flexDirection: "column" }}>
          <div className="mono">Paso 2 / 3</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 32, fontWeight: 400, margin: "6px 0 6px", lineHeight: 1.1 }}>
            ¿Cómo estuvo<br/>tu experiencia?
          </h2>
          <p style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 8 }}>Elige uno.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
            {emojis.map(e => (
              <button key={e.id} onClick={() => update("emoji", e.id)} style={{
                padding: "18px 20px",
                border: data.emoji === e.id ? `2px solid ${e.color}` : "1px solid var(--line-2)",
                borderRadius: "var(--r-lg)",
                display: "flex", alignItems: "center", gap: 16,
                background: data.emoji === e.id ? `color-mix(in oklch, ${e.color} 8%, var(--paper))` : "var(--paper)",
                textAlign: "left",
                transition: "all 0.2s",
              }}>
                <span style={{ fontSize: 32 }}>{e.emoji}</span>
                <span style={{ fontSize: 16, fontWeight: 500 }}>{e.label}</span>
                {data.emoji === e.id && <span style={{ marginLeft: "auto", color: e.color }}>✓</span>}
              </button>
            ))}
          </div>
          <div style={{ marginTop: "auto", paddingTop: 24, display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setStep(0)}>←</button>
            <button className="btn btn-primary" onClick={() => setStep(2)} disabled={!data.emoji} style={{ flex: 1, justifyContent: "center", padding: "14px", opacity: data.emoji ? 1 : 0.4 }}>
              Continuar →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ animation: "fade-up 0.4s", flex: 1, display: "flex", flexDirection: "column" }}>
          <div className="mono">Paso 3 / 3 · Último</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 32, fontWeight: 400, margin: "6px 0 6px", lineHeight: 1.1 }}>
            Cuéntanos un<br/>poco más.
          </h2>
          <div className="mono" style={{ marginTop: 20, marginBottom: 10 }}>¿Compraste algo?</div>
          <div style={{ display: "flex", gap: 10 }}>
            {[{v:true,l:"Sí, compré"},{v:false,l:"No esta vez"}].map(o => (
              <button key={String(o.v)} onClick={() => update("compra", o.v)} style={{
                flex: 1, padding: "14px",
                border: data.compra === o.v ? "2px solid var(--ink)" : "1px solid var(--line-2)",
                borderRadius: "var(--r-md)",
                fontSize: 14, fontWeight: 500,
                background: data.compra === o.v ? "var(--paper-2)" : "var(--paper)",
              }}>{o.l}</button>
            ))}
          </div>
          <div className="field" style={{ marginTop: 24 }}>
            <label>Comentario (opcional, máx. 500)</label>
            <textarea
              rows={4}
              value={data.texto}
              maxLength={500}
              onChange={e => update("texto", e.target.value)}
              placeholder="¿Qué destacarías del stand?"
              style={{ border: "1px solid var(--line-2)", borderRadius: "var(--r-md)", padding: 12 }}
            />
            <div className="mono" style={{ alignSelf: "flex-end", color: "var(--ink-3)" }}>{data.texto.length}/500</div>
          </div>
          {submitError && (
            <div role="alert" style={{ marginTop: 12, padding: "10px 12px", border: "1px solid var(--bad)", color: "var(--bad)", borderRadius: "var(--r-sm)", fontSize: 13 }}>
              {submitError}
            </div>
          )}
          <div style={{ marginTop: "auto", paddingTop: 24, display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setStep(1)} disabled={submitting}>←</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting} style={{ flex: 1, justifyContent: "center", padding: "14px", opacity: submitting ? 0.6 : 1 }}>
              {submitting ? "Enviando…" : "Sellar pasaporte →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Confirmación post-voto con animación del sello
const VoteConfirm = ({ stand, onGoPassport, onGoDashboard }) => {
  const [stamped, setStamped] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setStamped(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ padding: "16px 24px 32px", minHeight: "100%", display: "flex", flexDirection: "column" }}>
      <div className="mono" style={{ textAlign: "center", marginTop: 12 }}>✓ Voto registrado</div>
      <h2 style={{
        fontFamily: "var(--font-display)", fontStyle: "italic",
        fontSize: 36, fontWeight: 400, margin: "12px 0 6px",
        textAlign: "center", lineHeight: 1.05,
      }}>
        Tu pasaporte<br/>ha sido sellado.
      </h2>
      <p style={{ fontSize: 13, color: "var(--ink-2)", textAlign: "center", marginTop: 8 }}>
        {stand.nombre} · {stand.municipio}
      </p>

      {/* Zona del sello animado */}
      <div style={{
        marginTop: 32,
        aspectRatio: "1/1.3",
        background: "var(--paper-2)",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--line)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Líneas de libreta */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "repeating-linear-gradient(var(--paper-2) 0, var(--paper-2) 23px, var(--line) 23px, var(--line) 24px)",
          opacity: 0.5,
        }}/>
        <div style={{ padding: 20, position: "relative", height: "100%" }}>
          <div className="mono">Pasaporte · {window.PASAPORTE_DEMO.nombre}</div>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, marginTop: 6 }}>Página 5</div>

          {/* Sello que cae */}
          <div style={{
            position: "absolute",
            top: "55%", left: "50%",
            "--stamp-rot": "-14deg",
            animation: stamped ? "stamp-land 0.6s cubic-bezier(.2,.8,.2,1.2) forwards" : "none",
            opacity: 0,
          }}>
            <SelloCircular stand={stand} size={170} rotation={-14}/>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        <button className="btn btn-primary" onClick={onGoPassport} style={{ justifyContent: "center", padding: "14px" }}>
          Ver mi pasaporte →
        </button>
        <button className="btn btn-ghost" onClick={onGoDashboard} style={{ justifyContent: "center", padding: "14px" }}>
          Ver ranking del festival
        </button>
      </div>
    </div>
  );
};

Object.assign(window, { VoteForm, VoteConfirm });
