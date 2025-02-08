const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware");
const User = require("../models/User");
const Case = require("../models/Case");
const Item = require("../models/Item");

//получить пользователей
router.get("/users", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// добавить кейс

router.post("/cases", isAuthenticated, isAdmin, async (req, res) => {
  const { title, description, price, items, image } = req.body;
  console.log("Image URL:", image);
  console.log("Request Body:", req.body);
  const newCase = new Case({ title, description, price, items,image });
  if (!image) {
    return res.status(400).json({ error: "Image URL is required" });
}
console.log("Image URL:", image);
  try {
    const savedCase = await newCase.save();
    res.status(201).json(savedCase);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

//Обновить кейс
router.put("/cases/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const updatedCases = await Case.update(req.body, {
      where: {
        id: req.params.id,
      },
      returning: true, // Возвращает обновленные записи
    });
    // updatedCases - это массив, где первый элемент - это обновленная запись
    res.json(updatedCases);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

//Удалить кейс
router.delete("/cases/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const deletedCase = await Case.destroy({
      where: {
        id: req.params.id,
      },
    });
    if (deletedCase === 0) {
      return res.status(404).json({ message: "Case not found" });
    }
    res.json({ message: "Кейс удален" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});
// новый предмет кейса
router.post("/items", isAuthenticated, isAdmin, async (req, res) => {
  const { name, description, rarity, image } = req.body;

  try {
    // Создание нового элемента с использованием Sequelize
    const newItem = await Item.create({ name, description, rarity, image });

    // Возвращаем созданный элемент
    res.status(201).json(newItem);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

//Изменить предмет кейса
router.put("/items/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const updateItem = await Item.update(req.body, {
      where: {
        id: req.params.id,
      },
    });
    if (!updateItem) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(updateItem);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});
// Удалить предмет кейса

router.delete("/items/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Удаление элемента с использованием Sequelize
    const deletedItem = await Item.destroy({
      where: {
        id: req.params.id,
      },
    });

    if (deletedItem === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({ message: "Item deleted" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

//Обновить баланс кошелька

router.put("/users/:id/wallet", isAuthenticated, isAdmin, async (req, res) => {
  const { walletBalance } = req.body;

  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.walletBalance = walletBalance;
    await user.save();

    res.json(walletBalance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
