const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const Case = require("../models/Case");
const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware");

// Получение всех предметов
router.get("/", async (req, res) => {
  try {
    const items = await Item.findAll();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Добавление нового предмета
router.post("/", isAuthenticated, isAdmin, async (req, res) => {
  const newItem = {
    name: req.body.name,
    image: req.body.image,
    rarity: req.body.rarity,
    caseId: req.body.caseId,
  };

  try {
    const savedItem = await Item.create(newItem);

    // Найти кейс с указанным id
    const caseToUpdate = await Case.findByPk(req.body.caseId);
    if (!caseToUpdate) {
      return res.status(404).json({ message: "Case not found" });
    }

    // Добавить id сохраненного предмета в массив items кейса
    caseToUpdate.items.push(savedItem.id);
    await caseToUpdate.save();

    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Обновление предмета
router.put("/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const itemToUpdate = await Item.findByPk(req.params.id);
    if (!itemToUpdate) {
      return res.status(404).json({ message: "Item not found" });
    }

    const updatedItem = await itemToUpdate.update(req.body);
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Удаление предмета
router.delete("/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
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
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;