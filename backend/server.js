const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log('Directorio actual:', process.cwd());

// CONFIGURACIÓN ADAPTATIVA - Azure o Local
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Farmacia?#2027',
  database: process.env.DB_NAME || 'farmacia',
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : false, // SSL solo para Azure
  jwt_secret: process.env.JWT_SECRET || 'farmacia_jwt_super_secret_key_2024_muy_larga_y_segura_12345'
};

// Verificar que las variables estén disponibles
console.log('Configuración cargada:');
console.log('- DB_HOST:', DB_CONFIG.host);
console.log('- DB_USER:', DB_CONFIG.user);
console.log('- DB_PASSWORD:', DB_CONFIG.password ? 'SÍ' : 'NO');
console.log('- DB_NAME:', DB_CONFIG.database);
console.log('- DB_PORT:', DB_CONFIG.port);
console.log('- SSL:', DB_CONFIG.ssl ? 'HABILITADO' : 'DESHABILITADO');
console.log('- JWT_SECRET:', DB_CONFIG.jwt_secret ? 'SÍ' : 'NO');
console.log('- ENTORNO:', process.env.DB_HOST ? 'AZURE' : 'LOCAL');

// Exportar JWT_SECRET para que lo usen las rutas
process.env.JWT_SECRET = DB_CONFIG.jwt_secret;

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Crear pool de conexiones a MySQL usando la configuración
const pool = mysql.createPool({
  host: DB_CONFIG.host,
  user: DB_CONFIG.user,
  password: DB_CONFIG.password,
  database: DB_CONFIG.database,
  port: DB_CONFIG.port,
  ssl: DB_CONFIG.ssl,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
}).promise();

// Middleware para pasar la conexión a las rutas
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Verificar conexión y estructura de la base de datos
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    console.log(`✅ Conectado a la base de datos: ${DB_CONFIG.database} en ${DB_CONFIG.host}`);
    
    // Verificar si la tabla usuarios existe
    try {
      const [tables] = await connection.query('SHOW TABLES LIKE "usuarios"');
      if (tables.length === 0) {
        console.log('La tabla usuarios no existe, creándola...');
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
      
      // Verificar otras tablas necesarias
      await checkAndCreateTables(connection);
    } catch (err) {
      console.error('Error al verificar/crear tabla:', err);
    }
    
    connection.release();
  } catch (error) {
    console.error('❌ Error al conectar a MySQL:', error.message);
    
    if (process.env.DB_HOST) {
      // Estamos en Azure
      console.error('Verifica que:');
      console.error('1. El servidor MySQL de Azure esté ejecutándose');
      console.error('2. Las variables de entorno estén configuradas correctamente');
      console.error('3. El firewall permita conexiones desde Azure');
    } else {
      // Estamos en local
      console.error('Verifica que:');
      console.error('1. MySQL esté ejecutándose');
      console.error('2. El usuario "root" exista');
      console.error('3. La contraseña sea correcta');
    }
  }
};

