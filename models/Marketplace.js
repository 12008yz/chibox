const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Item = require('./Item');

const Marketplace = sequelize.define('Marketplace', {
   sellerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
   },
   item: {
      type: DataTypes.INTEGER,
      allowNull: false,
   },
   uniqueId: {
      type: DataTypes.STRING,
      defaultValue: () => require('uuid').v4(),
   },
   price: {
      type: DataTypes.FLOAT,
      allowNull: false,
   },
   itemName: {
      type: DataTypes.STRING,
      allowNull: false,
   },
   itemImage: {
      type: DataTypes.STRING,
      allowNull: false,
   },
   rarity: {
      type: DataTypes.STRING,
      allowNull: false,
   },
}, {
   timestamps: true,
});

module.exports = Marketplace;