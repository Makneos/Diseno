const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log('Directorio actual:', process.cwd());

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Crear pool de conexiones a MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'farmacia_app',
  password: 'Farmacia?#2027',
  database: 'farmacia',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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
    console.log('Conexión a MySQL establecida correctamente');
    
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
    console.error('Error al conectar a MySQL:', error);
    console.error('Verifica tus credenciales en el archivo .env y asegúrate de que el servidor MySQL esté en ejecución.');
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
  // Importar rutas
  const usuariosRoutes = require('./api/usuarios');
  const medicamentosRoutes = require('./api/medicamentos');

  // Registrar rutas
  app.use('/api/usuarios', usuariosRoutes);
  app.use('/api/medicamentos', medicamentosRoutes);
} catch (error) {
  console.error('Error al cargar módulos de API:', error);
}

// Ruta de prueba simple
app.get('/', (req, res) => {
  res.json({ message: 'API de Farmacia funcionando correctamente' });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
});