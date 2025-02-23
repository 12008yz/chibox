const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Item = sequelize.define("Item", {
  uniqueId: {
    type: DataTypes.UUID,
    defaultValue: () => require("uuid").v4(),
    primaryKey: true,
  },
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
});

module.exports = Item;
