// corregir-precios.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de conexión a la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'farmacia_app',
  password: '',
  database: 'farmacia',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function corregirPreciosExistentes() {
  try {
    const pool = mysql.createPool(dbConfig);
    
    console.log('Conectando a la base de datos para corregir precios...');
    
    // Obtener todos los precios
    const [precios] = await pool.query('SELECT id, precio FROM precios_medicamentos');
    
    let actualizados = 0;
    
    for (const precio of precios) {
      // Si el precio está en formato incorrecto (por ejemplo, es muy bajo)
      // asumimos que necesita ser multiplicado por 1000
      if (precio.precio < 100) { // Asumimos que ningún medicamento en Chile cuesta menos de 100 pesos
        const nuevoPrecio = precio.precio * 1000;
        
        await pool.query(
          'UPDATE precios_medicamentos SET precio = ? WHERE id = ?',
          [nuevoPrecio, precio.id]
        );
        
        actualizados++;
      }
    }
    
    console.log(`Se corrigieron ${actualizados} precios en la base de datos`);
    
    await pool.end();
    console.log('Conexión a la base de datos cerrada');
    
  } catch (error) {
    console.error('Error al corregir precios existentes:', error);
  }
}

// Ejecutar la función
corregirPreciosExistentes()
  .then(() => console.log('Proceso completado'))
  .catch(err => console.error('Error en el proceso:', err));