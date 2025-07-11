/**
 * API de usuarios con JWT corregido - CON RUTA GET AGREGADA
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();

// ✅ Clave secreta para JWT - usar la del proceso o una por defecto
const JWT_SECRET = process.env.JWT_SECRET || 'farmacia_jwt_super_secret_key_2024_muy_larga_y_segura_12345';

console.log('🔐 JWT_SECRET configured:', JWT_SECRET ? 'YES' : 'NO');

// ✅ Middleware mejorado para verificar JWT
const verificarToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  console.log('🔍 Auth header received:', authHeader);
  
  if (!authHeader) {
    console.log('❌ No Authorization header provided');
    return res.status(401).json({ error: 'No se proporcionó token de acceso' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  console.log('🎫 Token extracted:', token ? 'YES' : 'NO');
  
  if (!token) {
    console.log('❌ No token found in Authorization header');
    return res.status(401).json({ error: 'Token de acceso inválido' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verified successfully for user:', decoded.id);
    req.usuario = decoded;
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

/**
 * ✅ RUTA FALTANTE AGREGADA
 * @route   GET /api/usuarios
 * @desc    Obtener todos los usuarios (para verificar que funciona)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 GET /api/usuarios - Getting user list');
    const [rows] = await req.db.query('SELECT id, nombre, email, fecha_creacion FROM usuarios');
    
    res.json({
      success: true,
      data: rows,
      total: rows.length,
      message: `Found ${rows.length} users`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener usuarios',
      details: error.message 
    });
  }
});

/**
 * @route   POST /api/usuarios/registro
 * @desc    Registrar un nuevo usuario
 * @access  Public
 */
router.post('/registro', async (req, res) => {
  const { nombre, email, contrasena } = req.body;
  
  console.log('📝 Registration attempt for:', email);
  
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
    
    console.log('✅ User registered successfully:', result.insertId);
    
    res.status(201).json({
      success: true,
      id: result.insertId,
      nombre,
      email,
      message: 'Usuario registrado correctamente'
    });
  } catch (error) {
    console.error('❌ Error al registrar usuario:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        success: false,
        error: 'El email ya está registrado' 
      });
    }
    res.status(500).json({ 
      success: false,
      error: 'Error al registrar usuario' 
    });
  }
});

/**
 * @route   POST /api/usuarios/login
 * @desc    Iniciar sesión y generar JWT - CORREGIDO
 * @access  Public
 */
router.post('/login', async (req, res) => {
  const { email, contrasena } = req.body;
  
  console.log('🔑 Login attempt for email:', email);
  
  if (!email || !contrasena) {
    return res.status(400).json({ 
      success: false,
      error: 'Se requieren email y contraseña' 
    });
  }
  
  try {
    const [rows] = await req.db.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );
    
    if (rows.length === 0) {
      console.log('❌ User not found for email:', email);
      return res.status(401).json({ 
        success: false,
        error: 'Credenciales incorrectas' 
      });
    }
    
    const usuario = rows[0];
    console.log('👤 User found:', usuario.id, usuario.nombre);
    
    // Comparar la contraseña
    const passwordMatch = await bcrypt.compare(contrasena, usuario.contrasena);
    
    if (!passwordMatch) {
      console.log('❌ Password mismatch for user:', usuario.id);
      return res.status(401).json({ 
        success: false,
        error: 'Credenciales incorrectas' 
      });
    }
    
    console.log('✅ Password match - generating JWT...');
    
    // ✅ Crear el payload del JWT con información esencial
    const payload = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      iat: Math.floor(Date.now() / 1000), // Issued at time
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // Expires in 24 hours
    };
    
    console.log('📦 JWT payload:', { id: payload.id, email: payload.email, exp: new Date(payload.exp * 1000) });
    
    // ✅ Generar el JWT
    const token = jwt.sign(payload, JWT_SECRET, { 
      algorithm: 'HS256'
    });
    
    console.log('🎫 JWT generated successfully, length:', token.length);
    
    // ✅ Eliminar la contraseña del objeto antes de devolverlo
    const { contrasena: _, ...usuarioSinPassword } = usuario;
    
    const response = {
      success: true,
      ...usuarioSinPassword,
      token, // ✅ Incluir el token en la respuesta
      message: 'Inicio de sesión exitoso'
    };
    
    console.log('✅ Login successful for user:', usuario.id);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error al iniciar sesión:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al iniciar sesión' 
    });
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
    
    res.json({
      success: true,
      data: rows[0]
    });
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
    
    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
});

// ✅ NUEVA RUTA: Verificar token
router.get('/verificar-token', verificarToken, (req, res) => {
  res.json({
    success: true,
    valido: true,
    usuario: req.usuario,
    message: 'Token válido'
  });
});

module.exports = router;