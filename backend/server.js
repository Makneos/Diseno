const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno
require('dotenv').config();

// ✅ GROQ SDK
const Groq = require("groq-sdk");
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

const app = express();
const port = process.env.PORT || 5000;

// ✅ CONFIGURACIÓN PARA RAILWAY/AZURE
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
console.log('- GROQ_API_KEY:', process.env.GROQ_API_KEY ? 'SÍ' : 'NO');
console.log('- NODE_ENV:', process.env.NODE_ENV || 'development');

// ✅ CORS OPTIMIZADO
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://red-cliff-05a52f31e.2.azurestaticapps.net',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000'
    ];
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`⚠️ Origen no listado: ${origin} - permitiendo temporalmente`);
      callback(null, true);
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

// ✅ CARGAR RUTAS API
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

// Google Auth
try {
  const googleAuthRoutes = require('./api/googleAuth');
  app.use('/', googleAuthRoutes);
  console.log('✅ /auth/google y /auth/google/callback registrados');
} catch (error) {
  console.error('❌ Error cargando GoogleAuth:', error.message);
}

console.log('✅ Rutas API cargadas correctamente');

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
    groq_configured: process.env.GROQ_API_KEY ? true : false,
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
      '/api/tratamientos',
      '/api/chatbot-medico'
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
      groq: process.env.GROQ_API_KEY ? 'configured' : 'not configured',
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

// ============================================
// 🤖 ENDPOINT CHATBOT MÉDICO CON GROQ
// ============================================
app.post('/api/chatbot-medico', async (req, res) => {
    try {
        const { mensaje, historial = [] } = req.body;

        if (!mensaje) {
            return res.status(400).json({ error: 'Se requiere el campo "mensaje"' });
        }

        console.log(`🤖 Chatbot médico (Groq): "${mensaje}"`);

        const systemPrompt = `Eres un asistente virtual de farmacia llamado "FarmaBot". Tu función es:

1. Escuchar síntomas comunes del usuario
2. Sugerir medicamentos de venta libre apropiados
3. Dar consejos básicos de salud
4. SIEMPRE incluir el disclaimer de que no reemplazas la opinión de un profesional

REGLAS IMPORTANTES:
- Para síntomas graves o persistentes, SIEMPRE recomienda ver a un médico
- Solo sugiere medicamentos de venta libre comunes
- Sé breve y claro (máximo 100 palabras por respuesta)
- Incluye el disclaimer al final de cada recomendación
- Nunca diagnostiques enfermedades específicas
- Si no estás seguro, recomienda consultar a un profesional`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...historial,
            { role: 'user', content: mensaje }
        ];

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            max_tokens: 300,
            temperature: 0.7,
        });

        const respuesta = completion.choices[0].message.content;

        console.log('✅ Respuesta generada con Groq');

        res.json({
            respuesta: respuesta,
            uso: {
                prompt_tokens: completion.usage?.prompt_tokens || 0,
                completion_tokens: completion.usage?.completion_tokens || 0,
                total_tokens: completion.usage?.total_tokens || 0
            }
        });

    } catch (error) {
        console.error('❌ Error en chatbot:', error.message);
        res.status(500).json({ error: 'Error al procesar la consulta' });
    }
});

app.post('/api/chatbot-medico-audio', async (req, res) => {
    try {
        const { mensaje, historial = [] } = req.body;

        if (!mensaje) {
            return res.status(400).json({ error: 'Se requiere el campo "mensaje"' });
        }

        console.log(`🤖 Chatbot médico (Groq): "${mensaje}"`);

        const systemPrompt = `Eres un asistente virtual de farmacia llamado "FarmaBot". Sé breve y claro (máximo 80 palabras).`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...historial,
            { role: 'user', content: mensaje }
        ];

        const completion = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: messages,
            max_tokens: 250,
            temperature: 0.7,
        });

        const respuestaTexto = completion.choices[0].message.content;

        res.json({
            respuesta: respuestaTexto,
            audio: null,
            uso: {
                prompt_tokens: completion.usage?.prompt_tokens || 0,
                completion_tokens: completion.usage?.completion_tokens || 0,
                total_tokens: completion.usage?.total_tokens || 0
            }
        });

    } catch (error) {
        console.error('❌ Error en chatbot:', error.message);
        res.status(500).json({ error: 'Error al procesar la consulta' });
    }
});

app.get('/test', (req, res) => {
  res.json({
    message: 'Test endpoint funcionando',
    server_time: new Date().toISOString()
  });
});

// ============================================
// 🎨 SERVIR FRONTEND (React build)
// ============================================
const localFrontendPath = path.join(__dirname, '..', 'frontend', 'build');  // entorno local
const deployedFrontendPath = path.join(__dirname, 'frontend', 'build');     // entorno Azure

// Detectar cuál usar
const frontendPath = fs.existsSync(deployedFrontendPath)
  ? deployedFrontendPath
  : localFrontendPath;

console.log('📂 Frontend path detectado:', frontendPath);
console.log('📁 Frontend existe:', fs.existsSync(frontendPath));

// Servir archivos estáticos del frontend
app.use(express.static(frontendPath));

// Catch-all para rutas que no sean /api
// IMPORTANTE: Esto debe ir AL FINAL, después de todas las rutas API
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ✅ Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('❌ Error no manejado:', err.message);
  
  res.status(err.status || 500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// ✅ Inicializar aplicación
const startServer = async () => {
  try {
    console.log('🚀 Iniciando servidor Farmafia...');
    
    await testConnection();
    
    app.listen(port, '0.0.0.0', () => {
      console.log('='.repeat(60));
      console.log('🚀 Servidor iniciado exitosamente!');
      console.log(`📡 Escuchando en puerto ${port}`);
      console.log(`🌐 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📁 Frontend: ${fs.existsSync(frontendPath) ? frontendPath : 'No disponible'}`);
      console.log('='.repeat(60));
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

// Iniciar servidor
startServer();