// Función para verificar y crear todas las tablas necesarias
async function checkAndCreateTables(connection) {
  // Verificar si la tabla medicamentos existe
  const [medicamentosTables] = await connection.query('SHOW TABLES LIKE "medicamentos"');
  if (medicamentosTables.length === 0) {
    console.log('La tabla medicamentos no existe, creándola...');
    await connection.query(`
      CREATE TABLE medicamentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        principio_activo VARCHAR(255) NOT NULL,
        es_generico BOOLEAN DEFAULT FALSE,
        imagen_url VARCHAR(255),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_nombre (nombre)
      )
    `);
    console.log('Tabla medicamentos creada correctamente');
  }

  // Verificar si la tabla farmacias existe
  const [farmaciasTables] = await connection.query('SHOW TABLES LIKE "farmacias"');
  if (farmaciasTables.length === 0) {
    console.log('La tabla farmacias no existe, creándola...');
    await connection.query(`
      CREATE TABLE farmacias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL,
        sitio_web VARCHAR(255),
        logo_url VARCHAR(255),
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_nombre (nombre)
      )
    `);
    console.log('Tabla farmacias creada correctamente');
    
    // Insertar farmacias predeterminadas
    await connection.query(`
      INSERT INTO farmacias (nombre, sitio_web, logo_url) VALUES 
      ('Ahumada', 'https://www.farmaciasahumada.cl', 'https://www.farmaciasahumada.cl/logo.png'),
      ('Cruz Verde', 'https://www.cruzverde.cl', 'https://www.cruzverde.cl/logo.png'),
      ('Salcobrand', 'https://salcobrand.cl', 'https://salcobrand.cl/logo.png')
    `);
    console.log('Datos predeterminados de farmacias insertados');
  }

  // Verificar si la tabla precios_medicamentos existe
  const [preciosTables] = await connection.query('SHOW TABLES LIKE "precios_medicamentos"');
  if (preciosTables.length === 0) {
    console.log('La tabla precios_medicamentos no existe, creándola...');
    await connection.query(`
      CREATE TABLE precios_medicamentos (
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
      )
    `);
    console.log('Tabla precios_medicamentos creada correctamente');
  }

  // Verificar si la tabla tratamientos existe
  const [tratamientosTables] = await connection.query('SHOW TABLES LIKE "tratamientos"');
  if (tratamientosTables.length === 0) {
    console.log('La tabla tratamientos no existe, creándola...');
    await connection.query(`
      CREATE TABLE tratamientos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        fecha_inicio DATE,
        fecha_fin DATE,
        activo BOOLEAN DEFAULT TRUE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabla tratamientos creada correctamente');
  }

  // Verificar si la tabla medicamentos_tratamientos existe
  const [medTratTables] = await connection.query('SHOW TABLES LIKE "medicamentos_tratamientos"');
  if (medTratTables.length === 0) {
    console.log('La tabla medicamentos_tratamientos no existe, creándola...');
    await connection.query(`
      CREATE TABLE medicamentos_tratamientos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tratamiento_id INT NOT NULL,
        medicamento_id INT NOT NULL,
        dosis VARCHAR(100),
        frecuencia VARCHAR(100),
        recordatorio_activo BOOLEAN DEFAULT FALSE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tratamiento_id) REFERENCES tratamientos(id) ON DELETE CASCADE,
        FOREIGN KEY (medicamento_id) REFERENCES medicamentos(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabla medicamentos_tratamientos creada correctamente');
  }

  // Verificar si la tabla recordatorios_compra existe
  const [recordatoriosTables] = await connection.query('SHOW TABLES LIKE "recordatorios_compra"');
  if (recordatoriosTables.length === 0) {
    console.log('La tabla recordatorios_compra no existe, creándola...');
    await connection.query(`
      CREATE TABLE recordatorios_compra (
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
      )
    `);
    console.log('Tabla recordatorios_compra creada correctamente');
  }
}

testConnection();

// Creación del directorio api si no existe
const apiDir = path.join(__dirname, 'api');
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
  console.log('Directorio api creado correctamente');
}

// Cargar módulos de API
try {
  // Importar rutas existentes
  const usuariosRoutes = require('./api/usuarios');
  const medicamentosRoutes = require('./api/medicamentos');
  const pharmacyStockRoutes = require('./api/pharmacyStock');
  const tratamientosRoutes = require('./api/tratamientos');

  // Registrar rutas
  app.use('/api/usuarios', usuariosRoutes);
  app.use('/api/medicamentos', medicamentosRoutes);
  app.use('/api/stock', pharmacyStockRoutes);
  app.use('/api/tratamientos', tratamientosRoutes);
  
  console.log('✅ Rutas API cargadas correctamente:');
  console.log('   - /api/usuarios');
  console.log('   - /api/medicamentos');
  console.log('   - /api/stock');
  console.log('   - /api/tratamientos');
} catch (error) {
  console.error('❌ Error al cargar módulos de API:', error);
}

// Ruta de prueba simple
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de Farmacia funcionando correctamente',
    database: DB_CONFIG.database,
    host: DB_CONFIG.host,
    environment: process.env.DB_HOST ? 'Azure' : 'Local',
    jwt_configured: DB_CONFIG.jwt_secret ? true : false,
    available_apis: [
      '/api/usuarios',
      '/api/medicamentos',
      '/api/stock',
      '/api/tratamientos'
    ]
  });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${port}`);
  console.log(`📊 Usando base de datos: ${DB_CONFIG.database} en ${DB_CONFIG.host}`);
  console.log(`🌐 Entorno: ${process.env.DB_HOST ? 'AZURE' : 'LOCAL'}`);
  console.log(`🔐 JWT configurado: ${DB_CONFIG.jwt_secret ? 'SÍ' : 'NO'}`);
  console.log(`📦 APIs disponibles:`);
  console.log(`   - Usuarios: /api/usuarios`);
  console.log(`   - Medicamentos: /api/medicamentos`);
  console.log(`   - Stock: /api/stock`);
  console.log(`   - Tratamientos: /api/tratamientos`);
});