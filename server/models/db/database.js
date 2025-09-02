const mysql = require('mysql2/promise');
const dotenv=require('dotenv');
dotenv.config();
// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// Crear la conexión
const pool = mysql.createPool(dbConfig);
// verificar conexion
/*pool.getConnection()
  .then(connection => {
    console.log('✅ Conexión exitosa a la BD');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error de conexión:', err.message);
    console.error('❌ Código de error:', err.code);
  });*/
module.exports = pool;
