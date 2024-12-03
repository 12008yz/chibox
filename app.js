const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
require('dotenv').config();
const http = require('http');
const socketIO = require('socket.io');
const cronJobs = require('./tasks/cronJobs');
// const checkApiKey = require('./middleware/checkApiKey');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3000;
const app = express();

// Настройка CORS
const corsOptions = {
  origin: true, // Разрешить всем источникам
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
};

app.use(cors(corsOptions));

// Создание HTTP-сервера
const server = http.createServer(app);
const io = socketIO(server, {
  cors: corsOptions,
});

// Подключение маршрутов
const userRoutes = require("./routes/userRoutes");
const caseRoutes = require("./routes/caseRoutes");
const adminRoutes = require("./routes/adminRoutes");
const gamesRoutes = require("./routes/gamesRoutes")(io)
const itemRoutes = require("./routes/itemRoutes")

// Проверка переменных окружения
if (!process.env.JWT_SECRET || !process.env.DATABASE_URL || !process.env.PORT) {
  console.error("Необходимо установить переменные окружения: JWT_SECRET, DATABASE_URL, PORT");
  process.exit(1);
}

// Синхронизация базы данных
// sequelize.sync({force: true})
//   .then(() => {
//     console.log('База данных и таблицы успешно синхронизированы!');
//   })
//   .catch((error) => {
//     console.error('Ошибка при синхронизации базы данных:', error);
//   });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(logger('dev'));

// app.use(checkApiKey); // Middleware для проверки API-ключа

// Ограничение количества запросов
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 800, // ограничить каждый IP до 800 запросов за окно
});
app.use(limiter);

// Подключение маршрутов
app.use('/admin', adminRoutes);
app.use('/users', userRoutes);
app.use('/case', caseRoutes);
app.use('/game', gamesRoutes);
app.use('/item', itemRoutes);

// Запуск cronJobs
cronJobs.startCronJobs(io);

// Обработка 404 ошибок
app.use((req, res, next) => {
  next(createError(404));
});

// Обработка ошибок
app.use((err, req, res, next) => {
  // Установка локальных переменных для отображения ошибок
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Отправка ответа с ошибкой
  res.status(err.status || 500);
  res.render('error');
});

// Обработка онлайн пользователей
let onlineUsers = 0;

io.on('connection', (socket) => {
  onlineUsers++;
  io.emit('onlineUsers', onlineUsers);

  socket.on('disconnect', () => {
    onlineUsers--;
    io.emit('onlineUsers', onlineUsers);
  });
});

// Запуск сервера
if (require.main === module) {
  const server = http.createServer(app);
  server.listen(PORT, () => {
      console.log(`Сервер запущен на http://localhost:${PORT}`);
  });
}
// Экспорт приложения
module.exports = app;