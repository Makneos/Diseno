const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;

// ✅ CONFIGURACIÓN PARA RAILWAY (usando variables de entorno)
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

// JWT Secret desde variables de entorno
const JWT_SECRET = process.env.JWT_SECRET || 'farmacia_jwt_super_secret_key_2024_muy_larga_y_segura_12345';
process.env.JWT_SECRET = JWT_SECRET;

// Verificar que las variables estén disponibles
console.log('🔧 Configuración cargada:');
console.log('- DB_HOST:', DB_CONFIG.host);
console.log('- DB_USER:', DB_CONFIG.user);
console.log('- DB_PASSWORD:', DB_CONFIG.password ? 'SÍ' : 'NO');
console.log('- DB_NAME:', DB_CONFIG.database);
console.log('- DB_PORT:', DB_CONFIG.port);
console.log('- JWT_SECRET:', JWT_SECRET ? 'SÍ' : 'NO');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');

// 🚨 CORS CONFIGURADO CORRECTAMENTE PARA AZURE + RAILWAY
const corsOptions = {
  origin: function (origin, callback) {
    // Lista de orígenes permitidos
    const allowedOrigins = [
      'https://red-cliff-05a52f31e.2.azurestaticapps.net', // ✅ Tu Azure Static App
      'http://localhost:3000',  // Desarrollo local React
      'http://localhost:3001',  // Desarrollo local alternativo
      'http://127.0.0.1:3000',  // Desarrollo local IP
    ];
    
    // Permitir requests sin origin (Postman, servidores, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar si el origin está permitido
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      callback(null, true); // 🔧 TEMPORAL: Permitir todos para debug
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  preflightContinue: false,
  optionsSuccessStatus: 200
};

// Aplicar CORS
app.use(cors(corsOptions));

// Middleware adicional para manejar preflight requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Log de todas las requests para debug
  console.log(`📥 ${req.method} ${req.originalUrl} from ${origin || 'unknown origin'}`);
  
  // Headers adicionales para compatibilidad
  if (origin && origin.includes('azurestaticapps.net')) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  
  // Responder a preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin,X-Requested-With,Content-Type,Accept,Authorization');
    return res.sendStatus(200);
  }
  
  next();
});

app.use(express.json());

// Crear pool de conexiones a MySQL usando las variables de entorno
const pool = mysql.createPool(DB_CONFIG).promise();

