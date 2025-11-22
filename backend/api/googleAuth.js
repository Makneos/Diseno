const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");

const router = express.Router();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URL
);

// 1. Redirige al login de Google
router.get("/auth/google", (req, res) => {
  const url = client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "openid",
      "profile",
      "email",
    ],
  });

  res.redirect(url);
});

// 2. Google devuelve el code aquí
router.get("/auth/google/callback", async (req, res) => {
  try {
    const { tokens } = await client.getToken(req.query.code);
    client.setCredentials(tokens);

    // Obtener info del usuario
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const data = ticket.getPayload(); // nombre, email, foto

    // Crear JWT nuestro
    const jwtPayload = {
      nombre: data.name,
      email: data.email,
      foto: data.picture,
    };

    const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    // Redirigir al frontend con el token
    return res.redirect(
      `${process.env.FRONTEND_URL}/google-success?token=${token}`
    );
  } catch (error) {
    console.error("❌ Error en el callback de Google:", error);
    return res.status(500).json({ error: "Error al autenticar con Google" });
  }
});

module.exports = router;
