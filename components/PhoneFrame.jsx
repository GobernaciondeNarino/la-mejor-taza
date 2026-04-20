// Marco de teléfono simple (para formulario de voto y pasaporte)
const PhoneFrame = ({ children, label, scale = 1 }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
    {label && <div className="mono" style={{ color: "var(--ink-3)" }}>{label}</div>}
    <div style={{
      width: 390 * scale, height: 800 * scale,
      borderRadius: 48 * scale,
      background: "var(--ink)",
      padding: 10 * scale,
      boxShadow: "0 30px 60px -20px oklch(0.22 0.02 60 / 0.35), 0 0 0 2px oklch(0.22 0.02 60 / 0.08)",
      position: "relative",
    }}>
      <div style={{
        width: "100%", height: "100%",
        borderRadius: 40 * scale,
        background: "var(--paper)",
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Dynamic island */}
        <div style={{
          position: "absolute", top: 10 * scale, left: "50%", transform: "translateX(-50%)",
          width: 100 * scale, height: 30 * scale, borderRadius: 999,
          background: "var(--ink)", zIndex: 100,
        }}/>
        {/* Status bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 50 * scale,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: `0 ${28 * scale}px`, paddingTop: 14 * scale,
          fontSize: 14 * scale, fontWeight: 600, zIndex: 99,
          pointerEvents: "none",
        }}>
          <span>9:41</span>
          <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 10 * scale }}>●●●●</span>
          </span>
        </div>
        <div style={{ width: "100%", height: "100%", paddingTop: 50 * scale, overflow: "auto", position: "relative" }}>
          {children}
        </div>
      </div>
    </div>
  </div>
);

window.PhoneFrame = PhoneFrame;