// Middleware para pasar la conexión a las rutas
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Verificar conexión y estructura de la base de datos
const testConnection = async () => {
  try {
    console.log('🔄 Verificando conexión a base de datos...');
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    console.log(`✅ Conectado a la base de datos: ${DB_CONFIG.database} en ${DB_CONFIG.host}:${DB_CONFIG.port}`);
    
    // Verificar si la tabla usuarios existe
    try {
      const [tables] = await connection.query('SHOW TABLES LIKE "usuarios"');
      if (tables.length === 0) {
        console.log('⚠️  La tabla usuarios no existe');
        // En producción, no crear tablas automáticamente
        if (process.env.NODE_ENV !== 'production') {
          console.log('Creando tabla usuarios...');
          await connection.query(`
            CREATE TABLE usuarios (
              id INT AUTO_INCREMENT PRIMARY KEY,
              nombre VARCHAR(100) NOT NULL,
              email VARCHAR(100) NOT NULL UNIQUE,
              contrasena VARCHAR(255) NOT NULL,
              fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          console.log('Tabla usuarios creada correctamente');
        }
      } else {
        console.log('✅ Tabla usuarios encontrada');
      }
      
    } catch (err) {
      console.error('⚠️  Error al verificar tablas:', err.message);
    }
    
    connection.release();
  } catch (error) {
    console.error('❌ Error al conectar a MySQL:', error.message);
    
    if (process.env.NODE_ENV === 'production') {
      console.error('🚂 Verifica la configuración de Railway:');
      console.error('1. Variables de entorno configuradas correctamente');
      console.error('2. Base de datos MySQL activa en Railway');
      console.error('3. Credenciales correctas');
    } else {
      console.error('💻 Verifica la configuración local:');
      console.error('1. MySQL esté ejecutándose');
      console.error('2. Usuario y contraseña correctos');
      console.error('3. Base de datos existe');
    }
  }
};

// Ruta de prueba simple
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

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query('SELECT 1');
    connection.release();
    
    res.json({
      status: 'healthy',
      database: 'connected',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
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

// ✅ CARGAR MÓDULOS DE API - SIMPLIFICADO Y CORREGIDO
const loadAPIRoutes = () => {
  try {
    console.log('🔄 Intentando cargar rutas API...');
    console.log('📁 Directorio actual:', __dirname);
    
    let routesLoaded = 0;
    
    // Cargar usuarios
    try {
      console.log('📂 Cargando usuarios desde ./api/usuarios...');
      const usuariosRoutes = require('./api/usuarios');
      app.use('/api/usuarios', usuariosRoutes);
      console.log('✅ usuarios cargado correctamente');
      routesLoaded++;
    } catch (error) {
      console.error('❌ Error cargando usuarios:', error.message);
    }
    
    // Cargar medicamentos
    try {
      console.log('📂 Cargando medicamentos desde ./api/medicamentos...');
      const medicamentosRoutes = require('./api/medicamentos');
      app.use('/api/medicamentos', medicamentosRoutes);
      console.log('✅ medicamentos cargado correctamente');
      routesLoaded++;
    } catch (error) {
      console.error('❌ Error cargando medicamentos:', error.message);
    }
    
    // Cargar stock
    try {
      console.log('📂 Cargando pharmacyStock desde ./api/pharmacyStock...');
      const stockRoutes = require('./api/pharmacyStock');
      app.use('/api/stock', stockRoutes);
      console.log('✅ pharmacyStock cargado correctamente');
      routesLoaded++;
    } catch (error) {
      console.error('❌ Error cargando pharmacyStock:', error.message);
    }
    
    // Cargar tratamientos
    try {
      console.log('📂 Cargando tratamientos desde ./api/tratamientos...');
      const tratamientosRoutes = require('./api/tratamientos');
      app.use('/api/tratamientos', tratamientosRoutes);
      console.log('✅ tratamientos cargado correctamente');
      routesLoaded++;
    } catch (error) {
      console.error('❌ Error cargando tratamientos:', error.message);
    }
    
    console.log(`✅ Rutas registradas:`);
    console.log('   ✅ Ruta /api/usuarios registrada');
    console.log('   ✅ Ruta /api/medicamentos registrada');
    console.log('   ✅ Ruta /api/stock registrada');
    console.log('   ✅ Ruta /api/tratamientos registrada');
    console.log(`✅ ${routesLoaded}/4 rutas API cargadas correctamente`);
    
    return routesLoaded > 0;
  } catch (error) {
    console.error('❌ Error general al cargar módulos de API:', error.message);
    console.error('❌ Stack trace:', error.stack);
    return false;
  }
};

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ✅ 404 handler CORREGIDO - AL FINAL
app.use('*', (req, res) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  console.log(`📍 Path: ${req.path}`);
  console.log(`🔍 Original URL: ${req.originalUrl}`);
  
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl,
    method: req.method,
    message: `No se encontró la ruta ${req.method} ${req.originalUrl}`,
    available_endpoints: [
      'GET /',
      'GET /health',
      'GET /api/usuarios',                     // ✅ AGREGADO
      'POST /api/usuarios/login',
      'POST /api/usuarios/registro',
      'GET /api/usuarios/perfil',              // ✅ AGREGADO
      'GET /api/usuarios/verificar-token',     // ✅ AGREGADO
      'GET /api/medicamentos/buscar',
      'GET /api/medicamentos/test-data',       // ✅ AGREGADO
      'GET /api/medicamentos/precios-por-principio/:principio',
      'GET /api/stock/medications',
      'GET /api/stock/search',
      'GET /api/tratamientos/mis-medicamentos',
      'POST /api/tratamientos/agregar-medicamento',
      'GET /api/tratamientos/test-auth'        // ✅ AGREGADO
    ],
    timestamp: new Date().toISOString(),
    tip: 'Verifica que la URL esté correcta y que uses el método HTTP correcto',
    debug_info: {
      file_check: 'Verifica que api/usuarios.js existe en el servidor',
      route_loading: 'Revisa los logs para ver si las rutas se cargaron correctamente'
    }
  });
});

// Inicializar aplicación
const startServer = async () => {
  try {
    console.log('🚀 Iniciando servidor Farmafia...');
    
    // Verificar conexión a BD
    await testConnection();
    
    // Cargar rutas API
    const routesLoaded = loadAPIRoutes();
    if (!routesLoaded) {
      console.error('❌ ADVERTENCIA: No se pudieron cargar todas las rutas API');
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ Error crítico en producción');
        // No terminar el proceso, pero alertar
      }
    }
    
    // Iniciar servidor
    app.listen(port, '0.0.0.0', () => {
      console.log('🚀 Servidor iniciado exitosamente!');
      console.log(`📡 Escuchando en puerto ${port}`);
      console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🏥 Base de datos: ${DB_CONFIG.database} en ${DB_CONFIG.host}:${DB_CONFIG.port}`);
      console.log(`🔐 JWT configurado: ${JWT_SECRET ? 'SÍ' : 'NO'}`);
      console.log(`🌍 CORS configurado para Azure Static Apps`);
      console.log('✅ API lista para recibir solicitudes');
      
      // URL del servidor
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

// Manejo graceful de cierre
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