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
      type: DataTypes.FLOAT, // Используйте FLOAT для чисел с плавающей запятой
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
      type: DataTypes.ARRAY(DataTypes.STRING), // Массив строк для gridState
      allowNull: true,
      validate: {
         isIn: [['red', 'blue', 'green', 'yin_yang', 'hakkero', 'yellow', 'wild']] // Перечисление допустимых значений
      }
   },
   lastSpinResult: {
      type: DataTypes.JSONB, // Используйте JSONB для хранения объектов
      allowNull: true
   },
   manekiNekoFeature: {
      type: DataTypes.JSONB, // Используйте JSONB для хранения объектов
      allowNull: true
   },
   createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW // Устанавливаем текущее время по умолчанию
   },
   updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW // Устанавливаем текущее время по умолчанию
   }
}, {
   timestamps: true, // Sequelize автоматически добавит createdAt и updatedAt
});

module.exports = SlotGame;