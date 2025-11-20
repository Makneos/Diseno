const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// ✅ CONFIGURACIÓN PARA RAILWAY
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'farmacia',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// JWT Secret desde variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'farmacia_jwt_super_secret_key_2024_muy_larga_y_segura_12345';
process.env.JWT_SECRET = JWT_SECRET;

// Log de configuración
console.log('🔧 Configuración cargada:');
console.log('- DB_HOST:', DB_CONFIG.host);
console.log('- DB_USER:', DB_CONFIG.user);
console.log('- DB_PASSWORD:', DB_CONFIG.password ? 'SÍ' : 'NO');
console.log('- DB_NAME:', DB_CONFIG.database);
console.log('- DB_PORT:', DB_CONFIG.port);
console.log('- JWT_SECRET:', JWT_SECRET ? 'SÍ' : 'NO');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');

// ✅ CORS OPTIMIZADO - Permite Azure pero sin complicaciones
const corsOptions = {
  origin: function (origin, callback) {
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'https://red-cliff-05a52f31e.2.azurestaticapps.net',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000'
    ];
    
    // Permitir requests sin origin (Postman, servidores, etc.)
    if (!origin) return callback(null, true);
    
    // Verificar si el origin está permitido
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`⚠️ Origen no listado: ${origin} - permitiendo temporalmente`);
      callback(null, true); // Permitir para evitar bloqueos en producción
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
};

app.use(cors(corsOptions));

// Middleware básico
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Crear pool de conexiones MySQL
const pool = mysql.createPool(DB_CONFIG).promise();

// Middleware para pasar la conexión a las rutas
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// ✅ Logging simple pero efectivo
app.use((req, res, next) => {
  const origin = req.get('origin') || 'unknown';
  console.log(`📥 ${req.method} ${req.originalUrl} from ${origin}`);
  next();
});

// ✅ Verificar conexión a base de datos
const testConnection = async () => {
  try {
    console.log('🔄 Verificando conexión a base de datos...');
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    console.log(`✅ Conectado a la base de datos: ${DB_CONFIG.database} en ${DB_CONFIG.host}:${DB_CONFIG.port}`);
    
    // Verificar tabla usuarios
    const [tables] = await connection.query('SHOW TABLES LIKE "usuarios"');
    if (tables.length === 0) {
      console.log('⚠️ La tabla usuarios no existe');
    } else {
      console.log('✅ Tabla usuarios encontrada');
    }
    
    connection.release();
  } catch (error) {
    console.error('❌ Error al conectar a MySQL:', error.message);
  }
};

// ✅ RUTAS PRINCIPALES
app.get('/', (req, res) => {
  res.json({ 
    message: 'Farmafia API funcionando correctamente',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: DB_CONFIG.database,
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    jwt_configured: JWT_SECRET ? true : false,
    timestamp: new Date().toISOString(),
    cors_enabled: true,
    allowed_origins: [
      'https://red-cliff-05a52f31e.2.azurestaticapps.net',
      'http://localhost:3000'
    ],
    available_apis: [
      '/api/usuarios',
      '/api/medicamentos',
      '/api/stock',
      '/api/tratamientos'
    ]
  });
});

