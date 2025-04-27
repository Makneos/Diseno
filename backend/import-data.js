// import-data.js
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de conexión a la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'farmacia',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Función para limpiar texto (eliminar caracteres especiales, espacios extras, etc.)
const limpiarTexto = (texto) => {
  if (!texto) return '';
  
  return texto
    .replace(/\s+/g, ' ')  // Reemplazar múltiples espacios por uno solo
    .trim()                // Eliminar espacios al inicio y final
    .normalize("NFD")      // Normalizar acentos
    .replace(/[\u0300-\u036f]/g, ""); // Eliminar acentos
};

// Función para limpiar precios y convertirlos a números
const limpiarPrecio = (precioStr) => {
  if (!precioStr) return null;
  
  // Eliminar textos como "Precio Internet:" o "Precio farmacia:"
  let limpio = precioStr.replace(/(Precio Internet:|Precio farmacia:)/gi, '').trim();
  
  // Extraer el número y eliminar caracteres no numéricos excepto puntos y comas
  limpio = limpio.replace(/[^\d,.]/g, '');
  
  // Eliminar todos los puntos (separadores de miles)
  limpio = limpio.replace(/\./g, '');
  
  // Reemplazar coma por punto (para el separador decimal si existe)
  limpio = limpio.replace(',', '.');
  
  return parseFloat(limpio);
};

// Función para extraer el principio activo del nombre del medicamento
const extraerPrincipioActivo = (nombre) => {
  if (!nombre) return 'Desconocido';
  
  // Patrones comunes para principios activos (muy simplificado)
  const patrones = [
    /(\w+)\s+\d+\s*mg/i,  // Ejemplo: "Paracetamol 500 mg"
    /(\w+)\s+\d+\.\d+\s*%/i,  // Ejemplo: "Clotrimazol 1.5%"
    /(\w+)\s+\d+\s*%/i,   // Ejemplo: "Clotrimazol 1%"
    /(\w+)\s+\d+\s*g/i,   // Ejemplo: "Tapsin 5g"
  ];
  
  for (const patron of patrones) {
    const match = nombre.match(patron);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Si no se encuentra un patrón específico, tomar la primera palabra
  // (esto es muy simplificado y puede requerir una lógica más sofisticada)
  const primeraPalabra = nombre.split(' ')[0];
  
  // Evitar palabras genéricas como "El", "La", etc.
  const palabrasGenericasAEvitar = ['el', 'la', 'los', 'las', 'un', 'una'];
  if (palabrasGenericasAEvitar.includes(primeraPalabra.toLowerCase())) {
    return nombre.split(' ')[1] || 'Desconocido';
  }
  
  return primeraPalabra || 'Desconocido';
};

// Detectar si un medicamento es genérico basado en su nombre
const esGenerico = (nombre) => {
  const patronesGenericos = [
    /\(B\)/i,             // Ejemplo: "Paracetamol (B)"
    /\bgeneric[oa]\b/i,   // Ejemplo: "Paracetamol Genérico"
  ];
  
  return patronesGenericos.some(patron => patron.test(nombre));
};

// Función principal para importar datos
async function importarDatos() {
  try {
    // Crear pool de conexión
    const pool = mysql.createPool(dbConfig);
    
    console.log('Conexión a la base de datos establecida');
    
    // 1. Primero, insertar las farmacias
    console.log('Insertando farmacias...');
    
    const farmacias = [
      { nombre: 'Ahumada', sitio_web: 'https://www.farmaciasahumada.cl', logo_url: 'https://www.farmaciasahumada.cl/logo.png' },
      { nombre: 'Cruz Verde', sitio_web: 'https://www.cruzverde.cl', logo_url: 'https://www.cruzverde.cl/logo.png' },
      { nombre: 'Salcobrand', sitio_web: 'https://salcobrand.cl', logo_url: 'https://salcobrand.cl/logo.png' }
    ];
    
    // Insertar farmacias
    const farmaciaIds = {};
    for (const farmacia of farmacias) {
      const [result] = await pool.query(
        'INSERT INTO farmacias (nombre, sitio_web, logo_url, activo) VALUES (?, ?, ?, true) ON DUPLICATE KEY UPDATE sitio_web = VALUES(sitio_web), logo_url = VALUES(logo_url)',
        [farmacia.nombre, farmacia.sitio_web, farmacia.logo_url]
      );
      
      // Si la farmacia ya existía, obtener su ID
      if (result.insertId === 0) {
        const [rows] = await pool.query('SELECT id FROM farmacias WHERE nombre = ?', [farmacia.nombre]);
        farmaciaIds[farmacia.nombre] = rows[0].id;
      } else {
        farmaciaIds[farmacia.nombre] = result.insertId;
      }
    }
    
    console.log('Farmacias insertadas:', farmaciaIds);
    
    // 2. Procesar los archivos JSON y preparar los datos para inserción
    console.log('Procesando archivos JSON...');
    
    // Cargar los archivos JSON
    const ahumadaData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'ahumada_medicamentos.json'), 'utf8'));
    const cruzVerdeData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'cruzverde_medicamentos_respiratorios.json'), 'utf8'));
    const salcobrandData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'salcobrand_medicamentos.json'), 'utf8'));
    // Mapa para rastrear medicamentos ya procesados (evitar duplicados)
    const medicamentosMap = new Map();
    
    // Procesar datos de Ahumada
    console.log(`Procesando ${ahumadaData.length} productos de Ahumada...`);
    procesarDatosMedicamentos(ahumadaData, 'Ahumada', medicamentosMap);
    
    // Procesar datos de Cruz Verde
    console.log(`Procesando ${cruzVerdeData.length} productos de Cruz Verde...`);
    procesarDatosMedicamentos(cruzVerdeData, 'Cruz Verde', medicamentosMap);
    
    // Procesar datos de Salcobrand
    console.log(`Procesando ${salcobrandData.length} productos de Salcobrand...`);
    procesarDatosMedicamentos(salcobrandData, 'Salcobrand', medicamentosMap);
    
    // 3. Insertar medicamentos en la base de datos
    console.log(`Insertando ${medicamentosMap.size} medicamentos únicos...`);
    
    const medicamentoIds = {};
    for (const [nombreNormalizado, medicamento] of medicamentosMap.entries()) {
      const [result] = await pool.query(
        'INSERT INTO medicamentos (nombre, principio_activo, es_generico, imagen_url) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)',
        [
          medicamento.nombre,
          medicamento.principioActivo,
          medicamento.esGenerico,
          medicamento.imagen || null
        ]
      );
      
      // Si el medicamento ya existía, obtener su ID
      if (result.insertId === 0) {
        const [rows] = await pool.query('SELECT id FROM medicamentos WHERE nombre = ?', [medicamento.nombre]);
        medicamentoIds[nombreNormalizado] = rows[0].id;
      } else {
        medicamentoIds[nombreNormalizado] = result.insertId;
      }
    }
    
    console.log(`Medicamentos insertados: ${Object.keys(medicamentoIds).length}`);
    
    // 4. Insertar precios de medicamentos
    console.log('Insertando precios de medicamentos...');
    
    // Función para insertar precios de una farmacia específica
    async function insertarPrecios(datos, farmacia) {
      const farmaciaId = farmaciaIds[farmacia];
      
      if (!farmaciaId) {
        console.error(`ID de farmacia no encontrado para: ${farmacia}`);
        return;
      }
      
      let insertadosExitosamente = 0;
      let actualizadosExitosamente = 0;
      
      for (const item of datos) {
        const nombreNormalizado = limpiarTexto(item.title);
        const medicamentoId = medicamentoIds[nombreNormalizado];
        
        if (!medicamentoId) {
          continue; // Saltar si no encontramos el medicamento
        }
        
        const precio = limpiarPrecio(item.price);
        
        if (!precio) {
          continue; // Saltar si no hay un precio válido
        }
        
        try {
          // Usar ON DUPLICATE KEY UPDATE para actualizar precios si ya existe la entrada
          const [result] = await pool.query(
            'INSERT INTO precios_medicamentos (medicamento_id, farmacia_id, precio, url_producto, disponible, fecha_actualizacion) ' +
            'VALUES (?, ?, ?, ?, true, NOW()) ' +
            'ON DUPLICATE KEY UPDATE precio = VALUES(precio), fecha_actualizacion = NOW()',
            [medicamentoId, farmaciaId, precio, null]
          );
          
          if (result.affectedRows === 1 && result.insertId > 0) {
            insertadosExitosamente++;
          } else if (result.affectedRows === 2) {
            actualizadosExitosamente++;
          }
        } catch (error) {
          console.error(`Error al insertar/actualizar precio para ${item.title}:`, error.message);
        }
      }
      
      return { insertados: insertadosExitosamente, actualizados: actualizadosExitosamente };
    }

