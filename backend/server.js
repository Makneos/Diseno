const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log('Directorio actual:', process.cwd());
console.log('Contenido de la carpeta:');
const fs = require('fs');
fs.readdirSync('.').forEach(file => {
  console.log(file);
});



// Mostrar variables cargadas para diagnóstico
console.log('Variables de entorno cargadas:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '******' : 'No definida');
console.log('DB_NAME:', process.env.DB_NAME);
console.log('PATH:', __dirname);

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Verificar que todas las variables necesarias existen
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  console.error('ERROR: Faltan variables de entorno necesarias. Asegúrate de tener un archivo .env válido.');
  process.exit(1);
}

// Crear pool de conexiones a MySQL
const pool = mysql.createPool({
  host: 'localhost',
  user: 'farmacia_app',
  password: 'Farmacia?#2027',  // La misma contraseña que funcionó en test-conexion.js
  database: 'farmacia',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

// Verificar conexión
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
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log('Tabla usuarios creada correctamente');
      } else {
        console.log('Tabla usuarios encontrada');
      }
    } catch (err) {
      console.error('Error al verificar/crear tabla:', err);
    }
    
    connection.release();
  } catch (error) {
    console.error('Error al conectar a MySQL:', error);
    console.error('Verifica tus credenciales en el archivo .env y asegúrate de que el servidor MySQL esté en ejecución.');
  }
};

testConnection();

// Ruta de prueba simple
app.get('/', (req, res) => {
  res.json({ message: 'API de Farmacia funcionando correctamente' });
});

// Rutas API
app.get('/api/usuarios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM usuarios');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

app.post('/api/usuarios', async (req, res) => {
  const { nombre, email } = req.body;
  
  if (!nombre || !email) {
    return res.status(400).json({ error: 'Se requieren nombre y email' });
  }
  
  try {
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email) VALUES (?, ?)',
      [nombre, email]
    );
    
    res.status(201).json({
      id: result.insertId,
      nombre,
      email,
      message: 'Usuario creado correctamente'
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
});