/**
 * API de medicamentos - VERSION MEJORADA CON DEBUG
 */

const express = require('express');
const router = express.Router();

/**
 * Función para asignar imagen por defecto basada en el principio activo
 */
const getDefaultImageUrl = (principioActivo, nombre = '') => {
  const activo = principioActivo?.toLowerCase() || '';
  const nombreLower = nombre?.toLowerCase() || '';
  
  if (activo.includes('ibuprofeno')) {
    return 'https://www.cruzverde.cl/dw/image/v2/BDPM_PRD/on/demandware.static/-/Sites-masterCatalog_Chile/default/dw8f4e4e1e/images/large/103738-ibuprofeno-400-mg-20-comprimidos.jpg';
  }
  
  if (activo.includes('paracetamol')) {
    return 'https://www.cruzverde.cl/dw/image/v2/BDPM_PRD/on/demandware.static/-/Sites-masterCatalog_Chile/default/dw5a7de0d6/images/large/186508-paracetamol-mk-500-mg-20-comprimidos.jpg';
  }
  
  return 'https://via.placeholder.com/200x200/95a5a6/ffffff?text=Medicamento';
};

/**
 * @route   GET /api/medicamentos/buscar
 * @desc    Buscar medicamentos por nombre o principio activo
 * @access  Public
 */
router.get('/buscar', async (req, res) => {
  const { q } = req.query;
  
  console.log(`🔍 Búsqueda recibida: "${q}"`);
  
  if (!q || q.length < 3) {
    return res.status(400).json({ error: 'La búsqueda debe tener al menos 3 caracteres' });
  }
  
  try {
    const [rows] = await req.db.query(
      `SELECT id, nombre, principio_activo, es_generico, imagen_url 
       FROM medicamentos 
       WHERE nombre LIKE ? OR principio_activo LIKE ?
       LIMIT 20`,
      [`%${q}%`, `%${q}%`]
    );
    
    console.log(`📋 Medicamentos encontrados: ${rows.length}`);
    
    // Asegurar que todos los medicamentos tengan una imagen
    const medicamentosConImagenes = rows.map(med => ({
      ...med,
      imagen_url: med.imagen_url || getDefaultImageUrl(med.principio_activo, med.nombre)
    }));
    
    res.json(medicamentosConImagenes);
  } catch (error) {
    console.error('❌ Error al buscar medicamentos:', error);
    res.status(500).json({ error: 'Error al buscar medicamentos' });
  }
});

/**
 * @route   GET /api/medicamentos/precios-por-principio/:principioActivo
 * @desc    Obtener precios de medicamentos por principio activo - VERSION MEJORADA
 * @access  Public
 */
