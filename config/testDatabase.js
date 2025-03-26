require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  "postgres://postgres:123@localhost:5432/chibox",
  {
    dialect: "postgres",
    logging: console.log, // Включаем логирование
  }
);

// Проверка подключения к базе данных
sequelize
  .authenticate()
  .then(() => {
    console.log("Подключение к базе данных успешно установлено");
  })
  .catch((error) => {
    console.error("Ошибка подключения к базе данных:", error);
  });

module.exports = sequelize;
