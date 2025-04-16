const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const GharDiscordId = sequelize.define('GharDiscordId', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      len: [1, 150],
    },
  },
  discordId: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  }
}, {
  tableName: 'ghar_discordId',
  timestamps: false,
});

module.exports = GharDiscordId;
