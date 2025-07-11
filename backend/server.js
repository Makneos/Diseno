const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// CONFIGURACIÓN DB
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Farmacia?#2027',
  database: process.env.DB_NAME || 'farmacia',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'farmacia_jwt_super_secret_key_2024';
process.env.JWT_SECRET = JWT_SECRET;

console.log('🚀 Iniciando servidor...');
console.log('- DB_HOST:', DB_CONFIG.host);
console.log('- DB_USER:', DB_CONFIG.user);
console.log('- JWT_SECRET:', JWT_SECRET ? 'SÍ' : 'NO');

// 🔧 CORS SIMPLE PARA DEBUG
app.use(cors({
  origin: true, // Permitir todos los orígenes
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));

// Middleware básico
app.use(express.json());

// Crear pool de conexiones
const pool = mysql.createPool(DB_CONFIG).promise();
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Logging simple
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.originalUrl}`);
  next();
});

// RUTAS PRINCIPALES
app.get('/', (req, res) => {
  res.json({ 
    message: 'Farmafia API funcionando correctamente',
    timestamp: new Date().toISOString(),
    available_apis: ['/api/usuarios', '/api/medicamentos', '/api/stock', '/api/tratamientos']
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 🔧 CARGAR RUTAS DIRECTAMENTE
console.log('🔄 Cargando rutas API...');

try {
  // Usuarios
  const usuariosRoutes = require('./api/usuarios');
  app.use('/api/usuarios', usuariosRoutes);
  console.log('✅ /api/usuarios registrada');
} catch (error) {
  console.error('❌ Error cargando usuarios:', error.message);
}

try {
  // Medicamentos
  const medicamentosRoutes = require('./api/medicamentos');
  app.use('/api/medicamentos', medicamentosRoutes);
  console.log('✅ /api/medicamentos registrada');
} catch (error) {
  console.error('❌ Error cargando medicamentos:', error.message);
}

try {
  // Stock
  const stockRoutes = require('./api/pharmacyStock');
  app.use('/api/stock', stockRoutes);
  console.log('✅ /api/stock registrada');
} catch (error) {
  console.error('❌ Error cargando stock:', error.message);
}

try {
  // Tratamientos
  const tratamientosRoutes = require('./api/tratamientos');
  app.use('/api/tratamientos', tratamientosRoutes);
  console.log('✅ /api/tratamientos registrada');
} catch (error) {
  console.error('❌ Error cargando tratamientos:', error.message);
}

// 🔧 TEST ENDPOINT para verificar que las rutas funcionan
app.get('/test', (req, res) => {
  res.json({
    message: 'Test endpoint OK',
    routes: ['/', '/health', '/test', '/api/usuarios', '/api/medicamentos'],
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({ error: 'Error interno', details: err.message });
});

// 404 handler - DEBE IR AL FINAL
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: '404 - Ruta no encontrada',
    path: req.originalUrl,
    method: req.method,
    available_routes: [
      'GET /',
      'GET /health', 
      'GET /test',
      'GET /api/usuarios',
      'POST /api/usuarios/login',
      'POST /api/usuarios/registro'
    ]
  });
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
  console.log('🚀 Servidor iniciado en puerto', port);
  console.log('🌍 URL:', process.env.NODE_ENV === 'production' 
    ? 'https://wellaging-production-99c2.up.railway.app' 
    : `http://localhost:${port}`);
});

// Error handlers
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught exception:', err);
  process.exit(1);
});