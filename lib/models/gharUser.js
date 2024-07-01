const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true, // Validates that the field is a valid email, implicitly checks for "@"
      len: [1, 150], // Validates the field's length is between 1 and 150 characters
    },
  },
}, {
  tableName: 'ghar_users',
  timestamps: false,
});

module.exports = User;