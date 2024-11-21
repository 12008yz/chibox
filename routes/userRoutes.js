const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { check, validationResult } = require("express-validator");
const authMiddleware = require('../middleware/authMiddleware')
const User = require('../models/User');
const Notification = require('../models/Notification');
const Item = require('../models/Item');





// Регистрация
router.post(
   '/register',
   [
      check("email", "Введите правильный email").isEmail(),
      check("password", "Введите пароль больше 6 символов").isLength({ min: 6 }),
      check("username", "Введите имя").not().isEmpty(),
   ],
   async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
      }
      // Функция для получения изображения по умолчанию
      const getRandomPlaceholderImage = () => {
         return 'https://example.com/default-profile-picture.png'; 
      };


      const { email, password, username, profilePicture } = req.body;

      try {
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
            username,
            email,
            password: hashedPassword,
            profilePicture: profilePicture || getRandomPlaceholderImage(), // Использование изображения по умолчанию
            isAdmin: false // Если у вас есть поле isAdmin
         });

         res.status(201).json({ message: 'Пользователь успешно зарегистрирован!' });
      } catch (error) {
         console.error(error);
         res.status(500).json({ message: 'Ошибка при регистрации.' });
      }
   }
);

// Логин
router.post(
   '/login',
   [check("email", "Пожалуйста, укажите действительный адрес электронной почты").isEmail(),
   check('password', 'Требуется ввести пароль').exists()],
   async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
      }

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

// Получение уведомлений
router.get("/notifications", authMiddleware.isAuthenticated, async (req, res) => {
   const page = Number(req.query.page) || 1;
   const limit = 10;
   const offset = (page - 1) * limit;

   try {
      //Поиск уведомлений
      const notifications = await Notification.findAll({
         where: { receiverId: req.user.id },
         order: [['createdAt', 'DESC']],
         limit: limit,
         offset: offset,
      });

      // Отправка уведомлений в ответ
      res.json(notifications);

      // Установка всех уведомлений как прочитанных
      await Notification.update(
         { read: true },
         {
            where: {
               receiverId: req.user.id,
               read: false,
            },
         }
      );
   } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Ошибка сервера' });
   }
});

// Получение данных вошедшего пользователя

router.get('/me', authMiddleware.isAuthenticated, async (req, res) => {
   try {
      const {
         id: id,
         username,
         profilePicture,
         xp,
         level,
         walletBalance,
         nextBonus
      } = req.user

      const unreadNotifications = await Notification.findAll({ receiverId: req.user.id, read: false })
      const hasUnreadNotifications = unreadNotifications.length > 0;
      res.json({
         id, username, profilePicture, xp, level, walletBalance, nextBonus, hasUnreadNotifications
      })
   } catch (err) {
      console.error(err.message);
      res.status(500).send("Ошибка сервера");
   }
})

// Поиск рейтинга игроков

router.get('/topPlayers', async (req, res) => {
   try {
      const topPlayers = await User.findAll({
         order: [['weeklyWinnings', 'DESC']], // Сортировка по weeklyWinnings по убыванию
         limit: 10, // Топ 10 игроков
         attributes: ['id', 'username', 'weeklyWinnings', 'profilePicture', 'level', 'fixedItem'] // Выбор нужных полей
      });

      res.json(topPlayers);
   } catch (err) {
      res.status(500).json({ message: 'Ошибка сервера' });
   }
})

// Выборка рейтинга пользователей

router.get('/ranking', authMiddleware.isAuthenticated, async (req, res) => {
   const userId = req.user.id; // Получаем id пользователя из запроса

   try {
      // Получаем всех пользователей, сортируя по weeklyWinnings
      const allUsers = await User.findAll({
         attributes: ['username', 'weeklyWinnings', 'id'],
         order: [['weeklyWinnings', 'DESC']],
      });

      const userIndex = allUsers.findIndex(u => u.id === userId);

      let start = userIndex - 3; // Получаем 3 пользователя выше
      let end = userIndex + 4; // Получаем 3 пользователя ниже (+1 для включения)

      // Корректируем, если start или end выходит за границы
      if (start < 0) {
         start = 0;
         end = Math.min(7, allUsers.length); // Корректируем end, если start был изменён
      }
      if (end > allUsers.length) {
         end = allUsers.length;
         start = Math.max(0, end - 7); // Корректируем start, если end был изменён
      }

      const surroundingUsers = allUsers.slice(start, end);

      res.json({ ranking: userIndex + 1, users: surroundingUsers });
   } catch (err) {
      console.error(err); // Логируем ошибку для отладки
      res.status(500).json({ message: 'Server error' });
   }
});

