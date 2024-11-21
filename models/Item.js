const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Case = require('./Case');

const Item = sequelize.define('Item', {
   name: {
      type: DataTypes.STRING,
      allowNull: false,
   },
   image: {
      type: DataTypes.STRING,
   },
   rarity: {
      type: DataTypes.STRING,
      allowNull: false,
   },
   caseId: {
      type: DataTypes.INTEGER,
      allowNull: true,
   },
}, {
   timestamps: true,
});

module.exports = Item;