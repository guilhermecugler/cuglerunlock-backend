const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Tool = sequelize.define('Tool', {
  value: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  text: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Tool;
