/**
 * API de tratamientos y medicamentos seguidos - JWT CORREGIDO
 * Para conectar con MyMedicationsPage
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// ✅ Usar la misma clave secreta que usuarios.js
const JWT_SECRET = process.env.JWT_SECRET || 'farmacia_jwt_super_secret_key_2024_muy_larga_y_segura_12345';

console.log('🔐 Tratamientos JWT_SECRET configured:', JWT_SECRET ? 'YES' : 'NO');

// ✅ Middleware mejorado para verificar JWT (igual que usuarios.js)
const verificarToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  console.log('🔍 Tratamientos - Auth header received:', authHeader);
  
  if (!authHeader) {
    console.log('❌ Tratamientos - No Authorization header provided');
    return res.status(401).json({ error: 'No se proporcionó token de acceso' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  console.log('🎫 Tratamientos - Token extracted:', token ? 'YES' : 'NO');
  
  if (!token) {
    console.log('❌ Tratamientos - No token found in Authorization header');
    return res.status(401).json({ error: 'Token de acceso inválido' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Tratamientos - Token verified successfully for user:', decoded.id);
    req.usuario = decoded;
    next();
  } catch (error) {
    console.error('❌ Tratamientos - Token verification failed:', error.message);
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

/**
 * @route   GET /api/tratamientos/mis-medicamentos
 * @desc    Obtener todos los medicamentos/tratamientos del usuario
 * @access  Private
 */
router.get('/mis-medicamentos', verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    console.log('📋 Getting medications for user:', usuarioId);
    
    // Obtener tratamientos activos del usuario
    const [tratamientos] = await req.db.query(`
      SELECT 
        t.id as tratamiento_id,
        t.nombre as tratamiento_nombre,
        t.descripcion as tratamiento_descripcion,
        t.fecha_inicio,
        t.fecha_fin,
        t.activo as tratamiento_activo,
        m.id as medicamento_id,
        m.nombre as medicamento_nombre,
        m.principio_activo,
        m.es_generico,
        m.imagen_url,
        mt.dosis,
        mt.frecuencia,
        mt.recordatorio_activo
      FROM tratamientos t
      LEFT JOIN medicamentos_tratamientos mt ON t.id = mt.tratamiento_id
      LEFT JOIN medicamentos m ON mt.medicamento_id = m.id
      WHERE t.usuario_id = ?
      ORDER BY t.fecha_inicio DESC, m.nombre ASC
    `, [usuarioId]);

    console.log(`📊 Found ${tratamientos.length} treatment records for user ${usuarioId}`);

    // Procesar datos para el formato que espera MyMedicationsPage
    const medicamentosAgrupados = {};
    
    tratamientos.forEach(row => {
      if (!row.medicamento_id) return; // Skip tratamientos sin medicamentos
      
      const key = `${row.tratamiento_id}-${row.medicamento_id}`;
      
      if (!medicamentosAgrupados[key]) {
        // Calcular duración en días
        const fechaInicio = new Date(row.fecha_inicio);
        const fechaFin = row.fecha_fin ? new Date(row.fecha_fin) : null;
        const hoy = new Date();
        
        let duration = 0;
        let status = 'active';
        
        if (fechaFin) {
          duration = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
          if (fechaFin < hoy) {
            status = 'completed';
          }
        }
        
        if (!row.tratamiento_activo) {
          status = 'standby';
        }
        
        // Determinar categoría basada en el medicamento
        let category = 'prescription';
        if (row.medicamento_nombre?.toLowerCase().includes('vitamin')) {
          category = 'supplement';
        } else if (row.es_generico) {
          category = 'otc';
        }
        
        // Parsear frecuencia para obtener horarios
        let times = ['08:00'];
        let frequency = 'daily';
        
        if (row.frecuencia) {
          const freq = row.frecuencia.toLowerCase();
          if (freq.includes('cada 8')) {
            times = ['08:00', '16:00', '00:00'];
          } else if (freq.includes('cada 12')) {
            times = ['08:00', '20:00'];
          } else if (freq.includes('cada 6')) {
            times = ['06:00', '12:00', '18:00', '00:00'];
          } else if (freq.includes('semanal')) {
            frequency = 'weekly';
            times = ['09:00'];
          } else if (freq.includes('necesario')) {
            frequency = 'as-needed';
            times = [];
          }
        }
        
        medicamentosAgrupados[key] = {
          id: parseInt(`${row.tratamiento_id}${row.medicamento_id}`), // ID único combinado
          tratamiento_id: row.tratamiento_id,
          medicamento_id: row.medicamento_id,
          name: row.medicamento_nombre,
          dosage: row.dosis || 'No especificado',
          frequency: frequency,
          times: times,
          duration: duration,
          startDate: row.fecha_inicio?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
          category: category,
          reminder: row.recordatorio_activo === 1,
          notes: row.tratamiento_descripcion || '',
          status: status,
          principio_activo: row.principio_activo,
          es_generico: row.es_generico === 1,
          imagen_url: row.imagen_url
        };
      }
    });
    
    const medicamentos = Object.values(medicamentosAgrupados);
    
    console.log(`✅ User ${usuarioId}: ${medicamentos.length} unique medications processed`);
    
    res.json({
      success: true,
      data: medicamentos,
      total: medicamentos.length
    });
    
  } catch (error) {
    console.error('❌ Error al obtener medicamentos del usuario:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener medicamentos',
      details: error.message 
    });
  }
});

