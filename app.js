var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
require('dotenv').config();
const { sequelize } = require('./models');
const PORT = process.env.PORT || 5432
var app = express();

const userRoutes = require("./routes/userRoutes");
const caseRoutes = require("./routes/caseRoutes");
const adminRoutes = require("./routes/adminRoutes");
// view engine setup
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin', adminRoutes)
app.use('/users', userRoutes);
app.use('/case', caseRoutes)

if (!process.env.JWT_SECRET || !process.env.DATABASE_URL || !process.env.PORT) {
  console.error("Необходимо установить переменные окружения: JWT_SECRET, DATABASE_URL, PORT");
  process.exit(1);
}
sequelize.sync()
  .then(() => {
    console.log('База данных и таблицы успешно синхронизированы!');
  })
  .catch((error) => {
    console.error('Ошибка при синхронизации базы данных:', error);
  });
// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
