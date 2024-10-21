// db.js
const { Pool } = require('pg');
require('dotenv').config();

// Crear un pool de conexiones
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Conectar y verificar la conexión
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error conectando a la base de datos', err.stack);
  }
  console.log('Conectado a la base de datos');
  release(); // Liberar el cliente
});

module.exports = pool;