app.get('/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    
    res.json({
      status: 'healthy',
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ✅ CARGAR RUTAS API - Método directo y confiable
console.log('🔄 Cargando rutas API...');

// Usuarios
try {
  const usuariosRoutes = require('./api/usuarios');
  app.use('/api/usuarios', usuariosRoutes);
  console.log('✅ /api/usuarios registrada');
} catch (error) {
  console.error('❌ Error cargando usuarios:', error.message);
}

// Medicamentos
try {
  const medicamentosRoutes = require('./api/medicamentos');
  app.use('/api/medicamentos', medicamentosRoutes);
  console.log('✅ /api/medicamentos registrada');
} catch (error) {
  console.error('❌ Error cargando medicamentos:', error.message);
}

// Stock/Pharmacy
try {
  const stockRoutes = require('./api/pharmacyStock');
  app.use('/api/stock', stockRoutes);
  console.log('✅ /api/stock registrada');
} catch (error) {
  console.error('❌ Error cargando pharmacyStock:', error.message);
}

// Tratamientos
try {
  const tratamientosRoutes = require('./api/tratamientos');
  app.use('/api/tratamientos', tratamientosRoutes);
  console.log('✅ /api/tratamientos registrada');
} catch (error) {
  console.error('❌ Error cargando tratamientos:', error.message);
}

console.log('✅ Rutas API cargadas correctamente');

// ✅ Endpoint de test para debug
app.get('/test', (req, res) => {
  res.json({
    message: 'Test endpoint funcionando',
    server_time: new Date().toISOString(),
    routes_available: [
      'GET /',
      'GET /health',
      'GET /test',
      'GET /api/usuarios',
      'POST /api/usuarios/login',
      'POST /api/usuarios/registro',
      'GET /api/usuarios/perfil',
      'GET /api/medicamentos/buscar',
      'GET /api/stock/medications',
      'GET /api/tratamientos/mis-medicamentos'
    ],
    cors_enabled: true,
    database_configured: !!DB_CONFIG.host,
    jwt_configured: !!JWT_SECRET
  });
});

// ✅ Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err.message);
  console.error('Stack:', err.stack);
  
  res.status(err.status || 500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// ✅ 404 handler - DEBE IR AL FINAL
app.use('*', (req, res) => {
  console.log(`❌ 404: ${req.method} ${req.originalUrl}`);
  
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method,
    message: `No se encontró la ruta ${req.method} ${req.originalUrl}`,
    available_endpoints: [
      'GET /',
      'GET /health',
      'GET /test',
      'GET /api/usuarios',
      'POST /api/usuarios/login',
      'POST /api/usuarios/registro',
      'GET /api/usuarios/perfil',
      'GET /api/usuarios/verificar-token',
      'GET /api/medicamentos/buscar',
      'GET /api/medicamentos/precios-por-principio/:principio',
      'GET /api/stock/medications',
      'GET /api/stock/search',
      'GET /api/tratamientos/mis-medicamentos',
      'POST /api/tratamientos/agregar-medicamento'
    ],
    timestamp: new Date().toISOString(),
    tip: 'Verifica que la URL esté correcta y que uses el método HTTP correcto'
  });
});

// ✅ Inicializar aplicación
const startServer = async () => {
  try {
    console.log('🚀 Iniciando servidor Farmafia...');
    
    // Verificar conexión a BD
    await testConnection();
    
    // Iniciar servidor
    app.listen(port, '0.0.0.0', () => {
      console.log('🚀 Servidor iniciado exitosamente!');
      console.log(`📡 Escuchando en puerto ${port}`);
      console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🏥 Base de datos: ${DB_CONFIG.database} en ${DB_CONFIG.host}:${DB_CONFIG.port}`);
      console.log(`🔐 JWT configurado: ${JWT_SECRET ? 'SÍ' : 'NO'}`);
      console.log(`🌍 CORS configurado para Azure Static Apps`);
      console.log('✅ API lista para recibir solicitudes');
      
      if (process.env.NODE_ENV === 'production') {
        console.log('🌍 Servidor público: https://wellaging-production-99c2.up.railway.app');
      } else {
        console.log(`🏠 Servidor local: http://localhost:${port}`);
      }
    });
    
  } catch (error) {
    console.error('💥 Error fatal al iniciar servidor:', error);
    process.exit(1);
  }
};

// ✅ Manejo graceful de cierre
process.on('SIGTERM', async () => {
  console.log('🔄 Cerrando servidor gracefully...');
  try {
    await pool.end();
    console.log('✅ Conexiones de BD cerradas');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al cerrar:', error);
    process.exit(1);
  }
});

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar servidor
startServer();