/**
 * @route   POST /api/tratamientos/agregar-medicamento
 * @desc    Agregar un nuevo medicamento/tratamiento
 * @access  Private
 */
router.post('/agregar-medicamento', verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const {
      name,
      dosage,
      frequency,
      times,
      duration,
      startDate,
      notes,
      reminder,
      category
    } = req.body;
    
    console.log('💊 Adding medication for user:', usuarioId);
    console.log('📋 Medication data:', { name, dosage, frequency, duration });
    
    if (!name || !dosage) {
      return res.status(400).json({ 
        success: false,
        error: 'Nombre y dosis son requeridos' 
      });
    }
    
    // Buscar o crear el medicamento en la tabla medicamentos
    let medicamentoId;
    
    // Primero buscar si existe
    const [medicamentoExistente] = await req.db.query(
      'SELECT id FROM medicamentos WHERE nombre LIKE ?',
      [`%${name}%`]
    );
    
    if (medicamentoExistente.length > 0) {
      medicamentoId = medicamentoExistente[0].id;
      console.log('📦 Using existing medication ID:', medicamentoId);
    } else {
      // Crear nuevo medicamento
      const principioActivo = name.split(' ')[0]; // Simplificado
      const esGenerico = category === 'otc' || name.toLowerCase().includes('generico');
      
      const [nuevoMedicamento] = await req.db.query(
        'INSERT INTO medicamentos (nombre, principio_activo, es_generico) VALUES (?, ?, ?)',
        [name, principioActivo, esGenerico]
      );
      
      medicamentoId = nuevoMedicamento.insertId;
      console.log('🆕 Created new medication ID:', medicamentoId);
    }
    
    // Crear el tratamiento
    const fechaFin = duration > 0 ? 
      new Date(new Date(startDate).getTime() + (duration * 24 * 60 * 60 * 1000)).toISOString().split('T')[0] : 
      null;
    
    console.log('📅 Treatment dates:', { startDate, fechaFin, duration });
    
    const [nuevoTratamiento] = await req.db.query(
      'INSERT INTO tratamientos (usuario_id, nombre, descripcion, fecha_inicio, fecha_fin, activo) VALUES (?, ?, ?, ?, ?, true)',
      [usuarioId, name, notes, startDate, fechaFin]
    );
    
    const tratamientoId = nuevoTratamiento.insertId;
    console.log('🏥 Created new treatment ID:', tratamientoId);
    
    // Crear la relación medicamento-tratamiento
    const frecuenciaTexto = frequency === 'daily' ? 
      `Diario, ${times.length} veces` : 
      frequency === 'weekly' ? 'Semanal' : 'Según necesidad';
    
    await req.db.query(
      'INSERT INTO medicamentos_tratamientos (tratamiento_id, medicamento_id, dosis, frecuencia, recordatorio_activo) VALUES (?, ?, ?, ?, ?)',
      [tratamientoId, medicamentoId, dosage, frecuenciaTexto, reminder]
    );
    
    console.log('🔗 Created medication-treatment relationship');
    
    // Si hay recordatorios activos, crear recordatorios de compra
    if (reminder && duration > 0) {
      const fechaRecordatorio = new Date(fechaFin);
      fechaRecordatorio.setDate(fechaRecordatorio.getDate() - 3); // 3 días antes
      
      await req.db.query(
        'INSERT INTO recordatorios_compra (usuario_id, medicamento_id, fecha_recordatorio, activo) VALUES (?, ?, ?, true)',
        [usuarioId, medicamentoId, fechaRecordatorio.toISOString().split('T')[0]]
      );
      
      console.log('🔔 Created purchase reminder');
    }
    
    console.log('✅ Medication added successfully');
    
    res.status(201).json({
      success: true,
      message: 'Medicamento agregado exitosamente',
      data: {
        tratamiento_id: tratamientoId,
        medicamento_id: medicamentoId
      }
    });
    
  } catch (error) {
    console.error('❌ Error al agregar medicamento:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al agregar medicamento',
      details: error.message 
    });
  }
});

