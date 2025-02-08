const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  // Извлечение токена из заголовка Authorization
  const authHeader = req.header("Authorization");
  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "No authorization header provided" });
  }

  const tokenParts = authHeader.split(" ");
  console.log("Части токена:", tokenParts);
  if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
    console.log("Неправильный формат токена");
    return res.status(401).json({ message: "Invalid Authorization" });
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    console.log("Токен авторизации не найден");
    return res.status(401).json({ message: "No authorization token provided" });
  }
  console.log("Токен:", token);
  console.log("Заголовки запроса:", req.headers);
  // Проверка токена
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Декодированный токен:", decoded);
    req.user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ["password"] },
    });
    if (decoded.exp < Date.now() / 1000) {
      console.log("Токен просрочен");
      return res.status(401).json({ message: "Token is expired" });
    }
    console.log("Пользователь:", req.user);
    if (!req.user) {
      console.log("Пользователь не найден");
      return res.status(401).json({ message: "User  not found" });
    }
    next();
  } catch (error) {
    console.log("Ошибка при проверке токена:", error.message);
    res.status(401).json({ message: "Token is not valid" });
  }
};

const isAdmin = (req, res, next) => {
  console.log("Проверка администратора...");
  if (req.user && req.user.isAdmin) {
    console.log("Администратор найден");
    return next();
  } else {
    console.log("Администратор не найден");
    return res.status(403).json({ message: "Access denied" });
  }
};

const refreshToken = async (req, res) => {
  console.log("Обновление токена...");
  const refreshToken = req.body.refreshToken;
  console.log("Refresh token:", refreshToken);

  if (!refreshToken) {
    console.log("Refresh token не найден");
    return res.status(401).json({ message: "Refresh token не предоставлен" });
  }
  
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    console.log("Декодированный refresh token:", decoded);
    const userId = decoded.userId;
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });
    console.log("Пользователь:", user);

    if (!user) {
      console.log("Пользователь не найден");
      return res.status(404).json({ message: "Пользователь не найден" });
    }

    const newToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    console.log("Новый токен:", newToken);
    const newRefreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    console.log("Новый refresh token:", newRefreshToken);

    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.log("Ошибка при обновлении токена:", error.message);
    res.status(401).json({ message: "Refresh token не валиден" });
  }
};

module.exports = {
  isAuthenticated,
  isAdmin,
  refreshToken,
};
