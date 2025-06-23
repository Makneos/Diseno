const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de base de datos
const dbConfig = {
  host: 'localhost',
  user: 'farmacia_app',
  password: 'Farmacia?#2027',
  database: 'farmacia',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Función para limpiar texto
const limpiarTexto = (texto) => {
  if (!texto) return '';
  return texto
    .replace(/\s+/g, ' ')
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

// Función para limpiar precios chilenos
const limpiarPrecioChileno = (precioStr) => {
  if (!precioStr) return null;
  
  // Eliminar textos como "Precio Internet:" o "Precio farmacia:"
  let limpio = precioStr.replace(/(Precio Internet:|Precio farmacia:)/gi, '').trim();
  
  // Eliminar $ y espacios
  limpio = limpio.replace(/\$|\s/g, '');
  
  // Quitar puntos (separador de miles)
  limpio = limpio.replace(/\./g, '');
  
  // Coma → punto decimal
  limpio = limpio.replace(',', '.');
  
  const precio = parseFloat(limpio);
  return isNaN(precio) ? null : precio;
};

// Función para extraer principio activo
const extraerPrincipioActivo = (nombre) => {
  if (!nombre) return 'Desconocido';
  
  const patrones = [
    /(\w+)\s+\d+\s*mg/i,
    /(\w+)\s+\d+\.\d+\s*%/i,
    /(\w+)\s+\d+\s*%/i,
    /(\w+)\s+\d+\s*g/i,
  ];
  
  for (const patron of patrones) {
    const match = nombre.match(patron);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  const primeraPalabra = nombre.split(' ')[0];
  const palabrasGenericasAEvitar = ['el', 'la', 'los', 'las', 'un', 'una'];
  if (palabrasGenericasAEvitar.includes(primeraPalabra.toLowerCase())) {
    return nombre.split(' ')[1] || 'Desconocido';
  }
  
  return primeraPalabra || 'Desconocido';
};

// Función para buscar medicamento en BD
const buscarMedicamento = async (pool, nombreProducto) => {
  const nombreNormalizado = limpiarTexto(nombreProducto);
  
  // Buscar por nombre exacto
  let [rows] = await pool.query(
    'SELECT id, nombre FROM medicamentos WHERE LOWER(TRIM(nombre)) = LOWER(?)',
    [nombreNormalizado]
  );
  
  if (rows.length > 0) return rows[0];
  
  // Buscar por similitud
  [rows] = await pool.query(
    'SELECT id, nombre FROM medicamentos WHERE LOWER(nombre) LIKE LOWER(?)',
    [`%${nombreNormalizado}%`]
  );
  
  if (rows.length > 0) return rows[0];
  
  // Buscar por principio activo
  const principioActivo = extraerPrincipioActivo(nombreProducto);
  [rows] = await pool.query(
    'SELECT id, nombre FROM medicamentos WHERE LOWER(principio_activo) = LOWER(?)',
    [principioActivo]
  );
  
  return rows.length > 0 ? rows[0] : null;
};

// Función para obtener farmacia por nombre
const obtenerFarmaciaId = async (pool, nombreFarmacia) => {
  const [rows] = await pool.query(
    'SELECT id FROM farmacias WHERE LOWER(nombre) = LOWER(?)',
    [nombreFarmacia]
  );
  
  return rows.length > 0 ? rows[0].id : null;
};

// Función para leer archivo JSON
const leerArchivoJSON = (rutaArchivo) => {
  try {
    if (!fs.existsSync(rutaArchivo)) {
      console.log(`❌ Archivo no encontrado: ${rutaArchivo}`);
      return null;
    }
    
    const contenido = fs.readFileSync(rutaArchivo, 'utf8');
    const datos = JSON.parse(contenido);
    
    // Verificar que sea un array
    if (!Array.isArray(datos)) {
      console.log(`❌ El archivo ${rutaArchivo} debe contener un array de productos`);
      return null;
    }
    
    return datos;
  } catch (error) {
    console.log(`❌ Error al leer ${rutaArchivo}: ${error.message}`);
    return null;
  }
};

// Función para procesar datos de una farmacia
const procesarFarmacia = async (pool, nombreFarmacia, datos) => {
  console.log(`\n🏪 Procesando ${nombreFarmacia}...`);
  
  // Obtener ID de farmacia
  const farmaciaId = await obtenerFarmaciaId(pool, nombreFarmacia);
  if (!farmaciaId) {
    console.log(`❌ Farmacia "${nombreFarmacia}" no encontrada en BD`);
    return { procesados: 0, actualizados: 0, noEncontrados: 0, errores: 0 };
  }
  
  console.log(`📋 Procesando ${datos.length} productos de ${nombreFarmacia} (ID: ${farmaciaId})`);
  
  let stats = {
    procesados: 0,
    actualizados: 0,
    noEncontrados: 0,
    errores: 0
  };
  
  // Procesar cada producto
  for (const producto of datos) {
    stats.procesados++;
    
    try {
      console.log(`📦 ${stats.procesados}/${datos.length}: ${producto.title}`);
      
      // Buscar medicamento
      const medicamento = await buscarMedicamento(pool, producto.title);
      
      if (!medicamento) {
        console.log(`   ❌ No encontrado en BD`);
        stats.noEncontrados++;
        continue;
      }
      
      // Limpiar precio
      const precio = limpiarPrecioChileno(producto.price);
      if (!precio) {
        console.log(`   ❌ Precio inválido: ${producto.price}`);
        stats.errores++;
        continue;
      }
      
      // Actualizar precio (eliminar anterior si existe)
      await pool.query(
        'DELETE FROM precios_medicamentos WHERE medicamento_id = ? AND farmacia_id = ?',
        [medicamento.id, farmaciaId]
      );
      
      // Insertar nuevo precio
      const [result] = await pool.query(
        `INSERT INTO precios_medicamentos 
         (medicamento_id, farmacia_id, precio, url_producto, disponible, fecha_actualizacion) 
         VALUES (?, ?, ?, ?, true, NOW())`,
        [medicamento.id, farmaciaId, precio, producto.image]
      );
      
      console.log(`   ✅ Actualizado: ${medicamento.nombre} → $${precio.toLocaleString('es-CL')}`);
      stats.actualizados++;
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      stats.errores++;
    }
  }
  
  return stats;
};

// Función principal mejorada
async function actualizarPreciosDesdeArchivos() {
  console.log('🚀 Iniciando actualización de precios desde archivos JSON...\n');
  
  try {
    const pool = mysql.createPool(dbConfig);
    console.log('✅ Conexión a base de datos establecida');
    
    // Configuración de archivos y farmacias
    const configuracion = [
      {
        farmacia: 'Ahumada',
        archivo: './ahumada_update.json'
      },
      {
        farmacia: 'Cruz Verde', 
        archivo: './cruzverde_update.json'
      },
      {
        farmacia: 'Salcobrand',
        archivo: './salcobrand_update.json'
      }
    ];
    
    let statsGlobales = {
      procesados: 0,
      actualizados: 0,
      noEncontrados: 0,
      errores: 0
    };
    
    // Procesar cada farmacia
    for (const config of configuracion) {
      const datos = leerArchivoJSON(config.archivo);
      
      if (!datos) {
        console.log(`⏭️  Saltando ${config.farmacia} (archivo no válido)`);
        continue;
      }
      
      const stats = await procesarFarmacia(pool, config.farmacia, datos);
      
      // Sumar a estadísticas globales
      statsGlobales.procesados += stats.procesados;
      statsGlobales.actualizados += stats.actualizados;
      statsGlobales.noEncontrados += stats.noEncontrados;
      statsGlobales.errores += stats.errores;
    }
    
    // Reporte final
    console.log('\n' + '='.repeat(60));
    console.log('📊 REPORTE FINAL DE ACTUALIZACIÓN');
    console.log('='.repeat(60));
    console.log(`📅 Fecha: ${new Date().toLocaleString('es-CL')}`);
    console.log(`📦 Total procesados: ${statsGlobales.procesados}`);
    console.log(`✅ Total actualizados: ${statsGlobales.actualizados}`);
    console.log(`❓ Total no encontrados: ${statsGlobales.noEncontrados}`);
    console.log(`❌ Total errores: ${statsGlobales.errores}`);
    console.log('');
    
    if (statsGlobales.actualizados > 0) {
      console.log('🎉 ¡Actualización completada exitosamente!');
    } else {
      console.log('⚠️  No se actualizó ningún precio');
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  actualizarPreciosDesdeArchivos()
    .then(() => {
      console.log('\n🏁 Proceso finalizado');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n💥 Error fatal:', err);
      process.exit(1);
    });
}

module.exports = { 
  actualizarPreciosDesdeArchivos, 
  limpiarPrecioChileno, 
  extraerPrincipioActivo,
  procesarFarmacia
};