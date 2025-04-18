const express = require("express");
const router = express.Router();
const { isAuthenticated, isAdmin } = require("../middleware/authMiddleware");
const Case = require("../models/Case");

router.get("/", async (req, res) => {
  try {
    const cases = await Case.findAll({
      attributes: { exclude: ["items"] }, // Исключаем поле "items"
    });
    res.json(cases); // Отправляем данные клиенту
  } catch (err) {
    res.status(500).json({ message: err.message }); // Обработка ошибок
  }
});

router.get("/:id", async (req, res) => {
  try {
    const caseId = req.params.id;
    const caseData = await Case.findByPk(caseId);

    if (!caseData) {
      return res.status(404).json({ message: "Кейс не найден" });
    }

    res.json(caseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", isAuthenticated, isAdmin, async (req, res) => {
  const newCase = new Case({
    title: req.body.title,
    description: req.body.description,
    price: req.body.price,
    items: req.body.items,
    image: req.body.image || null, // Сохранение URL изображения
  });

  try {
    const savedCase = await newCase.save();
    res.status(201).json(savedCase);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.put("/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const caseToUpdate = await Case.findByPk(req.params.id);
    if (!caseToUpdate) {
      return res.status(404).json({ message: "Case not found" });
    }

    const updatedCase = await caseToUpdate.update(req.body);
    res.json(updatedCase);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete("/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const deleteCase = await Case.destroy({
      where: {
        id: req.params.id,
      },
    });

    if (deleteCase === 0) {
      return res.status(404).json({ message: "Кейс не найден" });
    }

    res.json({ message: "Кейс Удален" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