router.get('/precios-por-principio/:principioActivo', async (req, res) => {
  const { principioActivo } = req.params;
  
  console.log(`🔍 Buscando precios para principio activo: "${principioActivo}"`);
  
  try {
    // Paso 1: Búsqueda FLEXIBLE - exacta Y similar
    console.log('🔄 Intentando búsqueda exacta...');
    let [medicamentos] = await req.db.query(
      `SELECT id, nombre, principio_activo, es_generico, imagen_url 
       FROM medicamentos 
       WHERE principio_activo = ?`,
      [principioActivo]
    );
    
    if (medicamentos.length === 0) {
      console.log('🔄 Búsqueda exacta sin resultados, intentando búsqueda similar...');
      [medicamentos] = await req.db.query(
        `SELECT id, nombre, principio_activo, es_generico, imagen_url 
         FROM medicamentos 
         WHERE principio_activo LIKE ? OR nombre LIKE ?
         LIMIT 10`,
        [`%${principioActivo}%`, `%${principioActivo}%`]
      );
    }
    
    if (medicamentos.length === 0) {
      console.log('🔄 Sin resultados, intentando con cualquier medicamento como demo...');
      [medicamentos] = await req.db.query(
        `SELECT id, nombre, principio_activo, es_generico, imagen_url 
         FROM medicamentos 
         LIMIT 5`
      );
    }
    
    console.log(`📋 Medicamentos encontrados: ${medicamentos.length}`);
    
    if (medicamentos.length === 0) {
      return res.status(404).json({ 
        error: 'No se encontraron medicamentos en la base de datos',
        suggestion: 'Ejecuta import-data.js para cargar medicamentos'
      });
    }
    
    // Paso 2: Obtener precios para estos medicamentos
    const medicamentoIds = medicamentos.map(med => med.id);
    console.log(`🆔 IDs de medicamentos: [${medicamentoIds.join(', ')}]`);
    
    const [precios] = await req.db.query(
      `SELECT pm.id, pm.medicamento_id, m.nombre as medicamento_nombre, 
              m.es_generico, m.imagen_url as medicamento_imagen,
              pm.precio, pm.disponible, pm.url_producto, pm.fecha_actualizacion,
              f.id as farmacia_id, f.nombre as farmacia_nombre, f.logo_url as farmacia_logo
       FROM precios_medicamentos pm
       JOIN medicamentos m ON pm.medicamento_id = m.id
       JOIN farmacias f ON pm.farmacia_id = f.id
       WHERE pm.medicamento_id IN (${medicamentoIds.map(() => '?').join(',')})
       ORDER BY f.nombre ASC, pm.precio ASC`,
      medicamentoIds
    );
    
    console.log(`💰 Precios encontrados: ${precios.length}`);
    
    if (precios.length === 0) {
      return res.status(404).json({ 
        error: 'No hay precios disponibles para estos medicamentos',
        medicamentosEncontrados: medicamentos.length,
        medicamentos: medicamentos.map(m => ({ id: m.id, nombre: m.nombre })),
        sugerencia: 'Ejecuta update-prices.js para cargar precios'
      });
    }
    
    // Paso 3: Agrupar por farmacia
    const resultadosAgrupados = precios.reduce((acc, item) => {
      if (!acc[item.farmacia_nombre]) {
        acc[item.farmacia_nombre] = {
          farmacia: {
            id: item.farmacia_id,
            nombre: item.farmacia_nombre,
            logo_url: item.farmacia_logo
          },
          medicamentos: []
        };
      }
      
      const imagenFinal = item.medicamento_imagen || getDefaultImageUrl(item.medicamento_nombre);
      
      acc[item.farmacia_nombre].medicamentos.push({
        id: item.id,
        medicamento_id: item.medicamento_id,
        nombre: item.medicamento_nombre,
        es_generico: item.es_generico === 1,
        imagen_url: imagenFinal,
        precio: parseFloat(item.precio),
        disponible: item.disponible === 1,
        url_producto: item.url_producto,
        fecha_actualizacion: item.fecha_actualizacion
      });
      
      return acc;
    }, {});
    
    const resultado = {
      principio_activo: principioActivo,
      farmacias: Object.values(resultadosAgrupados),
      busqueda_realizada: medicamentos.length > 0 ? medicamentos[0].principio_activo : principioActivo,
      total_medicamentos_encontrados: medicamentos.length,
      total_precios_encontrados: precios.length
    };
    
    console.log(`✅ Resultado final: ${resultado.farmacias.length} farmacias`);
    
    resultado.farmacias.forEach(farmacia => {
      console.log(`  🏪 ${farmacia.farmacia.nombre}: ${farmacia.medicamentos.length} medicamentos`);
    });
    
    res.json(resultado);
    
  } catch (error) {
    console.error('❌ Error completo:', error);
    res.status(500).json({ 
      error: 'Error al obtener precios por principio activo',
      details: error.message
    });
  }
});

/**
 * @route   GET /api/medicamentos/test-data
 * @desc    Endpoint de prueba para verificar datos en BD
 * @access  Public
 */
router.get('/test-data', async (req, res) => {
  try {
    console.log('🔍 Verificando datos en la base de datos...');
    
    // Contar medicamentos
    const [countMedicamentos] = await req.db.query('SELECT COUNT(*) as total FROM medicamentos');
    
    // Contar farmacias
    const [countFarmacias] = await req.db.query('SELECT COUNT(*) as total FROM farmacias');
    
    // Contar precios
    const [countPrecios] = await req.db.query('SELECT COUNT(*) as total FROM precios_medicamentos');
    
    // Obtener algunos ejemplos
    const [ejemplosMedicamentos] = await req.db.query('SELECT id, nombre, principio_activo FROM medicamentos LIMIT 5');
    const [ejemplosPrecios] = await req.db.query(`
      SELECT m.nombre, f.nombre as farmacia, pm.precio 
      FROM precios_medicamentos pm 
      JOIN medicamentos m ON pm.medicamento_id = m.id 
      JOIN farmacias f ON pm.farmacia_id = f.id 
      LIMIT 5
    `);
    
    const resultado = {
      medicamentos: {
        total: countMedicamentos[0].total,
        ejemplos: ejemplosMedicamentos
      },
      farmacias: {
        total: countFarmacias[0].total
      },
      precios: {
        total: countPrecios[0].total,
        ejemplos: ejemplosPrecios
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Datos en BD:', resultado);
    res.json(resultado);
    
  } catch (error) {
    console.error('❌ Error verificando datos:', error);
    res.status(500).json({ error: 'Error verificando datos' });
  }
});

module.exports = router;