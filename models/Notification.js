const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
   receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
   },
   message: {
      type: DataTypes.STRING,
      allowNull: false,
   },
   read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
   },
}, {
   timestamps: true,
});



module.exports = Notification;