// Добавить предмет в инвентарь 

router.post('/inventory', authMiddleware.isAuthenticated, async (req, res) => {
   try {
      const { itemId } = req.body;
      const user = await User.findByPk(req.user.id);

      if (!user) {
         return res.status(404).json({ message: 'Пользователь не найден' });
      }

      // Добавить предмет в инвентарь
      user.inventory.push(itemId);

      // Сохранить изменения в базе данных
      await user.save(); // Не забудьте сохранить изменения

      // Отправить успешный ответ
      res.status(200).json({ message: 'Предмет успешно добавлен в инвентарь' });
   } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Ошибка сервера' });
   }
});

// Удаление предмета из инвентаря 

router.delete(
   "/inventory/:itemId",
   authMiddleware.isAuthenticated,
   async (req, res) => {
      try {
         const { itemId } = req.params;

         const user = await User.findByPk(req.user.id);

         if (!user) {
            return res.status(404).json({ message: "User not found" });
         }

         // Remove item from inventory
         user.inventory = user.inventory.filter(
            (item) => item.toString() !== itemId
         );

         // Save the changes
         await user.save();

         res.json(user.inventory);
      } catch (err) {
         console.error(err.message);
         res.status(500).json({ message: "Server error" });
      }
   }
);

//Установить фиксированный элемент

router.put("/fixedItem", authMiddleware.isAuthenticated, async (req, res) => {
   try {
      const { itemId } = req.body; // Предполагается, что itemId передается в теле запроса

      const user = await User.findByPk(req.user.id);

      if (!user) {
         return res.status(404).json({ message: "Пользователь не найден" });
      }

      // Проверяем, есть ли предмет в инвентаре пользователя
      const inventoryItem = user.inventory.find((inventoryItem) => {
         return inventoryItem.id === itemId;
      });

      if (!inventoryItem) {
         return res.status(404).json({ message: "Предмет не найден в инвентаре" });
      }

      // Обновляем фиксированный предмет, сохраняя то же описание
      user.fixedItem = {
         name: inventoryItem.name,
         image: inventoryItem.image,
         rarity: inventoryItem.rarity,
         description: user.fixedItem.description, // Сохраняем существующее описание
      };

      await user.save(); // Сохраняем обновленного пользователя

      res.json(user.fixedItem); // Возвращаем обновленный фиксированный предмет
   } catch (err) {
      console.error(err.message);
      res.status(500).send("Ошибка сервера");
   }
});

// Обновить описание fixed item 

router.put(
   "/fixedItem/description",
   authMiddleware.isAuthenticated,
   async (req, res) => {
      try {
         const { description } = req.body;

         const user = await User.findByPk(req.user.id);
         if (!user) {
            return res.status(404).json({ message: "Пользователь не найден" });
         }

         // Обновляем описание фиксированного предмета (обрезаем до 50 символов)
         user.fixedItem.description = description.substring(0, 50);

         await user.save(); // Сохраняем изменения

         res.json(user.fixedItem); // Возвращаем обновленный фиксированный предмет
      } catch (err) {
         console.error(err.message);
         res.status(500).send("Ошибка сервера");
      }
   }
);

// Получить бонус 

