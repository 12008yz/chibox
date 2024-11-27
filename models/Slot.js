const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const SlotGame = sequelize.define('SlotGame', {
   userId: {
      type: DataTypes.INTEGER,
      references: {
         model: User,
         key: 'id'
      },
      allowNull: false
   },
   betAmount: {
      type: DataTypes.FLOAT,
      allowNull: false
   },
   turboMode: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
   },
   autoSpin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
   },
   gridState: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: true,
      validate: {
         isIn: [['red', 'blue', 'green', 'yin_yang', 'hakkero', 'yellow', 'wild']]
      }
   },
   lastSpinResult: {
      type: DataTypes.JSONB,
      allowNull: true
   },
   manekiNekoFeature: {
      type: DataTypes.JSONB,
      allowNull: true
   },
   createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
   },
   updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
   }
}, {
   timestamps: true,
});

module.exports = SlotGame;