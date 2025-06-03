/**
 * API de medicamentos
 * Contiene todas las rutas relacionadas con medicamentos y el comparador de precios
 */

const express = require('express');
const router = express.Router();

/**
 * @route   GET /api/medicamentos/buscar
 * @desc    Buscar medicamentos por nombre o principio activo
 * @access  Public
 */
router.get('/buscar', async (req, res) => {
  const { q } = req.query;
  
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
    
    console.log(`Búsqueda: "${q}" - Encontrados: ${rows.length} medicamentos`);
    res.json(rows);
  } catch (error) {
    console.error('Error al buscar medicamentos:', error);
    res.status(500).json({ error: 'Error al buscar medicamentos' });
  }
});

/**
 * @route   GET /api/medicamentos/precios-por-principio/:principioActivo
 * @desc    Obtener precios de medicamentos por principio activo con imágenes
 * @access  Public
 */
router.get('/precios-por-principio/:principioActivo', async (req, res) => {
  const { principioActivo } = req.params;
  
  try {
    console.log(`Buscando medicamentos con principio activo: "${principioActivo}"`);
    
    // Primero obtener todos los medicamentos con ese principio activo
    const [medicamentos] = await req.db.query(
      `SELECT id, nombre, principio_activo, es_generico, imagen_url 
       FROM medicamentos 
       WHERE principio_activo = ?`,
      [principioActivo]
    );
    
    console.log(`Medicamentos encontrados: ${medicamentos.length}`);
    
    if (medicamentos.length === 0) {
      return res.status(404).json({ error: 'No se encontraron medicamentos con ese principio activo' });
    }
    
    // Obtener los IDs de todos estos medicamentos
    const medicamentoIds = medicamentos.map(med => med.id);
    console.log(`IDs de medicamentos: ${medicamentoIds.join(', ')}`);
    
    // Obtener precios para todos estos medicamentos CON LA IMAGEN
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
    
    console.log(`Precios encontrados: ${precios.length}`);
    
    // Debug: Mostrar algunos datos de ejemplo
    if (precios.length > 0) {
      console.log('Ejemplo de precio encontrado:', {
        medicamento: precios[0].medicamento_nombre,
        imagen: precios[0].medicamento_imagen,
        farmacia: precios[0].farmacia_nombre,
        precio: precios[0].precio
      });
    }
    
    // Agrupar por farmacia y medicamento para mejor visualización
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
      
      acc[item.farmacia_nombre].medicamentos.push({
        id: item.id,
        medicamento_id: item.medicamento_id,
        nombre: item.medicamento_nombre,
        es_generico: item.es_generico === 1,
        imagen_url: item.medicamento_imagen || null, // Asegurar que sea null si está vacío
        precio: parseFloat(item.precio), // Asegurar que sea número
        disponible: item.disponible === 1,
        url_producto: item.url_producto,
        fecha_actualizacion: item.fecha_actualizacion
      });
      
      return acc;
    }, {});
    
    const resultado = {
      principio_activo: principioActivo,
      farmacias: Object.values(resultadosAgrupados)
    };
    
    console.log(`Resultado final: ${resultado.farmacias.length} farmacias`);
    resultado.farmacias.forEach(farmacia => {
      console.log(`${farmacia.farmacia.nombre}: ${farmacia.medicamentos.length} medicamentos`);
      farmacia.medicamentos.forEach(med => {
        console.log(`  - ${med.nombre} (imagen: ${med.imagen_url ? 'SÍ' : 'NO'})`);
      });
    });
    
    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener precios por principio activo:', error);
    res.status(500).json({ error: 'Error al obtener precios por principio activo' });
  }
});

/**
 * @route   GET /api/medicamentos/precios/:id
 * @desc    Obtener precios de un medicamento específico (alternativo)
 * @access  Public
 */
router.get('/precios/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [precios] = await req.db.query(
      `SELECT pm.id, pm.precio, pm.disponible, pm.url_producto, pm.fecha_actualizacion,
              m.nombre as medicamento_nombre, m.imagen_url as medicamento_imagen,
              f.id as farmacia_id, f.nombre as farmacia_nombre, f.logo_url as farmacia_logo
       FROM precios_medicamentos pm
       JOIN medicamentos m ON pm.medicamento_id = m.id
       JOIN farmacias f ON pm.farmacia_id = f.id
       WHERE pm.medicamento_id = ?
       ORDER BY pm.precio ASC`,
      [id]
    );
    
    if (precios.length === 0) {
      return res.status(404).json({ error: 'No se encontraron precios para este medicamento' });
    }
    
    res.json(precios);
  } catch (error) {
    console.error('Error al obtener precios del medicamento:', error);
    res.status(500).json({ error: 'Error al obtener precios del medicamento' });
  }
});

/**
 * @route   GET /api/medicamentos/populares
 * @desc    Obtener los medicamentos más populares
 * @access  Public
 */
router.get('/populares', async (req, res) => {
  try {
    const [rows] = await req.db.query(
      `SELECT id, nombre, principio_activo, es_generico, imagen_url 
       FROM medicamentos 
       ORDER BY RAND()
       LIMIT 10`
    );
    
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener medicamentos populares:', error);
    res.status(500).json({ error: 'Error al obtener medicamentos populares' });
  }
});

/**
 * @route   GET /api/medicamentos/:id
 * @desc    Obtener información detallada de un medicamento
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await req.db.query(
      `SELECT id, nombre, principio_activo, es_generico, imagen_url 
       FROM medicamentos 
       WHERE id = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Medicamento no encontrado' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener medicamento:', error);
    res.status(500).json({ error: 'Error al obtener medicamento' });
  }
});

module.exports = router;