// models.js
const sequelize = require('../config/database');

// Импорт моделей без их ассоциаций
const User = require('./User');
const Case = require('./Case');
const Item = require('./Item');
const Notification = require('./Notification');
const Marketplace = require('./Marketplace');
const SlotGame = require('./Slot');

// Установление ассоциаций между моделями
Case.hasMany(Item, { foreignKey: 'caseId' });
Item.belongsTo(Case, { foreignKey: 'caseId' });

User.hasMany(Notification, { foreignKey: 'receiverId' });
Notification.belongsTo(User, { foreignKey: 'receiverId' });

SlotGame.hasMany(User, { foreignKey: 'id' })
User.belongsTo(SlotGame, { foreignKey: 'id' })

Marketplace.hasMany(Item, { foreignKey: "caseId" })
Item.belongsTo(Marketplace, { foreignKey: "caseId" })

// Экспорт моделей и sequelize
module.exports = {
   User,
   Notification,
   Case,
   Item,
   Marketplace,
   SlotGame,
   sequelize,
};