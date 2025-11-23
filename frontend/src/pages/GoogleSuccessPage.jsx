import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function GoogleSuccessPage() {
  const navigate = useNavigate();
  const handledRef = useRef(false); // para evitar que corra 2 veces

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    console.log("🔐 Token recibido en /google-success:", token);
    console.log("🌐 URL actual:", window.location.href);

    if (!token) {
      console.log("❌ No llegó token, redirigiendo a /login");
      navigate("/login", { replace: true });
      return;
    }

    // Intentar decodificar el JWT para armar un objeto "user" compatible
    try {
      const [, payloadB64] = token.split(".");
      const normalized = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
      const payloadJson = atob(normalized);
      const payload = JSON.parse(payloadJson);

      console.log("🧩 Payload decodificado del token:", payload);

      const userData = {
        id: null, // el backend no manda id, pero no es crítico
        nombre: payload.nombre || payload.name || "",
        email: payload.email || "",
        foto: payload.foto || payload.picture || "",
        token: token,
      };

      console.log("💾 Guardando user en sessionStorage:", userData);
      sessionStorage.setItem("user", JSON.stringify(userData));
    } catch (e) {
      console.error("⚠️ Error decodificando el token JWT:", e);
      // si pasa algo raro, mejor mandarlo al login
      navigate("/login", { replace: true });
      return;
    }

    console.log("✅ Usuario guardado, redirigiendo a Home (/)");
    navigate("/", { replace: true });
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", marginTop: "3rem" }}>
      <h2>Procesando inicio de sesión con Google...</h2>
      <p>Por favor espera, estamos redirigiéndote.</p>
    </div>
  );
}