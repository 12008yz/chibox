const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const sequelize = require("../config/database");

// Импортируем промежуточное ПО для проверки аутентификации
const { isAuthenticated } = require("../middleware/authMiddleware");

// Импортируем модели
const User = require("../models/User");
const Item = require("../models/Item");
const Marketplace = require("../models/Marketplace");
const Notification = require("../models/Notification");

// Экспортируем маршруты с использованием сокетов
module.exports = (io) => {
  // Обрабатываем POST запрос на создание нового объявления в маркетплейсе
  router.post("/", isAuthenticated, async (req, res) => {
    const { uniqueId, price } = req.body;

    console.log(
      `[LOG] Запрос на продажу предмета: uniqueId=${uniqueId}, price=${price}`
    );

    // Проверка цены
    if (isNaN(price) || price < 1 || price > 1000000) {
      console.log(`[LOG] Некорректная цена: ${price}`);
      return res.status(400).json({ message: "Invalid price" });
    }

    try {
      const user = await User.findByPk(req.user.id);
      if (!user || user.level < 5) {
        console.log(
          `[LOG] Пользователь не найден или уровень ниже 5: userId=${req.user.id}, level=${user?.level}`
        );
        return res
          .status(400)
          .json({ message: "You must be at least level 5 to sell items" });
      }

      console.log(`[LOG] Инвентарь пользователя:`, user.inventory);

      // Проверка наличия предмета в инвентаре
      const inventoryItem = user.inventory.find(
        (item) => item.uniqueId === uniqueId
      );
      if (!inventoryItem) {
        console.log(
          `[LOG] Предмет не найден в инвентаре: uniqueId=${uniqueId}`
        );
        return res.status(404).json({ message: "Item not found in inventory" });
      }

      console.log(`[LOG] Найден предмет в инвентаре:`, inventoryItem);

      // Удаление предмета из инвентаря
      user.inventory = user.inventory.filter(
        (item) => item.uniqueId !== uniqueId
      );
      await user.save();
      console.log(`[LOG] Предмет удален из инвентаря: uniqueId=${uniqueId}`);

      // Создание нового предмета на маркетплейсе
      const marketplaceItem = await Marketplace.create({
        sellerId: user.id,
        itemId: inventoryItem.uniqueId,
        price,
        itemName: inventoryItem.name,
        itemImage: inventoryItem.image,
        rarity: inventoryItem.rarity,
      });

      console.log(
        `[LOG] Предмет успешно добавлен на маркетплейс:`,
        marketplaceItem
      );

      res.status(201).json(marketplaceItem);
    } catch (error) {
      console.error(`[ERROR] Ошибка при продаже предмета:`, error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Получение всех предметов в маркетплейсе
  router.get("/", async (req, res) => {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 30;
      const skip = (page - 1) * limit;
      const { name, rarity, sortBy, order } = req.query;

      let itemFilter = {};
      if (name) {
        itemFilter.name = {
          [Op.iLike]: `%${name}%`, // Используем iLike для нечувствительного к регистру поиска
        };
      }
      if (rarity) itemFilter.rarity = rarity;

      const marketplaceData = await Marketplace.findAll({
        where: itemFilter,
      });
      const totalItemsCount = await Marketplace.count({
        where: itemFilter,
      });

      const paginatedItems = marketplaceData.slice(skip, skip + limit);

      res.json({
        totalPages: Math.ceil(totalItemsCount / limit),
        currentPage: page,
        items: paginatedItems,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error fetching marketplace data" });
    }
  });

  // Получение 1 предмета в маркетплейсе
  router.get("/item/:id", async (req, res) => {
    const { id } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    try {
      // Подсчет общего количества записей для данного id
      console.log(`[LOG] Запрос на получение предмета с id=${id}`);

      const total = await Marketplace.count({
        where: { id: id },
      });

      console.log(`[LOG] Общее количество записей для id=${id}: ${total}`);

      // Получение всех записей для данного id с учетом пагинации
      const items = await Marketplace.findAll({
        where: { id: id },
        include: [
          {
            model: User,
            attributes: ["username"], // Поля, которые вы хотите вернуть
          },
          {
            model: Item,
          },
        ],
        order: [["price", "ASC"]], // Сортировка по цене
        offset: skip, // Пропуск записей
        limit: limit, // Ограничение на количество записей
      });

      console.log(`[LOG] Найдено записей для id=${id}: ${items.length}`);

      // Возвращаем ответ с пагинацией
      res.json({
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        items,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Ошибка при получении данных" });
    }
  });

  // Удаление 1 предмета в маркетплейсе
  router.delete("/:id", isAuthenticated, async (req, res) => {
    try {
      // Поиск элемента в маркетплейсе по id и sellerId
      const item = await Marketplace.findOne({
        where: {
          id: req.params.id,
          sellerId: req.user.id, // Используйте req.user.id вместо req.user._id
        },
      });

      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      // Проверка, является ли текущий пользователь продавцом
      if (item.sellerId.toString() !== req.user.id.toString()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Удаление элемента из маркетплейса
      await Marketplace.destroy({
        where: {
          id: req.params.id,
        },
      });

      // Добавление предмета обратно в инвентарь пользователя
      const user = await User.findByPk(req.user.id); // Используйте findByPk для поиска пользователя
      user.inventory.push({
        id: item.itemId, // Используем itemId вместо item
        name: item.itemName,
        image: item.itemImage,
        rarity: item.rarity,
        createdAt: item.createdAt,
        uniqueId: item.uniqueId,
      });
      await user.save();

      res.json({ message: "Item removed" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Error removing item" });
    }
  });

  router.post("/buy/:id", isAuthenticated, async (req, res) => {
    const transaction = await sequelize.transaction(); // Начинаем транзакцию

    try {
      const item = await Marketplace.findByPk(req.params.id, { transaction });
      const user = await User.findByPk(req.user.id, { transaction });

      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }

      if (user.level < 10) {
        return res
          .status(400)
          .json({ message: "You need to be level 10 to buy this item" });
      }

      if (user.walletBalance < item.price) {
        return res
          .status(400)
          .json({ message: "You don't have enough money to buy" });
      }

      // Обновляем баланс пользователя и добавляем предмет в инвентарь
      user.walletBalance -= item.price;
      const newItem = {
        id: item.itemId, // Используем itemId вместо item
        name: item.itemName,
        image: item.itemImage,
        rarity: item.rarity,
        createdAt: item.createdAt,
        uniqueId: item.uniqueId,
      };
      user.inventory = [...user.inventory, newItem]; // Используем спред-оператор
      await user.save({ transaction });

      // Добавляем деньги продавцу
      const seller = await User.findByPk(item.sellerId, { transaction });
      seller.walletBalance += item.price;
      await seller.save({ transaction });
      console.log(`[LOG] Баланс продавца обновлен:`, seller.walletBalance);

      // Удаляем предмет с маркетплейса
      await Marketplace.destroy({
        where: {
          id: req.params.id,
        },
        transaction,
      });

      // Создаем уведомление
      const newNotification = await Notification.create(
        {
          senderId: user.id,
          receiverId: seller.id,
          type: "message",
          title: "Item Sold",
          content: `Your ${item.itemName} has been sold for K₽${item.price}`,
          message: `Your ${item.itemName} has been sold for K₽${item.price}`,
        },
        { transaction }
      );

      // Завершаем транзакцию
      await transaction.commit();

      // Отправляем уведомления через WebSocket
      io.to(seller.id.toString()).emit("newNotifications", {
        message: `Ваш товар ${item.itemName} был продан на аукционе за ${item.price}`,
      });

      const sellerDataPayload = {
        walletBalance: seller.walletBalance,
        xp: seller.xp,
        level: seller.level,
      };
      io.to(seller.id.toString()).emit("userDataUpdated", sellerDataPayload);

      res.json({ message: "Item bought" });
    } catch (error) {
      await transaction.rollback(); // Откатываем транзакцию в случае ошибки
      console.error(error);
      res
        .status(500)
        .json({ message: "An error occurred while processing your request." });
    }
  });
  return router;
};
