const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

router.post('/register', async (req, res) => {
   try {
      const { email, password } = req.body;

      // Проверка на наличие пользователя с таким же email или username
      const existingUser = await User.findOne({
         where: {
            [Op.or]: [{ email }, { username }]
         }
      });

      if (existingUser) {
         return res.status(400).json({ message: 'Пользователь с таким email или username уже существует.' });
      }

      // Хеширование пароля
      const hashedPassword = await bcrypt.hash(password, 10);

      // Создание нового пользователя
      const newUser = await User.create({
         email, password: hashedPassword
      });

      res.status(201).json({ message: 'Пользователь успешно зарегистрирован!' });
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Ошибка при регистрации.' });
   }
}
);

router.post(
   '/login', async (req, res) => {
      const { email, password } = req.body;

      try {
         const user = await User.findOne({ where: { email } });
         if (!user) {
            return res.status(400).json({ message: "Email не найден" });
         }

         // Сравнение введенного пароля с хешированным паролем
         const isMatch = await bcrypt.compare(password, user.password);
         if (!isMatch) {
            return res.status(400).json({ message: "Неверный пароль" });
         }

         // Генерация JWT
         const payload = { userId: user.id };
         try {
            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
            res.json({ message: 'Успешный вход!', token });
         } catch (error) {
            return console.error("Error signing token:", error);
         }
      } catch (error) {
         console.error(error);
      }
   }
);

module.exports = router