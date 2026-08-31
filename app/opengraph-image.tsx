import { ImageResponse } from "next/og";

export const alt = "La Posada del Hechicero · Juegos y comunidad en Valdivia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#10241e", color: "#f5ead7", padding: "72px 82px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 510, height: 510, borderRadius: 999, background: "#1f6658", opacity: 0.42, right: -140, top: -170 }} />
      <div style={{ position: "absolute", width: 330, height: 330, borderRadius: 999, border: "2px solid #d07b43", opacity: 0.55, right: 90, bottom: -145 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 24, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#e8ad7e" }}>
        <span style={{ display: "flex", width: 54, height: 42, borderRadius: 99, background: "#d07b43", alignItems: "center", justifyContent: "center", color: "#10241e", fontSize: 16, letterSpacing: "0.05em" }}>PDH</span>
        Valdivia · Juegos · Comunidad
      </div>
      <div style={{ display: "flex", flexDirection: "column", maxWidth: 850 }}>
        <div style={{ display: "flex", fontSize: 86, lineHeight: 0.92, fontWeight: 700, letterSpacing: "-0.04em" }}>La Posada del Hechicero</div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 30, color: "rgba(245,234,215,.65)" }}>Una mesa. Mil historias.</div>
      </div>
    </div>,
    size,
  );
}
