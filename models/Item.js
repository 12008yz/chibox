const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Item = sequelize.define("Item", {
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
