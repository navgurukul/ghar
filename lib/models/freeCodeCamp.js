const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const User = sequelize.define('fcc_courses', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  certification: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 250], // Validates the field's length is between 1 and 150 characters
    },
  },
  course_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 250], // Validates the field's length is between 1 and 150 characters
    },
  },
  challenge_name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 250], // Validates the field's length is between 1 and 150 characters
    },
  },
  challenge_id: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 250], // Validates the field's length is between 1 and 150 characters
    },
  },
}, {
  tableName: 'fcc_courses',
  timestamps: false,
});

module.exports = User;