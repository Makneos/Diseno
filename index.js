// ============================================
// INDEX.JS - PUNTO DE ENTRADA PARA AZURE
// ============================================

require('dotenv').config();
const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 8080;

// ============================================
// OPCIÓN 1: Si tu backend EXPORTA el app
// ============================================
// Intenta importar el app del backend
let app;
try {
  app = require('./backend/src/app');
  console.log('✅ Backend app importado desde ./backend/src/app');
} catch (error) {
  try {
    // Si no está en src/app, intenta server.js
    app = require('./backend/server');
    console.log('✅ Backend app importado desde ./backend/server');
  } catch (error2) {
    // ============================================
    // OPCIÓN 2: Si tu backend NO EXPORTA el app
    // ============================================
    console.log('⚠️ No se pudo importar el backend app. Creando servidor independiente...');
    
    // Crear nuevo servidor que incluya las rutas del backend
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    // Importar y usar las rutas del backend
    const authRoutes = require('./backend/src/routes/auth.routes');
    const medicamentoRoutes = require('./backend/src/routes/medicamento.routes');
    const chatRoutes = require('./backend/src/routes/chat.routes');
    
    app.use('/api/auth', authRoutes);
    app.use('/api/medicamentos', medicamentoRoutes);
    app.use('/api/chat', chatRoutes);
  }
}

// ============================================
// SERVIR FRONTEND BUILDEADO
// ============================================

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Farmafia API is running',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Cualquier ruta que NO sea de API, servir el index.html del frontend
// IMPORTANTE: Esto debe ir AL FINAL
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Farmafia Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Backend API: http://localhost:${PORT}/api`);
  console.log(`💻 Frontend: http://localhost:${PORT}`);
  console.log('='.repeat(50));
});