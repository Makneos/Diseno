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
    
    res.json(rows);
  } catch (error) {
    console.error('Error al buscar medicamentos:', error);
    res.status(500).json({ error: 'Error al buscar medicamentos' });
  }
});

/**
 * @route   GET /api/medicamentos/precios/:id
 * @desc    Obtener precios de un medicamento específico
 * @access  Public
 */
router.get('/precios/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await req.db.query(
      `SELECT pm.id, pm.precio, pm.disponible, pm.url_producto, pm.fecha_actualizacion,
              f.id as farmacia_id, f.nombre as farmacia_nombre, f.logo_url as farmacia_logo
       FROM precios_medicamentos pm
       JOIN farmacias f ON pm.farmacia_id = f.id
       WHERE pm.medicamento_id = ?
       ORDER BY pm.precio ASC`,
      [id]
    );
    
    // Formatear los resultados
    const formattedResults = rows.map(row => ({
      id: row.id,
      precio: row.precio,
      disponible: row.disponible === 1,
      url_producto: row.url_producto,
      fecha_actualizacion: row.fecha_actualizacion,
      farmacia: {
        id: row.farmacia_id,
        nombre: row.farmacia_nombre,
        logo_url: row.farmacia_logo
      }
    }));
    
    res.json(formattedResults);
  } catch (error) {
    console.error('Error al obtener precios de medicamento:', error);
    res.status(500).json({ error: 'Error al obtener precios de medicamento' });
  }
});

/**
 * @route   GET /api/medicamentos/populares
 * @desc    Obtener los medicamentos más populares
 * @access  Public
 */
router.get('/populares', async (req, res) => {
  try {
    // En una implementación completa, esta consulta estaría basada en estadísticas reales
    const [rows] = await req.db.query(
      `SELECT id, nombre, principio_activo, es_generico, imagen_url 
       FROM medicamentos 
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