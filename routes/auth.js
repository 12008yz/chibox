const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const User = require("../models/User");

router.post("/register", async (req, res) => {
  const { email, password, username } = req.body;

  try {
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({
          message: "Пользователь с таким email или username уже существует.",
        });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      email,
      password: hashedPassword,
      username,
    });

    res.status(201).json({ message: "Пользователь успешно зарегистрирован!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка при регистрации." });
  }
});

// Логин
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Email не найден" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Неверный пароль" });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ message: "Успешный вход!", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

module.exports = router;
