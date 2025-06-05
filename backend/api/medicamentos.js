/**
 * API de medicamentos
 * Contiene todas las rutas relacionadas con medicamentos y el comparador de precios
 */

const express = require('express');
const router = express.Router();

/**
 * Función para asignar imagen por defecto basada en el principio activo
 */
const getDefaultImageUrl = (principioActivo, nombre = '') => {
  const activo = principioActivo?.toLowerCase() || '';
  const nombreLower = nombre?.toLowerCase() || '';
  
  // Imágenes específicas por principio activo
  if (activo.includes('ibuprofeno')) {
    return 'https://www.cruzverde.cl/dw/image/v2/BDPM_PRD/on/demandware.static/-/Sites-masterCatalog_Chile/default/dw8f4e4e1e/images/large/103738-ibuprofeno-400-mg-20-comprimidos.jpg';
  }
  
  if (activo.includes('paracetamol')) {
    return 'https://www.cruzverde.cl/dw/image/v2/BDPM_PRD/on/demandware.static/-/Sites-masterCatalog_Chile/default/dw5a7de0d6/images/large/186508-paracetamol-mk-500-mg-20-comprimidos.jpg';
  }
  
  if (activo.includes('gesidol')) {
    return 'https://via.placeholder.com/200x200/ff6b6b/ffffff?text=Gesidol';
  }
  
  if (activo.includes('día') || nombreLower.includes('tapsin día')) {
    return 'https://via.placeholder.com/200x200/4ecdc4/ffffff?text=Tapsin+Día';
  }
  
  if (activo.includes('noche') || nombreLower.includes('tapsin noche')) {
    return 'https://via.placeholder.com/200x200/2c3e50/ffffff?text=Tapsin+Noche';
  }
  
  if (activo.includes('aspirina') || activo.includes('ácido acetilsalicílico')) {
    return 'https://www.cruzverde.cl/dw/image/v2/BDPM_PRD/on/demandware.static/-/Sites-masterCatalog_Chile/default/dw1c5c8c1f/images/large/103715-aspirina-100-mg-30-comprimidos.jpg';
  }
  
  if (activo.includes('avamys')) {
    return 'https://via.placeholder.com/200x200/9b59b6/ffffff?text=Avamys';
  }
  
  // Imagen por defecto
  return 'https://via.placeholder.com/200x200/95a5a6/ffffff?text=Medicamento';
};

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
    
    // Asegurar que todos los medicamentos tengan una imagen
    const medicamentosConImagenes = rows.map(med => ({
      ...med,
      imagen_url: med.imagen_url || getDefaultImageUrl(med.principio_activo, med.nombre)
    }));
    
    console.log(`Búsqueda: "${q}" - Encontrados: ${medicamentosConImagenes.length} medicamentos`);
    res.json(medicamentosConImagenes);
  } catch (error) {
    console.error('Error al buscar medicamentos:', error);
    res.status(500).json({ error: 'Error al buscar medicamentos' });
  }
});

/**
 * @route   GET /api/medicamentos/precios-por-principio/:principioActivo
 * @desc    Obtener precios de medicamentos por principio activo con imágenes garantizadas
 * @access  Public
 */
router.get('/precios-por-principio/:principioActivo', async (req, res) => {
  const { principioActivo } = req.params;
  
  try {
    console.log(`🔍 Buscando medicamentos con principio activo: "${principioActivo}"`);
    
    // Primero obtener todos los medicamentos con ese principio activo
    const [medicamentos] = await req.db.query(
      `SELECT id, nombre, principio_activo, es_generico, imagen_url 
       FROM medicamentos 
       WHERE principio_activo = ?`,
      [principioActivo]
    );
    
    console.log(`📋 Medicamentos encontrados: ${medicamentos.length}`);
    
    if (medicamentos.length === 0) {
      return res.status(404).json({ error: 'No se encontraron medicamentos con ese principio activo' });
    }
    
    // Obtener los IDs de todos estos medicamentos
    const medicamentoIds = medicamentos.map(med => med.id);
    console.log(`🆔 IDs de medicamentos: ${medicamentoIds.join(', ')}`);
    
    // Obtener precios para todos estos medicamentos
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
    
    // Agrupar por farmacia y medicamento
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
      
      // Asegurar que siempre haya una imagen
      const imagenFinal = item.medicamento_imagen || getDefaultImageUrl(principioActivo, item.medicamento_nombre);
      
      acc[item.farmacia_nombre].medicamentos.push({
        id: item.id,
        medicamento_id: item.medicamento_id,
        nombre: item.medicamento_nombre,
        es_generico: item.es_generico === 1,
        imagen_url: imagenFinal, // ¡SIEMPRE TENDRÁ UNA IMAGEN!
        precio: parseFloat(item.precio),
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
    
    console.log(`✅ Resultado final: ${resultado.farmacias.length} farmacias`);
    
    // Debug de imágenes en el resultado final
    resultado.farmacias.forEach(farmacia => {
      console.log(`🏪 ${farmacia.farmacia.nombre}: ${farmacia.medicamentos.length} medicamentos`);
      farmacia.medicamentos.forEach(med => {
        console.log(`  💊 ${med.nombre}`);
        console.log(`     📸 Imagen: ${med.imagen_url}`);
        console.log(`     ✅ Tiene imagen válida: ${!!med.imagen_url}`);
      });
    });
    
    res.json(resultado);
  } catch (error) {
    console.error('Error al obtener precios por principio activo:', error);
    res.status(500).json({ error: 'Error al obtener precios por principio activo' });
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
    
    const medicamento = rows[0];
    
    // Asegurar que tenga una imagen
    if (!medicamento.imagen_url) {
      medicamento.imagen_url = getDefaultImageUrl(medicamento.principio_activo, medicamento.nombre);
    }
    
    res.json(medicamento);
  } catch (error) {
    console.error('Error al obtener medicamento:', error);
    res.status(500).json({ error: 'Error al obtener medicamento' });
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
    
    // Asegurar que todos tengan imágenes
    const medicamentosConImagenes = rows.map(med => ({
      ...med,
      imagen_url: med.imagen_url || getDefaultImageUrl(med.principio_activo, med.nombre)
    }));
    
    res.json(medicamentosConImagenes);
  } catch (error) {
    console.error('Error al obtener medicamentos populares:', error);
    res.status(500).json({ error: 'Error al obtener medicamentos populares' });
  }
});

module.exports = router;