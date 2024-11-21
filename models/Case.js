const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Item = require('./Item');

const Case = sequelize.define('Case', {
   title: {
      type: DataTypes.STRING,
      allowNull: false,
   },
   image: {
      type: DataTypes.STRING,
   },
   price: {
      type: DataTypes.FLOAT,
      allowNull: false,
   },
}, {
   timestamps: true,
});

module.exports = Case;