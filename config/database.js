// config/database.js
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DATABASE_URL,
  {
    dialect: "postgres",
    logging: false,
  }
);

// Синхронизация моделей с базой данных
sequelize.sync({ force: false }) // force: true удаляет таблицы и создает их заново
  .then(() => {
    console.log('Таблицы успешно созданы');
  })
  .catch((error) => {
    console.error('Ошибка при создании таблиц:', error);
  });

// Проверка подключения к базе данных
sequelize.authenticate()
  .then(() => {
    console.log('Подключение к базе данных успешно установлено');
  })
  .catch((error) => {
    console.error('Ошибка подключения к базе данных:', error);
  });

module.exports = sequelize;