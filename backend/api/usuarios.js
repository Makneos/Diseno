/**
 * API de usuarios
 * Contiene todas las rutas relacionadas con la gestión de usuarios
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // JWT agregado
const router = express.Router();

// Clave secreta para JWT
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura_aqui';

// Middleware para verificar JWT
const verificarToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No se proporcionó token de acceso' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

/**
 * @route   GET /api/usuarios
 * @desc    Obtener todos los usuarios
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await req.db.query('SELECT id, nombre, email, fecha_creacion FROM usuarios');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

/**
 * @route   POST /api/usuarios/registro
 * @desc    Registrar un nuevo usuario
 * @access  Public
 */
router.post('/registro', async (req, res) => {
  const { nombre, email, contrasena } = req.body;
  
  if (!nombre || !email || !contrasena) {
    return res.status(400).json({ error: 'Se requieren nombre, email y contraseña' });
  }
  
  try {
    // Encriptar la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(contrasena, saltRounds);
    
    const [result] = await req.db.query(
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

/**
 * @route   POST /api/usuarios/login
 * @desc    Iniciar sesión y generar JWT
 * @access  Public
 */
router.post('/login', async (req, res) => {
  const { email, contrasena } = req.body;
  
  if (!email || !contrasena) {
    return res.status(400).json({ error: 'Se requieren email y contraseña' });
  }
  
  try {
    const [rows] = await req.db.query(
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
    
    // Crear el payload del JWT
    const payload = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre
    };
    
    // Generar el JWT
    const token = jwt.sign(
      payload, 
      JWT_SECRET, 
      { expiresIn: '24h' } // Token expira en 24 horas
    );
    
    // Eliminar la contraseña del objeto antes de devolverlo
    delete usuario.contrasena;
    
    res.json({
      ...usuario,
      token, // Incluir el token en la respuesta
      message: 'Inicio de sesión exitoso'
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

/**
 * @route   GET /api/usuarios/perfil
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private (requiere token)
 */
router.get('/perfil', verificarToken, async (req, res) => {
  try {
    const [rows] = await req.db.query(
      'SELECT id, nombre, email, fecha_creacion FROM usuarios WHERE id = ?',
      [req.usuario.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

/**
 * @route   GET /api/usuarios/:id
 * @desc    Obtener un usuario por su ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await req.db.query(
      'SELECT id, nombre, email, fecha_creacion FROM usuarios WHERE id = ?',
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

module.exports = router;