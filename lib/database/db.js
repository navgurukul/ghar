const { Sequelize } = require("sequelize");
const config=require("../config");

const sequelize = new Sequelize(config.postgresql.database_url, {
  dialect: "postgres",
  logging: false,
});

module.exports = sequelize;
