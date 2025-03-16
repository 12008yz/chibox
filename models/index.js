// models.js
const sequelize = require("../config/database");

// Импорт моделей без их ассоциаций
const User = require("./User");
const Case = require("./Case");
const Item = require("./Item");
const Notification = require("./Notification");
const Marketplace = require("./Marketplace");
const SlotGame = require("./Slot");

// Установление ассоциаций между моделями
Case.hasMany(Item, { foreignKey: "caseId" });
Item.belongsTo(Case, { foreignKey: "caseId" });

User.hasMany(Notification, { foreignKey: "receiverId" });
Notification.belongsTo(User, { foreignKey: "receiverId" });

SlotGame.hasMany(User, { foreignKey: "userId" });
User.belongsTo(SlotGame, { foreignKey: "userId" });

Marketplace.hasMany(Item, { foreignKey: "marketplaceId" });
Item.belongsTo(Marketplace, { foreignKey: "marketplaceId" });

User.hasMany(Item, { foreignKey: "userId" });
Item.belongsTo(User, { foreignKey: "userId" });

Marketplace.hasMany(User, { foreignKey: "marketplaceId" });
User.belongsTo(Marketplace, { foreignKey: "marketplaceId" });

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