// Insertar precios de cada farmacia
const ahumadaResultado = await insertarPrecios(ahumadaData, 'Ahumada');
const cruzVerdeResultado = await insertarPrecios(cruzVerdeData, 'Cruz Verde');
const salcobrandResultado = await insertarPrecios(salcobrandData, 'Salcobrand');

console.log(`Precios insertados: Ahumada=${ahumadaResultado.insertados} (${ahumadaResultado.actualizados} actualizados), Cruz Verde=${cruzVerdeResultado.insertados} (${cruzVerdeResultado.actualizados} actualizados), Salcobrand=${salcobrandResultado.insertados} (${salcobrandResultado.actualizados} actualizados)`);
    // Cerrar la conexión
    await pool.end();
    
    console.log('¡Importación completada exitosamente!');
  
  } catch (error) {
    console.error('Error durante la importación:', error);
  }
}

// Función auxiliar para procesar datos de medicamentos
function procesarDatosMedicamentos(datos, farmacia, medicamentosMap) {
  for (const item of datos) {
    if (!item.title) continue;
    
    const nombre = item.title;
    const nombreNormalizado = limpiarTexto(nombre);
    
    // Evitar guardar entradas sin nombre significativo
    if (nombreNormalizado.length < 3) continue;
    
    // Si este medicamento ya fue procesado, solo actualizamos la imagen si no tenía
    if (medicamentosMap.has(nombreNormalizado)) {
      const medicamentoExistente = medicamentosMap.get(nombreNormalizado);
      if (!medicamentoExistente.imagen && item.image && !item.image.includes('msb-logo')) {
        medicamentoExistente.imagen = item.image;
      }
      continue;
    }
    
    // Procesar nuevo medicamento
    medicamentosMap.set(nombreNormalizado, {
      nombre: nombre,
      principioActivo: extraerPrincipioActivo(nombre),
      esGenerico: esGenerico(nombre),
      imagen: (item.image && !item.image.includes('msb-logo')) ? item.image : null,
      farmacias: [farmacia]
    });
  }
}

// Ejecutar la función principal
importarDatos()
  .then(() => console.log('Proceso finalizado'))
  .catch(err => console.error('Error en proceso principal:', err));