const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt'); // Add this package for password hashing

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
  user: 'root',
  password: '',
  database: 'farmacia',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

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
      } else {
        // Verificar si la columna contrasena existe
        try {
          const [columns] = await connection.query('SHOW COLUMNS FROM usuarios LIKE "contrasena"');
          if (columns.length === 0) {
            console.log('La columna contrasena no existe, agregándola...');
            await connection.query('ALTER TABLE usuarios ADD COLUMN contrasena VARCHAR(255) NOT NULL');
            console.log('Columna contrasena agregada correctamente');
          } else {
            console.log('Columna contrasena encontrada');
          }
        } catch (err) {
          console.error('Error al verificar/agregar columna:', err);
        }
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

// Rutas API de usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, nombre, email, fecha_creacion FROM usuarios');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Registrar un nuevo usuario
app.post('/api/usuarios/registro', async (req, res) => {
  const { nombre, email, contrasena } = req.body;
  
  if (!nombre || !email || !contrasena) {
    return res.status(400).json({ error: 'Se requieren nombre, email y contraseña' });
  }
  
  try {
    // Encriptar la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(contrasena, saltRounds);
    
    const [result] = await pool.query(
      'INSERT INTO usuarios (nombre, email, contrasena) VALUES (?, ?, ?)',
      [nombre, email, hashedPassword]
    );
    
    res.status(201).json({
      id: result.insertId,
      nombre,
      email,
      message: 'Usuario registrado correctamente'
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Iniciar sesión
app.post('/api/usuarios/login', async (req, res) => {
  const { email, contrasena } = req.body;
  
  if (!email || !contrasena) {
    return res.status(400).json({ error: 'Se requieren email y contraseña' });
  }
  
  try {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    
    const usuario = rows[0];
    
    // Comparar la contraseña
    const passwordMatch = await bcrypt.compare(contrasena, usuario.contrasena);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    
    // Eliminar la contraseña del objeto antes de devolverlo
    delete usuario.contrasena;
    
    res.json({
      ...usuario,
      message: 'Inicio de sesión exitoso'
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor ejecutándose en http://localhost:${port}`);
});