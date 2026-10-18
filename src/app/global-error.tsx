"use client";

/**
 * Último recurso si falla el layout raíz: reemplaza todo el documento, sin los estilos del
 * sitio, así que usa estilos propios en línea.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="es-CL">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0e0c0a",
          color: "#f5f0ea",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: 24,
        }}
      >
        <title>Solis Racing Parts</title>
        <div>
          <p style={{ fontSize: 14, letterSpacing: "0.2em", color: "#ef4444", textTransform: "uppercase" }}>
            Solis Racing Parts
          </p>
          <h1 style={{ fontSize: 28, margin: "12px 0" }}>Algo falló al cargar el sitio</h1>
          <p style={{ color: "#a8a29e", maxWidth: 420 }}>Inténtalo de nuevo en unos segundos.</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: 20,
              padding: "12px 22px",
              border: 0,
              borderRadius: 8,
              background: "#dc2626",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
          {error.digest && <p style={{ marginTop: 16, fontSize: 12, color: "#78716c" }}>Código: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
