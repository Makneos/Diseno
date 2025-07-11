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

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://tu-app.azurewebsites.net',  // 🔄 CAMBIAR POR TU URL DE AZURE
        'https://www.tu-dominio.com'          // 🔄 CAMBIAR SI TIENES DOMINIO
      ]
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

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
      
      // Verificar otras tablas necesarias
      if (process.env.NODE_ENV !== 'production') {
        await checkAndCreateTables(connection);
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

// Función para verificar y crear todas las tablas necesarias (solo en desarrollo)
async function checkAndCreateTables(connection) {
  const tables = [
    {
      name: 'medicamentos',
      sql: `CREATE TABLE medicamentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        principio_activo VARCHAR(255) NOT NULL,
        es_generico BOOLEAN DEFAULT FALSE,
        imagen_url VARCHAR(255),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_nombre (nombre)
      )`
    },
    {
      name: 'farmacias',
      sql: `CREATE TABLE farmacias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        sitio_web VARCHAR(255),
        logo_url VARCHAR(255),
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_nombre (nombre)
      )`
    },
    {
      name: 'precios_medicamentos',
      sql: `CREATE TABLE precios_medicamentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        medicamento_id INT NOT NULL,
        farmacia_id INT NOT NULL,
        precio DECIMAL(10,2) NOT NULL,
        url_producto VARCHAR(255),
        disponible BOOLEAN DEFAULT TRUE,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE CASCADE,
        FOREIGN KEY (farmacia_id) REFERENCES farmacias(id) ON DELETE CASCADE,
        UNIQUE KEY unique_med_farm (medicamento_id, farmacia_id)
      )`
    },
    {
      name: 'tratamientos',
      sql: `CREATE TABLE tratamientos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        fecha_inicio DATE,
        fecha_fin DATE,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )`
    },
    {
      name: 'medicamentos_tratamientos',
      sql: `CREATE TABLE medicamentos_tratamientos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tratamiento_id INT NOT NULL,
        medicamento_id INT NOT NULL,
        dosis VARCHAR(100),
        frecuencia VARCHAR(100),
        recordatorio_activo BOOLEAN DEFAULT FALSE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tratamiento_id) REFERENCES tratamientos(id) ON DELETE CASCADE,
        FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE CASCADE
      )`
    },
    {
      name: 'recordatorios_compra',
      sql: `CREATE TABLE recordatorios_compra (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        medicamento_id INT NOT NULL,
        fecha_recordatorio DATE NOT NULL,
        periodicidad INT,
        notificacion_enviada BOOLEAN DEFAULT FALSE,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
        FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE CASCADE
      )`
    }
  ];

  for (const table of tables) {
    try {
      const [existingTables] = await connection.query('SHOW TABLES LIKE ?', [table.name]);
      if (existingTables.length === 0) {
        console.log(`⚠️  La tabla ${table.name} no existe, creándola...`);
        await connection.query(table.sql);
        console.log(`✅ Tabla ${table.name} creada correctamente`);
      } else {
        console.log(`✅ Tabla ${table.name} encontrada`);
      }
    } catch (err) {
      console.error(`❌ Error con tabla ${table.name}:`, err.message);
    }
  }

  // Insertar datos predeterminados de farmacias si no existen
  try {
    const [farmacias] = await connection.query('SELECT COUNT(*) as count FROM farmacias');
    if (farmacias[0].count === 0) {
      console.log('📝 Insertando farmacias predeterminadas...');
      await connection.query(`
        INSERT INTO farmacias (nombre, sitio_web, logo_url) VALUES 
        ('Ahumada', 'https://www.farmaciasahumada.cl', 'https://www.farmaciasahumada.cl/logo.png'),
        ('Cruz Verde', 'https://www.cruzverde.cl', 'https://www.cruzverde.cl/logo.png'),
        ('Salcobrand', 'https://salcobrand.cl', 'https://salcobrand.cl/logo.png')
      `);
      console.log('✅ Farmacias predeterminadas insertadas');
    }
  } catch (err) {
    console.error('⚠️  Error insertando farmacias:', err.message);
  }
}

// Cargar módulos de API
const loadAPIRoutes = () => {
  try {
    const usuariosRoutes = require('./api/usuarios');
    const medicamentosRoutes = require('./api/medicamentos');
    const pharmacyStockRoutes = require('./api/pharmacyStock');
    const tratamientosRoutes = require('./api/tratamientos');

    app.use('/api/usuarios', usuariosRoutes);
    app.use('/api/medicamentos', medicamentosRoutes);
    app.use('/api/stock', pharmacyStockRoutes);
    app.use('/api/tratamientos', tratamientosRoutes);
    
    console.log('✅ Rutas API cargadas correctamente:');
    console.log('   - /api/usuarios');
    console.log('   - /api/medicamentos');
    console.log('   - /api/stock');
    console.log('   - /api/tratamientos');
    
    return true;
  } catch (error) {
    console.error('❌ Error al cargar módulos de API:', error.message);
    return false;
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

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.path,
    method: req.method
  });
});

// Inicializar aplicación
const startServer = async () => {
  try {
    // Verificar conexión a BD
    await testConnection();
    
    // Cargar rutas API
    const routesLoaded = loadAPIRoutes();
    if (!routesLoaded && process.env.NODE_ENV === 'production') {
      console.error('❌ Error crítico: No se pudieron cargar las rutas API');
      process.exit(1);
    }
    
    // Iniciar servidor
    app.listen(port, '0.0.0.0', () => {
      console.log('🚀 Servidor iniciado exitosamente!');
      console.log(`📡 Escuchando en puerto ${port}`);
      console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🏥 Base de datos: ${DB_CONFIG.database} en ${DB_CONFIG.host}:${DB_CONFIG.port}`);
      console.log(`🔐 JWT configurado: ${JWT_SECRET ? 'SÍ' : 'NO'}`);
      console.log('✅ API lista para recibir solicitudes');
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

// Iniciar servidor
startServer();