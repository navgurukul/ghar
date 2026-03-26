require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './lib/migrations'
    },
    seeds: {
      directory: './lib/database/seeds'
    }
  },
  production: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './lib/migrations/'
    },
    seeds: {
      directory: './lib/database/seeds'
    }
  }
};