router.post('/claimBonus', authMiddleware.isAuthenticated, async (req, res) => {
   try {
      const user = await User.findByPk(req.user.id); // Получаем пользователя по его ID

      if (!user) {
         return res.status(404).json({ message: 'Пользователь не найден' });
      }

      const currentTime = new Date();
      const nextBonusTime = new Date(user.nextBonus);

      // Проверяем, доступен ли бонус
      if (currentTime >= nextBonusTime) {
         const currentBonus = user.bonusAmount; // Получаем текущую сумму бонуса
         user.walletBalance += currentBonus; // Добавляем бонус к кошельку

         user.nextBonus = new Date(currentTime.getTime() + 8 * 60000); // Устанавливаем время следующего бонуса на 8 минут позже
         // Устанавливаем сумму бонуса в 200 * 10% от текущего уровня пользователя
         user.bonusAmount = Math.floor(200 * (1 + 0.1 * user.level));

         // Сохраняем обновленного пользователя
         await user.save();

         res.json({ message: `Получено ₽${currentBonus}!`, value: currentBonus, nextBonus: user.nextBonus });

      } else {
         res.status(400).json({ message: 'Бонус еще не доступен' });
      }
   } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Ошибка сервера' });
   }
});


const isValidBase64 = (str) => {
   const base64Regex = /^data:image\/(png|jpeg|jpg);base64,/;
   return base64Regex.test(str);
};

// img user 

router.put('/profilePicture', authMiddleware.isAuthenticated, async (req, res) => {
   try {
      const newProfilePicture = req.body.image;

      if (!isValidBase64(newProfilePicture)) {
         return res.status(400).json({ message: 'Invalid image format' });
      }

      const user = await User.findById(req.user._id);

      if (!user) {
         return res.status(404).json({ message: 'User not found' });
      }

      user.profilePicture = newProfilePicture;

      await user.save();

      res.json({ message: 'Profile picture updated' });
   } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
   }
});

// getUserById

router.get("/:id", async (req, res) => {
   try {
      const userId = req.params.id;

      // Получение пользователя, исключая поля inventory и password
      const user = await User.findOne({
         where: { id: userId },
         attributes: { exclude: ['inventory', 'password'] },
      });

      if (!user) {
         return res.status(404).json({ message: "User  not found" });
      }

      res.json(user);
   } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
   }
});


// Роуты должны быть внизу.
// Получить инвентарь user

const ITEMS_PER_PAGE = 18;

router.get("/inventory/:userId", async (req, res) => {
   try {
      const { userId } = req.params; // Извлекаем userId из параметров
      const { name, rarity, sortBy, order, caseId } = req.query; // Извлекаем параметры запроса
      const page = parseInt(req.query.page) || 1; // Устанавливаем номер страницы

      // Получаем пользователя
      const user = await User.findByPk(userId);
      if (!user) {
         return res.status(404).json({ message: "User  not found" });
      }

      // Начинаем формировать условия для выборки инвентаря
      const whereConditions = {
         ...(caseId && { caseId }),
      };

      // Добавляем дополнительные условия для фильтрации
      if (caseId) {
         whereConditions.caseId = caseId; // Фильтрация по caseId
      }

      if (name) {
         whereConditions.name = {
            [Op.iLike]: `%${name}%`, // Фильтрация по имени (нечувствительно к регистру)
         };
      }

      if (rarity) {
         whereConditions.rarity = rarity; // Фильтрация по редкости
      }


      // Получаем общее количество предметов
      const totalItems = await Item.count({
         where: whereConditions,
      });

      const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE); // Вычисляем общее количество страниц

      // Получаем предметы инвентаря с учетом пагинации и сортировки
      const inventoryItems = await Item.findAll({
         where: whereConditions,
         order: getOrderQuery(sortBy, order), // Вызов функции для получения условий сортировки
         limit: ITEMS_PER_PAGE,
         offset: (page - 1) * ITEMS_PER_PAGE,
      });

      // Возвращаем результат
      res.json({
         items: inventoryItems,
         currentPage: page,
         totalPages: totalPages,
      });
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Ошибка сервера" });
   }
});

// Функция для получения условий сортировки
const getOrderQuery = (sortBy, order) => {
   const sortQuery = [];
   if (sortBy) {
      switch (sortBy) {
         case "older":
            sortQuery.push(['createdAt', 'ASC']);
            break;
         case "newer":
            sortQuery.push(['createdAt', 'DESC']);
            break;
         case "mostRare":
            sortQuery.push(['rarity', 'DESC']);
            break;
         case "mostCommon":
            sortQuery.push(['rarity', 'ASC']);
            break;
         default:
            sortQuery.push([sortBy, order === 'asc' ? 'ASC' : 'DESC']);
            break;
      }
   }
   return sortQuery;
};


module.exports = router;