/**
 * @route   PUT /api/tratamientos/actualizar/:tratamientoId
 * @desc    Actualizar un tratamiento existente
 * @access  Private
 */
router.put('/actualizar/:tratamientoId', verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { tratamientoId } = req.params;
    const { status, notes } = req.body;
    
    // Verificar que el tratamiento pertenece al usuario
    const [tratamiento] = await req.db.query(
      'SELECT id FROM tratamientos WHERE id = ? AND usuario_id = ?',
      [tratamientoId, usuarioId]
    );
    
    if (tratamiento.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Tratamiento no encontrado' 
      });
    }
    
    // Actualizar el tratamiento
    const activo = status === 'active';
    const fechaFin = status === 'completed' ? new Date().toISOString().split('T')[0] : null;
    
    await req.db.query(
      'UPDATE tratamientos SET activo = ?, descripcion = ?, fecha_fin = ? WHERE id = ?',
      [activo, notes, fechaFin, tratamientoId]
    );
    
    res.json({
      success: true,
      message: 'Tratamiento actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('Error al actualizar tratamiento:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al actualizar tratamiento' 
    });
  }
});

/**
 * @route   DELETE /api/tratamientos/eliminar/:tratamientoId
 * @desc    Eliminar un tratamiento
 * @access  Private
 */
router.delete('/eliminar/:tratamientoId', verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { tratamientoId } = req.params;
    
    console.log(`🗑️ Deleting treatment ${tratamientoId} for user ${usuarioId}`);
    
    // Verificar que el tratamiento pertenece al usuario
    const [tratamiento] = await req.db.query(
      'SELECT id FROM tratamientos WHERE id = ? AND usuario_id = ?',
      [tratamientoId, usuarioId]
    );
    
    if (tratamiento.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Tratamiento no encontrado' 
      });
    }
    
    // Eliminar relaciones primero (debido a foreign keys)
    await req.db.query(
      'DELETE FROM medicamentos_tratamientos WHERE tratamiento_id = ?',
      [tratamientoId]
    );
    
    console.log('🔗 Deleted medication-treatment relationships');
    
    // Eliminar recordatorios relacionados
    await req.db.query(
      'DELETE FROM recordatorios_compra WHERE usuario_id = ? AND medicamento_id IN (SELECT medicamento_id FROM medicamentos_tratamientos WHERE tratamiento_id = ?)',
      [usuarioId, tratamientoId]
    );
    
    console.log('🔔 Deleted related reminders');
    
    // Eliminar el tratamiento
    await req.db.query(
      'DELETE FROM tratamientos WHERE id = ?',
      [tratamientoId]
    );
    
    console.log('🏥 Deleted treatment');
    
    res.json({
      success: true,
      message: 'Tratamiento eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error al eliminar tratamiento:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al eliminar tratamiento',
      details: error.message 
    });
  }
});

/**
 * @route   GET /api/tratamientos/estadisticas
 * @desc    Obtener estadísticas de medicamentos del usuario
 * @access  Private
 */
router.get('/estadisticas', verificarToken, async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    
    // Contar tratamientos por estado
    const [stats] = await req.db.query(`
      SELECT 
        COUNT(CASE WHEN activo = 1 AND (fecha_fin IS NULL OR fecha_fin >= CURDATE()) THEN 1 END) as activos,
        COUNT(CASE WHEN activo = 0 THEN 1 END) as standby,
        COUNT(CASE WHEN fecha_fin < CURDATE() THEN 1 END) as completados,
        COUNT(*) as total
      FROM tratamientos 
      WHERE usuario_id = ?
    `, [usuarioId]);
    
    // Contar recordatorios activos
    const [recordatorios] = await req.db.query(`
      SELECT COUNT(*) as con_recordatorios
      FROM medicamentos_tratamientos mt
      JOIN tratamientos t ON mt.tratamiento_id = t.id
      WHERE t.usuario_id = ? AND mt.recordatorio_activo = 1
    `, [usuarioId]);
    
    res.json({
      success: true,
      data: {
        activos: stats[0].activos || 0,
        standby: stats[0].standby || 0,
        completados: stats[0].completados || 0,
        total: stats[0].total || 0,
        con_recordatorios: recordatorios[0].con_recordatorios || 0
      }
    });
    
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error al obtener estadísticas' 
    });
  }
});

/**
 * @route   GET /api/tratamientos/test-auth
 * @desc    Probar autenticación JWT
 * @access  Private
 */
router.get('/test-auth', verificarToken, (req, res) => {
  res.json({
    success: true,
    message: 'Autenticación JWT funcionando correctamente',
    usuario: {
      id: req.usuario.id,
      email: req.usuario.email,
      nombre: req.usuario.nombre
    }
  });
});

module.exports = router;