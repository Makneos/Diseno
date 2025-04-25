const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'farmacia_app',
  password: 'Farmacia?#2027',  // La contraseña exacta con la que creaste el usuario
  database: 'farmacia'
});

connection.connect((err) => {
  if (err) {
    console.error('Error conectando a MySQL:', err);
    return;
  }
  console.log('Conexión exitosa a MySQL!');
  connection.end();
});