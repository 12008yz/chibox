const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
   username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
   },
   email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
   },
   password: {
      type: DataTypes.STRING,
   },
   walletBalance: {
      type: DataTypes.FLOAT,
      defaultValue: 200,
   },
   inventory: {
      type: DataTypes.JSONB,
      defaultValue: [],
   },
   fixedItem: {
      type: DataTypes.JSONB,
      defaultValue: {},
   },
   xp: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
   },
   level: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
   },
   profilePicture: {
      type: DataTypes.STRING,
      defaultValue: "",
   },
   isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
   },
   nextBonus: {
      type: DataTypes.DATE,
      defaultValue: () => new Date(Date.now() - 86400000),
   },
   bonusAmount: {
      type: DataTypes.FLOAT,
      defaultValue: 1000,
   },
   weeklyWinnings: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
   },
   lastWinningsUpdate: {
      type: DataTypes.DATE,
      defaultValue: new Date(),
   },
}, {
   timestamps: true,
});

module.exports = User;