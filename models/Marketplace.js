const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Item = require('./Item');

const Marketplace = sequelize.define('Marketplace', {
   sellerId: {
      type: DataTypes.INTEGER,
      references: {
         model: User,
         key: 'id',
      },
      allowNull: false,
   },
   item: {
      type: DataTypes.INTEGER,
      references: {
         model: Item,
         key: 'id',
      },
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