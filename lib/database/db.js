// const { Pool } = require('pg');

// const pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'sansaar1',
//   password: 'Ujjwal@21',
// });

// // Test the connection
// pool.query('SELECT 1;', (err, res) => {
//   if (err) {
//     console.error('Database connection test failed:', err.stack);
//   } else {
//     console.log('Database connection test succeeded:', res.rows);
//   }
// });

// module.exports = {
//   pool, // Export the pool object for direct access
//   query: (text, params, callback) => {
//     console.log(text, params, callback, 'text, params, callback');
//     return pool.query(text, params, callback);
//   },
// };


const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
});

module.exports = sequelize;